import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'delete_confirmation.title': 'Delete Task?',
        'delete_confirmation.message': 'Are you sure you want to delete this task? This action cannot be undone.',
        'delete_confirmation.confirm': 'Yes, Delete',
        'delete_confirmation.cancel': 'Cancel'
      };
      return translations[key] || key;
    }
  })
}));

describe('DeleteConfirmationModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (isOpen: boolean, taskTitle?: string) => {
    return render(
      <ThemeProvider>
        <DeleteConfirmationModal
          isOpen={isOpen}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          taskTitle={taskTitle}
        />
      </ThemeProvider>
    );
  };

  it('should not render when isOpen is false', () => {
    renderModal(false);
    expect(screen.queryByText('Delete Task?')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderModal(true);
    expect(screen.getByText('Delete Task?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this task? This action cannot be undone.')).toBeInTheDocument();
  });

  it('should display task title when provided', () => {
    const taskTitle = 'My Important Task';
    renderModal(true, taskTitle);
    expect(screen.getByText(`"${taskTitle}"`)).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', () => {
    renderModal(true);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm and onClose when confirm button is clicked', () => {
    renderModal(true);
    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking the X button', () => {
    renderModal(true);
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onClose when clicking the backdrop', () => {
    renderModal(true);
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not close when clicking inside the modal', () => {
    renderModal(true);
    const modal = screen.getByRole('dialog');
    fireEvent.click(modal);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should have correct ARIA attributes', () => {
    renderModal(true);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby','delete-modal-title');
  });

  it('should render both action buttons with correct text', () => {
    renderModal(true);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
  });
});
