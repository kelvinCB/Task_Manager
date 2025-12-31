import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import supabase from '../../lib/supabaseClient';

// Mock Supabase
vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe('AuthContext', () => {
  const mockSession = {
    access_token: 'mock-token',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with null session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.session).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it('should initialize with existing session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.user).toEqual(mockSession.user);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should update state on auth state change', async () => {
      let authCallback: any;

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as any;
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      // Simulate sign in
      act(() => {
        authCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.user).toEqual(mockSession.user);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should handle logout', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should cleanup auth listener on unmount', async () => {
      const unsubscribeMock = vi.fn();

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } },
      } as any);

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
