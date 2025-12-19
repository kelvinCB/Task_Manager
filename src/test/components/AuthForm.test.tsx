import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthForm } from '../../components/features/auth/AuthForm';
import { BrowserRouter } from 'react-router-dom';

describe('AuthForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnGoogleLogin = vi.fn();

  const renderAuthForm = (props = {}) => {
    return render(
      <BrowserRouter>
        <AuthForm
          onSubmit={mockOnSubmit}
          buttonText="Sign In"
          isLoading={false}
          onGoogleLogin={mockOnGoogleLogin}
          {...props}
        />
      </BrowserRouter>
    );
  };

  it('renders Google login button', () => {
    renderAuthForm();
    expect(screen.getByTestId('google-login')).toBeDefined();
  });

  it('calls onGoogleLogin when Google button is clicked', () => {
    renderAuthForm();
    const googleButton = screen.getByTestId('google-login');
    fireEvent.click(googleButton);
    expect(mockOnGoogleLogin).toHaveBeenCalled();
  });

  it('renders correctly for signup', () => {
    renderAuthForm({ isSignUp: true, buttonText: "Register" });
    expect(screen.getByText('SIGN UP WITH GOOGLE')).toBeDefined();
  });

  it('renders correctly for login', () => {
    renderAuthForm({ isSignUp: false });
    expect(screen.getByText('LOG IN WITH GOOGLE')).toBeDefined();
  });
});
