import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../lib/supabaseClient';
import { API_BASE_URL } from '../utils/apiConfig';

export interface UserProfile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    about: string | null;
    linkedin: string | null;
    created_at: string;
    updated_at: string;
    credits: number;
}

interface UserProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    updateProfile: (updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url' | 'about' | 'linkedin'>>) => Promise<UserProfile>;
    uploadAvatar: (file: File) => Promise<UserProfile>;
    deleteAvatar: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();

    const fetchProfile = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(data);
        } catch (err: any) {
            console.error('Error fetching user profile:', err);
            setError(err.message || 'Failed to fetch user profile');
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = async (updates: any) => {
        if (!user || !profile) throw new Error('No user or profile available');

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            setProfile(data);
            return data;
        } catch (err: any) {
            console.error('Error updating profile:', err);
            throw err;
        }
    };

    const uploadAvatar = async (file: File) => {
        if (!isAuthenticated || !user) throw new Error('User must be authenticated');
        // ... implementation similar to hook ...
        // For brevity, I will copy the exact logic from the hook during the actual implementation
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload avatar');
            }

            const result = await response.json();
            setProfile(result.profile);
            return result.profile;
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteAvatar = async () => {
        // ... implementation similar to hook ...
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete avatar');
            }

            const result = await response.json();
            setProfile(result.profile);
        } catch (err: any) {
            console.error('Error deleting avatar:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserProfileContext.Provider value={{ profile, loading, error, updateProfile, uploadAvatar, deleteAvatar, refreshProfile: fetchProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};
