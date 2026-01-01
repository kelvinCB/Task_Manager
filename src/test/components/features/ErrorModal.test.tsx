import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorModal } from '../../../components/features/ErrorModal';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const renderModal = (props: any = {}) => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        title: 'Error Title',
        message: 'Error message content',
        ...props,
    };

    return render(
        <ThemeProvider>
            <ErrorModal {...defaultProps} />
        </ThemeProvider>
    );
};

describe('ErrorModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(
            <ThemeProvider>
                <ErrorModal
                    isOpen={false}
                    onClose={vi.fn()}
                    title="Error"
                    message="Message"
                />
            </ThemeProvider>
        );

        expect(screen.queryByTestId('error-modal')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        renderModal();

        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display correct title and message', () => {
        const title = 'Test Error Title';
        const message = 'This is a test error message';

        renderModal({ title, message });

        expect(screen.getByTestId('error-modal-title')).toHaveTextContent(title);
        expect(screen.getByTestId('error-modal-message')).toHaveTextContent(message);
    });

    it('should call onClose when OK button is clicked', async () => {
        const onClose = vi.fn();
        renderModal({ onClose });

        const okButton = screen.getByTestId('error-modal-ok-button');
        fireEvent.click(okButton);

        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        }, { timeout: 500 });
    });

    it('should call onClose when close (X) button is clicked', async () => {
        const onClose = vi.fn();
        renderModal({ onClose });

        const closeButton = screen.getByTestId('error-modal-close-button');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        }, { timeout: 500 });
    });

    it('should show "Do not show again" checkbox when enabled', () => {
        renderModal({ showDoNotShowAgain: true });

        expect(screen.getByTestId('error-modal-checkbox')).toBeInTheDocument();
        expect(screen.getByText(/Do not show this message again/i)).toBeInTheDocument();
    });

    it('should not show "Do not show again" checkbox when disabled', () => {
        renderModal({ showDoNotShowAgain: false });

        expect(screen.queryByTestId('error-modal-checkbox')).not.toBeInTheDocument();
    });

    it('should handle checkbox state changes', () => {
        const onDoNotShowAgainChange = vi.fn();
        renderModal({
            showDoNotShowAgain: true,
            onDoNotShowAgainChange
        });

        const checkbox = screen.getByTestId('error-modal-checkbox') as HTMLInputElement;

        // Initially unchecked
        expect(checkbox.checked).toBe(false);

        // Check the checkbox
        fireEvent.click(checkbox);
        expect(checkbox.checked).toBe(true);

        // Uncheck the checkbox
        fireEvent.click(checkbox);
        expect(checkbox.checked).toBe(false);
    });

    it('should call onDoNotShowAgainChange with checkbox state when closing', async () => {
        const onClose = vi.fn();
        const onDoNotShowAgainChange = vi.fn();

        renderModal({
            onClose,
            showDoNotShowAgain: true,
            onDoNotShowAgainChange
        });

        // Check the checkbox
        const checkbox = screen.getByTestId('error-modal-checkbox');
        fireEvent.click(checkbox);

        // Click OK button
        const okButton = screen.getByTestId('error-modal-ok-button');
        fireEvent.click(okButton);

        await waitFor(() => {
            expect(onDoNotShowAgainChange).toHaveBeenCalledWith(true);
            expect(onClose).toHaveBeenCalled();
        }, { timeout: 500 });
    });

    it('should display error icon', () => {
        renderModal();

        expect(screen.getByTestId('error-modal-icon')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
        renderModal({ title: 'Accessible Error' });

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'error-modal-title');
    });

    it('should have close button with proper aria-label', () => {
        renderModal();

        const closeButton = screen.getByTestId('error-modal-close-button');
        expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
});
