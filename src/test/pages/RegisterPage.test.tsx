import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';

import RegisterPage from '../../pages/RegisterPage';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock Supabase
vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      signUp: vi.fn(),
      signInWithOAuth: vi.fn()
    }
  }
}));

// Mock ThemeContext
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>
}));

// Setup default mock implementation for happy path
beforeEach(() => {
    // We will override this in specific tests if needed using vi.mocked(...).auth.signUp.mockImplementation...
    // But since we are hoisting, we rely on the specific test to set the implementation or use a variable.
    // Actually, simplest is to use the same logic as before or just a basic success mock.
});

// We need to access the mocked module to change implementations
import supabase from '../../lib/supabaseClient';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default success mock
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: 'test' } as any, session: null },
        error: null
    });
  });

  it('renders registration page with Kolium animated logo', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <RegisterPage />
        </ThemeProvider>
      </MemoryRouter>
    );
    

    
    // Check title
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.queryByText('VPS Dashboard access (front-end only)')).not.toBeInTheDocument();
    
    // Check logo (either mobile or desktop version should exist)
    const desktopLogo = screen.queryByTestId('app-logo-desktop');
    const mobileLogo = screen.queryByTestId('app-logo-mobile');
    expect(desktopLogo || mobileLogo).toBeInTheDocument();
  });

  it('displays the registration form with correct elements', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <RegisterPage />
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Check form inputs
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    
    // Check registration button
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('handles successful registration correctly', async () => {
    const user = {
        email: 'newuser@example.com',
        password: 'password123'
    };

    render(
      <MemoryRouter>
        <ThemeProvider>
          <RegisterPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Enter valid credentials
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: user.email }
    });
    
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: user.password }
    });
    
    // Submit form
    const registerBtn = screen.getByRole('button', { name: 'Create Account' });
    await userEvent.click(registerBtn);
    
    // Verify modal appears (use findByText to wait for appearance)
    const successMessage = await screen.findByText(/Verify your email/i);
    expect(successMessage).toBeInTheDocument();
    
    // Click login button in modal
    await userEvent.click(screen.getByText('Go to Login'));
    
    // Verify navigation (wait for animation timeout)
    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('displays error message on failed registration', async () => {
    // Override mock for this specific test
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ 
        data: { user: null, session: null }, 
        error: { message: 'Registration failed. Email already in use.' } as any
    });
    
    render(
        <MemoryRouter>
            <ThemeProvider>
            <RegisterPage />
            </ThemeProvider>
        </MemoryRouter>
    );

    // Enter INVALID credentials (trigger error condition in mock)
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'existing@example.com' } // Not the success email
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    // Check that error is displayed
    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toHaveTextContent('Registration failed. Email already in use.');
  });

  it('displays error message on invalid email format', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <RegisterPage />
        </ThemeProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByTestId('email-input');
    const registerBtn = screen.getByRole('button', { name: 'Create Account' });

    // Enter INVALID email format (double dots)
    fireEvent.change(emailInput, { target: { value: 'user@domain..com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });

    // Submit form
    await userEvent.click(registerBtn);

    // Check that error is displayed
    // Since this is synchronous state update (no async call), we can use getByTestId or findByTestId
    // But since state updates are batched, findBy is safer
    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toHaveTextContent('Invalid email format');
    
    // Ensure signUp was NOT called
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });
});
