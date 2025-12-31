import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthRequiredModal } from '../../../../components/features/account/AuthRequiredModal';
import { ThemeProvider } from '../../../../contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderModal = (props: any = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    actionType: 'export' as const,
    ...props,
  };

  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthRequiredModal {...defaultProps} />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('AuthRequiredModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthRequiredModal isOpen={false} onClose={vi.fn()} actionType="export" />
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display correct message for export action', () => {
    renderModal({ actionType: 'export' });

    expect(screen.getByText(/Please sign in to export your tasks/i)).toBeInTheDocument();
  });

  it('should display correct message for import action', () => {
    renderModal({ actionType: 'import' });

    expect(screen.getByText(/Please sign in to import your tasks/i)).toBeInTheDocument();
  });

  it('should display correct message for AI action', () => {
    renderModal({ actionType: 'ai' });

    expect(screen.getByText(/Unlock the power of AI/i)).toBeInTheDocument();
    expect(screen.getByText('Unlock AI Power')).toBeInTheDocument();
  });

  it('should navigate to login when Log In button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const loginButton = screen.getByRole('button', { name: /Log In/i });
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(onClose).toHaveBeenCalled();
  });

  it('should navigate to register when Create Account button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const registerButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(registerButton);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should call onClose when Maybe later button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const maybeLaterButton = screen.getByRole('button', { name: /Maybe later/i });
    fireEvent.click(maybeLaterButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });
});
