import { createContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
