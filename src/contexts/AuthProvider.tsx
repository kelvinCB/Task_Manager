import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabaseClient';
import { AuthContext } from './AuthContextDef';
import {
  clearActivity,
  getLastActivity,
  isSessionInactive,
  recordActivity
} from '../utils/authSession';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const expirationInProgressRef = useRef(false);

  const expireSession = useCallback(async () => {
    expirationInProgressRef.current = true;
    clearActivity();
    setSession(null);
    setUser(null);
    setIsSessionExpired(true);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Failed to sign out inactive session:', error);
    }
  }, []);

  const applySession = useCallback(async (
    nextSession: Session | null,
    event: AuthChangeEvent | 'INITIAL_SESSION'
  ) => {
    if (!nextSession) {
      sessionRef.current = null;
      setSession(null);
      setUser(null);
      if (!expirationInProgressRef.current) {
        clearActivity();
        setIsSessionExpired(false);
      }
      return;
    }

    const lastActivity = getLastActivity(nextSession.user.id);
    if (isSessionInactive(lastActivity)) {
      await expireSession();
      return;
    }

    if (event === 'SIGNED_IN' || lastActivity === null) {
      recordActivity(nextSession.user.id);
    }

    expirationInProgressRef.current = false;
    sessionRef.current = nextSession;
    setSession(nextSession);
    setUser(nextSession.user);
    setIsSessionExpired(false);
  }, [expireSession]);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      await applySession(data.session, 'INITIAL_SESSION');
    };

    void getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession: Session | null) => {
      void applySession(nextSession, event);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [applySession]);

  useEffect(() => {
    if (!session) return undefined;

    const handleActivity = () => {
      if (sessionRef.current) recordActivity(sessionRef.current.user.id);
    };

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    const timeoutCheck = window.setInterval(() => {
      const currentSession = sessionRef.current;
      if (currentSession && isSessionInactive(getLastActivity(currentSession.user.id))) {
        void expireSession();
      }
    }, 60_000);

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      window.clearInterval(timeoutCheck);
    };
  }, [expireSession, session]);

  const logout = async () => {
    clearActivity();
    expirationInProgressRef.current = false;
    setIsSessionExpired(false);
    await supabase.auth.signOut({ scope: 'local' });
  };

  const value = {
    session,
    user,
    isAuthenticated: !!user,
    isSessionExpired,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
