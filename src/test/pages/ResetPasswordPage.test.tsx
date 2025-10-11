import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import ResetPasswordPage from '../../pages/ResetPasswordPage';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('access_token=test&refresh_token=test')]
  };
});

// Mock icons
vi.mock('lucide-react', () => ({
  ArrowLeft: ({ size }: { size?: number }) => <div data-testid="arrow-left-icon" style={{ width: size, height: size }}>ArrowLeft</div>,
  Lock: ({ size }: { size?: number }) => <div data-testid="lock-icon" style={{ width: size, height: size }}>Lock</div>,
  Eye: ({ size }: { size?: number }) => <div data-testid="eye-icon" style={{ width: size, height: size }}>Eye</div>,
  EyeOff: ({ size }: { size?: number }) => <div data-testid="eye-off-icon" style={{ width: size, height: size }}>EyeOff</div>,
  CheckCircle: ({ size }: { size?: number }) => <div data-testid="check-circle-icon" style={{ width: size, height: size }}>CheckCircle</div>,
}));

// Mock Supabase
vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      updateUser: vi.fn()
    }
  }
}));

// Simple theme provider mock
const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="theme-provider">{children}</div>
);

describe('ResetPasswordPage', () => {
  let mockUpdateUser: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    const supabase = await import('../../lib/supabaseClient');
    mockUpdateUser = supabase.default.auth.updateUser;
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('renders reset password page with correct elements', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Check page title
    expect(screen.getByText('Set new password')).toBeInTheDocument();
    
    // Check description
    expect(screen.getByText('Enter your new password below.')).toBeInTheDocument();
    
    // Check animated logo presence
    const logoLetters = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && 'TaskLite'.includes(content);
    });
    expect(logoLetters.length).toBe(8); // Each letter of TaskLite
    
    // Check form elements
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('update-password-button')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-login')).toBeInTheDocument();
    
    // Check password strength hint
    expect(screen.getByText('Must be at least 6 characters long')).toBeInTheDocument();
    
    // Check lock icons
    expect(screen.getAllByTestId('lock-icon')).toHaveLength(2);
  });

  it('applies gradient background styles', () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Check for gradient background class
    const root = container.querySelector('.bg-gradient-to-br');
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass('from-indigo-50', 'via-purple-50', 'to-blue-100');
    expect(root).toHaveClass('dark:from-gray-900', 'dark:via-indigo-900', 'dark:to-blue-900');
  });

  it('handles successful password reset', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('update-password-button');

    // Fill in passwords
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      });
    });

    // Check success state
    await waitFor(() => {
      expect(screen.getByText('Password updated')).toBeInTheDocument();
      expect(screen.getByText(/Your password has been successfully updated/)).toBeInTheDocument();
      expect(screen.getByText('Continue to login')).toBeInTheDocument();
    });

    // Check success icon
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
  });

  it('displays error message when passwords do not match', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('update-password-button');

    // Fill in mismatched passwords
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');
    });

    // Should not call API
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('validates password length requirement', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('update-password-button');

    // Fill in short password
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Password must be at least 6 characters long');
    });

    // Should not call API
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('displays error message on failed password update', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Invalid token' }
    });

    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('update-password-button');

    // Fill in passwords
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid token');
    });
  });

  it('shows loading state during password update', async () => {
    // Make the promise pending
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockUpdateUser.mockReturnValue(pendingPromise);

    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('update-password-button');

    // Fill in passwords
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Check loading state
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise to cleanup
    resolvePromise({ error: null });
  });

  it('toggles password visibility', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');

    // Initially passwords should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Find toggle buttons (there should be 2, one for each input)
    const passwordToggleButtons = passwordInput.parentElement?.querySelectorAll('button');
    const confirmToggleButtons = confirmPasswordInput.parentElement?.querySelectorAll('button');

    expect(passwordToggleButtons).toHaveLength(1);
    expect(confirmToggleButtons).toHaveLength(1);

    // Click first password toggle
    if (passwordToggleButtons) {
      fireEvent.click(passwordToggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }

    // Click second password toggle
    if (confirmToggleButtons) {
      fireEvent.click(confirmToggleButtons[0]);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    }
  });

  it('navigates back to login when back link is clicked', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const backLink = screen.getByTestId('back-to-login');
    expect(backLink).toHaveAttribute('href');
    expect(backLink.getAttribute('href')).toBe('/login');
  });

  it('navigates to login from success state', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('update-password-button');

    // Fill in passwords and submit
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Password updated')).toBeInTheDocument();
    });

    // Check continue to login link
    const continueLink = screen.getByText('Continue to login');
    expect(continueLink).toHaveAttribute('href');
    expect(continueLink.getAttribute('href')).toBe('/login');
  });

  it('handles unexpected errors gracefully', async () => {
    mockUpdateUser.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('update-password-button');

    // Fill in passwords
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
    });
  });

  it('handles unexpected errors without message', async () => {
    mockUpdateUser.mockRejectedValue({});

    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('update-password-button');

    // Fill in passwords
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for fallback error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('An unexpected error occurred.');
    });
  });

});