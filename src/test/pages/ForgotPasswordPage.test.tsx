import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import ForgotPasswordPage from '../../pages/ForgotPasswordPage';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock icons
vi.mock('lucide-react', () => ({
  ArrowLeft: ({ size }: { size?: number }) => <div data-testid="arrow-left-icon" style={{ width: size, height: size }}>ArrowLeft</div>,
  Mail: ({ size }: { size?: number }) => <div data-testid="mail-icon" style={{ width: size, height: size }}>Mail</div>,
}));

// Mock Supabase
vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      resetPasswordForEmail: vi.fn()
    }
  }
}));

// Simple theme provider mock
const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="theme-provider">{children}</div>
);

describe('ForgotPasswordPage', () => {
  let mockResetPasswordForEmail: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    const supabase = await import('../../lib/supabaseClient');
    mockResetPasswordForEmail = supabase.default.auth.resetPasswordForEmail;
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it('renders forgot password page with correct elements', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Check page title
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    
    // Check description
    expect(screen.getByText(/Enter your email address and we'll send you a link to reset your password/)).toBeInTheDocument();
    
    // Check animated logo presence
    const logoLetters = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && 'TaskLite'.includes(content);
    });
    expect(logoLetters.length).toBe(8); // Each letter of TaskLite
    
    // Check form elements
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-button')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-login')).toBeInTheDocument();
    
    // Check mail icon
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('applies gradient background styles', () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Check for gradient background class
    const root = container.querySelector('.bg-gradient-to-br');
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass('from-indigo-50', 'via-purple-50', 'to-blue-100');
    expect(root).toHaveClass('dark:from-gray-900', 'dark:via-indigo-900', 'dark:to-blue-900');
  });

  it('handles successful password reset request', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('reset-password-button');

    // Fill in email
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        { redirectTo: `${window.location.origin}/reset-password` }
      );
    });

    // Check success state
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText(/We've sent password reset instructions to/)).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('displays error message on failed password reset request', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'User not found' }
    });

    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('reset-password-button');

    // Fill in email
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('User not found');
    });
  });

  it('shows loading state during password reset request', async () => {
    // Make the promise pending
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockResetPasswordForEmail.mockReturnValue(pendingPromise);

    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('reset-password-button');

    // Fill in email
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Check loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise to cleanup
    resolvePromise({ error: null });
  });

  it('validates email input is required', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('reset-password-button');

    // Try to submit with empty email
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    expect(emailInput).toBeInvalid();
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('navigates back to login when back link is clicked', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const backLink = screen.getByTestId('back-to-login');
    expect(backLink).toHaveAttribute('href');
    expect(backLink.getAttribute('href')).toBe('/login');
  });

  it('shows success state with correct elements', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('reset-password-button');

    // Fill in email and submit
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(submitButton);

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    // Check success state elements
    expect(screen.getByText(/We've sent password reset instructions/)).toBeInTheDocument();
    expect(screen.getByText(/Didn't receive the email/)).toBeInTheDocument();
    expect(screen.getByText('Try another email')).toBeInTheDocument();
    expect(screen.getByText('Back to login')).toBeInTheDocument();
  });

  it('allows trying another email from success state', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('reset-password-button');

    // Fill in email and submit
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(submitButton);

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    // Click try another email
    const tryAnotherEmailButton = screen.getByText('Try another email');
    fireEvent.click(tryAnotherEmailButton);

    // Should be back to form state
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('reset-password-button')).toBeInTheDocument();
  });

  it('handles unexpected errors gracefully', async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('reset-password-button');

    // Fill in email
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
    });
  });

  it('handles unexpected errors without message', async () => {
    mockResetPasswordForEmail.mockRejectedValue({});

    render(
      <MemoryRouter>
        <ThemeProvider>
          <ForgotPasswordPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('reset-password-button');

    // Fill in email
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for fallback error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('An unexpected error occurred.');
    });
  });
});