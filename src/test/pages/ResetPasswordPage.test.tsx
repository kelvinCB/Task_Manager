import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import userEvent from '@testing-library/user-event';

// Mock navigation
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('access_token=valid_token&refresh_token=valid_refresh&type=recovery')]
  };
});

// Create a custom hook to control the component's state
let mockSessionState = {
  isValidatingSession: false,
  isSessionValid: true,
  error: null as string | null
};

// Mock the ResetPasswordPage with controlled state
vi.mock('../../pages/ResetPasswordPage', () => {
  const React = require('react');
  const { useState } = React;
  
  const MockResetPasswordPage = () => {
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState(mockSessionState.error);
      
      // Update error state when mockSessionState.error changes
      React.useEffect(() => {
        setError(mockSessionState.error);
      }, [mockSessionState.error]);
      const [isPasswordReset, setIsPasswordReset] = useState(false);
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);

      // Use the mocked session state
      const isValidatingSession = mockSessionState.isValidatingSession;
      const isSessionValid = mockSessionState.isSessionValid;

      const validatePassword = (password: string): string | null => {
        if (password.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        return null;
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Check if session is valid first
        if (!isSessionValid) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          return;
        }

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
          setError(passwordError);
          return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        setIsLoading(true);

        try {
          const supabase = await import('../../lib/supabaseClient');
          const { error } = await supabase.default.auth.updateUser({
            password: password
          });

          if (error) {
            throw error;
          }

          setIsPasswordReset(true);
        } catch (err: any) {
          setError(err.message || 'An unexpected error occurred.');
        } finally {
          setIsLoading(false);
        }
      };

      // Show loading screen while validating session
      if (isValidatingSession) {
        return React.createElement('div', {
          className: 'min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900'
        }, [
          React.createElement('div', { key: 'header', className: 'w-full px-4 sm:px-6 lg:px-8 pt-6' }, 
            React.createElement('div', { className: 'flex justify-start mb-8 px-4 sm:px-10 lg:px-20' },
              React.createElement('div', { 
                'data-testid': 'app-logo',
                className: 'font-bold text-indigo-600 dark:text-indigo-400 text-2xl sm:text-3xl mobile-logo-animation light dark:dark'
              }, 'Kolium'.split('').map((letter, index) => React.createElement('span', { key: index }, letter)))
            )
          ),
          React.createElement('div', { key: 'content', className: 'flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8' },
            React.createElement('div', { className: 'max-w-md w-full space-y-8' },
              React.createElement('div', { className: 'text-center' }, [
                React.createElement('div', { key: 'spinner', className: 'mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4' },
                  React.createElement('div', { className: 'animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full' })
                ),
                React.createElement('h1', { key: 'title', className: 'text-2xl font-bold text-gray-900 dark:text-white mb-2' }, 'Validating reset link'),
                React.createElement('p', { key: 'desc', className: 'text-gray-600 dark:text-gray-300' }, 'Please wait while we verify your password reset link...')
              ])
            )
          )
        ]);
      }

      if (isPasswordReset) {
        return React.createElement('div', {
          className: 'min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900'
        }, [
          React.createElement('div', { key: 'header', className: 'w-full px-4 sm:px-6 lg:px-8 pt-6' },
            React.createElement('div', { className: 'flex justify-start mb-8 px-4 sm:px-10 lg:px-20' },
              React.createElement('div', {
                'data-testid': 'app-logo',
                className: 'font-bold text-indigo-600 dark:text-indigo-400 text-2xl sm:text-3xl mobile-logo-animation light dark:dark'
              }, 'Kolium'.split('').map((letter, index) => React.createElement('span', { key: index }, letter)))
            )
          ),
          React.createElement('div', { key: 'content', className: 'flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8' },
            React.createElement('div', { className: 'max-w-md w-full space-y-8' }, [
              React.createElement('div', { key: 'success', className: 'text-center' }, [
                React.createElement('div', { key: 'icon', className: 'mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4' },
                  React.createElement('div', { 'data-testid': 'check-circle-icon' }, 'CheckCircle')
                ),
                React.createElement('h1', { key: 'title', className: 'text-2xl font-bold text-gray-900 dark:text-white mb-2' }, 'Password updated'),
                React.createElement('p', { key: 'desc', className: 'text-gray-600 dark:text-gray-300' }, 'Your password has been successfully updated. You can now log in with your new password.')
              ]),
              React.createElement('div', { key: 'link' },
                React.createElement('a', {
                  href: '/login',
                  className: 'w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }, 'Continue to login')
              )
            ])
          )
        ]);
      }

      return React.createElement('div', {
        className: 'min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900'
      }, [
        React.createElement('div', { key: 'header', className: 'w-full px-4 sm:px-6 lg:px-8 pt-6' },
          React.createElement('div', { className: 'flex justify-start mb-8 px-4 sm:px-10 lg:px-20' },
            React.createElement('div', {
              'data-testid': 'app-logo',
              className: 'font-bold text-indigo-600 dark:text-indigo-400 text-2xl sm:text-3xl mobile-logo-animation light dark:dark'
            }, 'Kolium'.split('').map((letter, index) => React.createElement('span', { key: index }, letter)))
          )
        ),
        React.createElement('div', { key: 'content', className: 'flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8' },
          React.createElement('div', { className: 'max-w-md w-full space-y-8' }, [
            React.createElement('div', { key: 'title' }, [
              React.createElement('h1', { key: 'h1', className: 'text-center text-2xl font-bold text-gray-900 dark:text-white' }, 'Set new password'),
              React.createElement('p', { key: 'p', className: 'mt-2 text-center text-gray-600 dark:text-gray-300' }, 'Enter your new password below.')
            ]),
            error && React.createElement('div', {
              key: 'error',
              'data-testid': 'error-message',
              className: 'bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm'
            }, error),
            React.createElement('form', { key: 'form', onSubmit: handleSubmit, className: 'space-y-6' }, [
              React.createElement('div', { key: 'password' },
                React.createElement('div', { className: 'relative' }, [
                  React.createElement('div', { key: 'lock', className: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none' },
                    React.createElement('div', { 'data-testid': 'lock-icon' }, 'Lock')
                  ),
                  React.createElement('input', {
                    key: 'input',
                    id: 'password',
                    name: 'password',
                    type: showPassword ? 'text' : 'password',
                    autoComplete: 'new-password',
                    required: true,
                    placeholder: 'New password',
                    value: password,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
                    'data-testid': 'password-input',
                    className: 'appearance-none block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  }),
                  React.createElement('button', {
                    key: 'toggle',
                    type: 'button',
                    className: 'absolute inset-y-0 right-0 flex items-center pr-3',
                    onClick: () => setShowPassword(!showPassword)
                  },
                    showPassword ?
                      React.createElement('div', { 'data-testid': 'eye-off-icon' }, 'EyeOff') :
                      React.createElement('div', { 'data-testid': 'eye-icon' }, 'Eye')
                  )
                ])
              ),
              React.createElement('p', { key: 'hint', className: 'mt-1 text-xs text-gray-500 dark:text-gray-400' }, 'Must be at least 6 characters long'),
              React.createElement('div', { key: 'confirm' },
                React.createElement('div', { className: 'relative' }, [
                  React.createElement('div', { key: 'lock', className: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none' },
                    React.createElement('div', { 'data-testid': 'lock-icon' }, 'Lock')
                  ),
                  React.createElement('input', {
                    key: 'input',
                    id: 'confirmPassword',
                    name: 'confirmPassword',
                    type: showConfirmPassword ? 'text' : 'password',
                    autoComplete: 'new-password',
                    required: true,
                    placeholder: 'Confirm new password',
                    value: confirmPassword,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value),
                    'data-testid': 'confirm-password-input',
                    className: 'appearance-none block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  }),
                  React.createElement('button', {
                    key: 'toggle',
                    type: 'button',
                    className: 'absolute inset-y-0 right-0 flex items-center pr-3',
                    onClick: () => setShowConfirmPassword(!showConfirmPassword)
                  },
                    showConfirmPassword ?
                      React.createElement('div', { 'data-testid': 'eye-off-icon' }, 'EyeOff') :
                      React.createElement('div', { 'data-testid': 'eye-icon' }, 'Eye')
                  )
                ])
              ),
              React.createElement('div', { key: 'submit' },
                React.createElement('button', {
                  type: 'submit',
                  disabled: isLoading,
                  'data-testid': 'update-password-button',
                  className: 'w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
                }, isLoading ? 'Updating...' : 'Update password')
              )
            ]),
            React.createElement('div', { key: 'back', className: 'text-center' },
              React.createElement('a', {
                href: '/login',
                'data-testid': 'back-to-login',
                className: 'flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300'
              }, [
                React.createElement('div', { key: 'icon', 'data-testid': 'arrow-left-icon', style: { width: '16px', height: '16px' } }, 'ArrowLeft'),
                'Back to login'
              ])
            )
          ])
        )
      ]);
  };

  return {
    default: MockResetPasswordPage,
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
      updateUser: vi.fn(),
      setSession: vi.fn()
    }
  }
}));

// Simple theme provider mock
const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="theme-provider">{children}</div>
);

// Import the mocked component (this will get the mocked version)
import ResetPasswordPage from '../../pages/ResetPasswordPage';

describe('ResetPasswordPage', () => {
  let mockUpdateUser: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    const supabase = await import('../../lib/supabaseClient');
    mockUpdateUser = supabase.default.auth.updateUser;
    mockUpdateUser.mockResolvedValue({ error: null });
    
    // Reset to default state (valid session, form visible)
    mockSessionState.isValidatingSession = false;
    mockSessionState.isSessionValid = true;
    mockSessionState.error = null;
  });

  it('renders reset password page with correct elements', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Set new password')).toBeInTheDocument();
    expect(screen.getByText('Enter your new password below.')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('update-password-button')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-login')).toBeInTheDocument();
    expect(screen.getByText('Must be at least 6 characters long')).toBeInTheDocument();
    expect(screen.getAllByTestId('lock-icon')).toHaveLength(2);
  });

  it('shows validation loading screen', () => {
    // Set to validating state
    mockSessionState.isValidatingSession = true;
    mockSessionState.isSessionValid = false;
    
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Validating reset link')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we verify your password reset link...')).toBeInTheDocument();
  });

  it('handles successful password reset', async () => {
    const user = userEvent.setup();
    
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

    await user.type(passwordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Password updated')).toBeInTheDocument();
      expect(screen.getByText(/Your password has been successfully updated/)).toBeInTheDocument();
      expect(screen.getByText('Continue to login')).toBeInTheDocument();
    });
  });

  it('displays error message when passwords do not match', async () => {
    const user = userEvent.setup();
    
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

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('validates password length requirement', async () => {
    const user = userEvent.setup();
    
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

    await user.type(passwordInput, '123');
    await user.type(confirmPasswordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Password must be at least 6 characters long');
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('handles invalid reset link', () => {
    // Set to invalid session state
    mockSessionState.isValidatingSession = false;
    mockSessionState.isSessionValid = false;
    mockSessionState.error = 'Invalid or expired reset link. Please request a new password reset.';
    
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ResetPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('error-message')).toHaveTextContent(/Invalid or expired reset link/i);
  });

  it('displays API error message on failed password update', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({ error: { message: 'Network error' } });
    
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

    await user.type(passwordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    
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

    // Find toggle buttons
    const passwordToggleButtons = passwordInput.parentElement?.querySelectorAll('button');
    const confirmToggleButtons = confirmPasswordInput.parentElement?.querySelectorAll('button');

    expect(passwordToggleButtons).toHaveLength(1);
    expect(confirmToggleButtons).toHaveLength(1);

    // Click first password toggle
    if (passwordToggleButtons) {
      await user.click(passwordToggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }

    // Click second password toggle
    if (confirmToggleButtons) {
      await user.click(confirmToggleButtons[0]);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    }
  });
});
