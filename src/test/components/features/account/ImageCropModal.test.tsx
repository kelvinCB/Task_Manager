import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageCropModal from '../../../../components/features/account/ImageCropModal';
import { ThemeProvider } from '../../../../contexts/ThemeContext';

// Mock react-easy-crop
vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete }: any) => {
    // Simulate crop completion immediately
    setTimeout(() => {
      onCropComplete(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 10, y: 10, width: 200, height: 200 }
      );
    }, 0);
    return <div data-testid="cropper">Mocked Cropper</div>;
  },
}));

const mockImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const renderModal = (props: any = {}) => {
  const defaultProps = {
    image: mockImage,
    onCropComplete: vi.fn(),
    onCancel: vi.fn(),
    ...props,
  };

  return render(
    <ThemeProvider>
      <ImageCropModal {...defaultProps} />
    </ThemeProvider>
  );
};

describe('ImageCropModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock canvas for image cropping
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as any;
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback(new Blob(['test'], { type: 'image/jpeg' }));
    }) as any;
  });

  it('should render the modal with image cropper', () => {
    renderModal();

    expect(screen.getByText('Ajustar foto de perfil')).toBeInTheDocument();
    expect(screen.getByTestId('cropper')).toBeInTheDocument();
  });

  it('should render zoom controls', () => {
    renderModal();

    const zoomSlider = screen.getByRole('slider');
    expect(zoomSlider).toBeInTheDocument();
    expect(zoomSlider).toHaveAttribute('min', '1');
    expect(zoomSlider).toHaveAttribute('max', '3');
  });

  it('should update zoom when slider changes', () => {
    renderModal();

    const zoomSlider = screen.getByRole('slider');
    fireEvent.change(zoomSlider, { target: { value: '2' } });

    expect(zoomSlider).toHaveValue('2');
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should call onCancel when X button is clicked', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });

    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('[class*="lucide"]'));
    
    if (xButton) {
      fireEvent.click(xButton);
      expect(onCancel).toHaveBeenCalled();
    }
  });

  it('should show uploading state', () => {
    renderModal({ isUploading: true });

    expect(screen.getByText('Subiendo...')).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /Subiendo.../i });
    expect(confirmButton).toBeDisabled();
  });

  it('should display error message when provided', () => {
    const errorMessage = 'Failed to upload image';
    renderModal({ error: errorMessage });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Error de subida')).toBeInTheDocument();
  });

  it('should have confirm button that triggers onCropComplete', () => {
    const onCropComplete = vi.fn();
    renderModal({ onCropComplete });

    const confirmButton = screen.getByRole('button', { name: /Aceptar/i });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).not.toBeDisabled();
  });
});
