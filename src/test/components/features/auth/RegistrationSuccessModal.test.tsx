import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegistrationSuccessModal } from '../../../../components/features/auth/RegistrationSuccessModal';
import { ThemeProvider } from '../../../../contexts/ThemeContext';

const renderModal = (props: any = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    email: 'test@example.com',
    ...props,
  };

  return render(
    <ThemeProvider>
      <RegistrationSuccessModal {...defaultProps} />
    </ThemeProvider>
  );
};

describe('RegistrationSuccessModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ThemeProvider>
        <RegistrationSuccessModal isOpen={false} onClose={vi.fn()} email="test@example.com" />
      </ThemeProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display the success title from i18n', () => {
    renderModal();

    expect(screen.getByText('Verify your email')).toBeInTheDocument();
  });

  it('should display the user email', () => {
    const email = 'user@example.com';
    renderModal({ email });

    expect(screen.getByText(email)).toBeInTheDocument();
  });

  it('should display the success description', () => {
    renderModal();

    expect(screen.getByText(/Your account has been created/i)).toBeInTheDocument();
  });

  it('should call onClose when close (X) button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should call onClose when Go to Login button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const loginButton = screen.getByRole('button', { name: /Go to Login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });
});
