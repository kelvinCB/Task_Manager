import { render, screen, fireEvent } from '@testing-library/react';
import { AuthRequiredModal } from '../../components/features/auth/AuthRequiredModal';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'auth.auth_required_title': 'Authentication Required',
                'auth.auth_required_message': 'To edit tasks, you need to sign in to your account.',
                'auth.login': 'Log In',
                'common.cancel': 'Cancel'
            };
            return translations[key] || key;
        },
    }),
}));

const renderWithProviders = (isOpen: boolean, onClose = vi.fn()) => {
    return render(
        <BrowserRouter>
            <ThemeProvider>
                <AuthRequiredModal isOpen={isOpen} onClose={onClose} />
            </ThemeProvider>
        </BrowserRouter>
    );
};

describe('AuthRequiredModal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should not render when isOpen is false', () => {
        renderWithProviders(false);
        expect(screen.queryByTestId('auth-required-modal')).not.toBeInTheDocument();
    });

    it('should render correct content when open', () => {
        renderWithProviders(true);
        expect(screen.getByTestId('auth-modal-title')).toHaveTextContent('Authentication Required');
        expect(screen.getByTestId('auth-modal-message')).toHaveTextContent('To edit tasks, you need to sign in to your account.');
        expect(screen.getByTestId('auth-modal-login-button')).toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked', () => {
        const onClose = vi.fn();
        renderWithProviders(true, onClose);

        const cancelButton = screen.getByTestId('auth-modal-cancel-button');
        fireEvent.click(cancelButton);

        // AuthRequiredModal uses a timeout for animation before calling onClose
        vi.advanceTimersByTime(300);
        expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', () => {
        const onClose = vi.fn();
        renderWithProviders(true, onClose);

        const closeButton = screen.getByTestId('auth-modal-close-button');
        fireEvent.click(closeButton);

        vi.advanceTimersByTime(300);
        expect(onClose).toHaveBeenCalled();
    });

    it('should navigate to /login and call onClose when login button is clicked', async () => {
        const onClose = vi.fn();
        renderWithProviders(true, onClose);

        const loginButton = screen.getByTestId('auth-modal-login-button');
        fireEvent.click(loginButton);

        vi.advanceTimersByTime(300);
        expect(onClose).toHaveBeenCalled();
        expect(window.location.pathname).toBe('/login');
    });
});
