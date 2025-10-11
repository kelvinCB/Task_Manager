import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { PasswordInput } from '../../components/PasswordInput';

describe('PasswordInput Component', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    value: 'test-password',
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render password input with hidden text by default', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const passwordInput = screen.getByTestId('password-input');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveValue('test-password');
  });

  it('should show password when toggle button is clicked', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByTestId('toggle-password-visibility');
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button to show password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle button again to hide password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should display correct tooltip text based on password visibility', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const toggleButton = screen.getByTestId('toggle-password-visibility');
    
    // Initially should show "Mostrar contraseña"
    expect(toggleButton).toHaveAttribute('title', 'Mostrar contraseña');
    
    // After clicking, should show "Ocultar contraseña"
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('title', 'Ocultar contraseña');
  });

  it('should render correct icons based on password visibility', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const toggleButton = screen.getByTestId('toggle-password-visibility');
    
    // Initially should show Eye icon (password hidden)
    expect(toggleButton.querySelector('svg.lucide-eye')).toBeInTheDocument();
    
    // After clicking, should show EyeOff icon (password shown)
    fireEvent.click(toggleButton);
    expect(toggleButton.querySelector('svg.lucide-eye-off')).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const passwordInput = screen.getByTestId('password-input');
    
    fireEvent.change(passwordInput, { target: { value: 'new-password' } });
    
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should render with custom props', () => {
    render(
      <PasswordInput
        {...defaultProps}
        id="custom-password"
        name="custom-name"
        placeholder="Enter custom password"
        required
        autoComplete="new-password"
        data-testid="custom-password-input"
        className="custom-class"
      />
    );
    
    const passwordInput = screen.getByTestId('custom-password-input');
    expect(passwordInput).toHaveAttribute('id', 'custom-password');
    expect(passwordInput).toHaveAttribute('name', 'custom-name');
    expect(passwordInput).toHaveAttribute('placeholder', 'Enter custom password');
    expect(passwordInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(passwordInput).toHaveClass('custom-class');
  });

  it('should render lock icon on the left', () => {
    render(<PasswordInput {...defaultProps} />);
    
    // Check for lock icon by finding the SVG with the lock path
    const lockIconContainer = document.querySelector('.absolute.left-0');
    const lockIconSvg = lockIconContainer?.querySelector('svg');
    expect(lockIconSvg).toBeInTheDocument();
    expect(lockIconContainer).toHaveClass('left-0');
  });

  it('should have proper accessibility attributes', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const toggleButton = screen.getByTestId('toggle-password-visibility');
    const eyeIcon = toggleButton.querySelector('[aria-hidden="true"]');
    
    expect(toggleButton).toHaveAttribute('type', 'button');
    expect(toggleButton).toHaveAttribute('title');
    expect(eyeIcon).toBeInTheDocument();
  });
});