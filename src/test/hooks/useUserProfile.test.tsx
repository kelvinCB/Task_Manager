import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { UserProfileProvider } from '../../contexts/UserProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../lib/supabaseClient';

// Mock the dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../../lib/supabaseClient', () => ({
  default: {
    from: vi.fn()
  }
}));

const mockUseAuth = vi.mocked(useAuth);
const mockSupabase = vi.mocked(supabase);

describe('useUserProfile Hook', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  const mockProfile = {
    id: 'test-user-id',
    username: 'pizza123',
    display_name: 'Test User',
    avatar_url: null,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return loading state initially when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      session: null,
      logout: vi.fn()
    });

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: UserProfileProvider
    });

    expect(result.current.loading).toBe(false); // Loading is false when not authenticated
    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should fetch profile when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      session: { user: mockUser } as any,
      logout: vi.fn()
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect
    } as any);

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: UserProfileProvider
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.error).toBe(null);
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should handle error when fetching profile fails', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      session: { user: mockUser } as any,
      logout: vi.fn()
    });

    const mockError = new Error('Database error');
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      })
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect
    } as any);

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: UserProfileProvider
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe('Database error');
  });

  it('should not fetch profile when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      session: null,
      logout: vi.fn()
    });

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: UserProfileProvider
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should update profile successfully', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      session: { user: mockUser } as any,
      logout: vi.fn()
    });

    // Mock initial fetch
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })
    });

    // Mock update
    const updatedProfile = { ...mockProfile, display_name: 'Updated Name' };
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: updatedProfile,
            error: null
          })
        })
      })
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: UserProfileProvider
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update profile
    const updatedData = await result.current.updateProfile({ display_name: 'Updated Name' });

    expect(updatedData.display_name).toBe('Updated Name');
    expect(mockUpdate).toHaveBeenCalledWith({
      display_name: 'Updated Name',
      updated_at: expect.any(String)
    });
  });

  it('should handle update profile error', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      session: { user: mockUser } as any,
      logout: vi.fn()
    });

    // Mock initial fetch
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      })
    });

    // Mock update error
    const mockError = new Error('Update failed');
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      })
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: UserProfileProvider
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Attempt to update profile
    await expect(result.current.updateProfile({ display_name: 'Updated Name' }))
      .rejects.toThrow('Update failed');
  });
});

