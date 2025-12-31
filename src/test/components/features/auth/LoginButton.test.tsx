import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginButton } from '../../../../components/features/auth/LoginButton';
import { ThemeProvider } from '../../../../contexts/ThemeContext';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import supabase from '../../../../lib/supabaseClient';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

const renderButton = (props: any = {}) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LoginButton {...props} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);
  });

  describe('Unauthenticated state', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });
    });

    it('should render login button when user is not authenticated', async () => {
      renderButton();

      await vi.waitFor(() => {
        expect(screen.getByLabelText(/Login/i)).toBeInTheDocument();
      });
    });

    it('should navigate to /login when clicked', async () => {
      renderButton();

      await vi.waitFor(() => {
        const loginButton = screen.getByLabelText(/Login/i);
        fireEvent.click(loginButton);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should render compact mode with icon only', async () => {
      renderButton({ compact: true });

      await vi.waitFor(() => {
        const button = screen.getByLabelText('Login');
        expect(button).toBeInTheDocument();
        expect(screen.queryByText(/Iniciar Sesión/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated state', () => {
    const mockSession = {
      access_token: 'mock-token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };

    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });
    });

    it('should render profile button when user is authenticated', async () => {
      renderButton();

      await vi.waitFor(() => {
        expect(screen.getByLabelText(/View profile/i)).toBeInTheDocument();
      });
    });

    it('should render logout button when authenticated', async () => {
      renderButton();

      await vi.waitFor(() => {
        expect(screen.getByLabelText(/Logout/i)).toBeInTheDocument();
      });
    });

    it('should call logout and navigate when logout button clicked', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
      
      renderButton();

      await vi.waitFor(async () => {
        const logoutButton = screen.getByLabelText(/Logout/i);
        fireEvent.click(logoutButton);
        
        await vi.waitFor(() => {
          expect(supabase.auth.signOut).toHaveBeenCalled();
          expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
      });
    });

    it('should render compact mode when authenticated', async () => {
      renderButton({ compact: true });

      await vi.waitFor(() => {
        const button = screen.getByLabelText('Login');
        expect(button).toBeInTheDocument();
      });
    });
  });
});
