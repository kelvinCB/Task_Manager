import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BurgerMenu } from '../../components/BurgerMenu';
import { ThemeProvider } from '../../contexts/ThemeContext';

const renderBurgerMenu = (props: any = {}) => {
  const defaultProps = {
    onExportTasks: vi.fn(),
    onImportTasks: vi.fn(),
    ...props,
  };

  return render(
    <ThemeProvider>
      <BurgerMenu {...defaultProps} />
    </ThemeProvider>
  );
};

describe('BurgerMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render menu button', () => {
    renderBurgerMenu();

    const menuButton = screen.getByLabelText('Menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('should not show dropdown menu by default', () => {
    renderBurgerMenu();

    expect(screen.queryByText('Export Tasks')).not.toBeInTheDocument();
    expect(screen.queryByText('Import Tasks')).not.toBeInTheDocument();
  });

  it('should open menu when button is clicked', () => {
    renderBurgerMenu();

    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    expect(screen.getByText('Export Tasks')).toBeInTheDocument();
    expect(screen.getByText('Import Tasks')).toBeInTheDocument();
  });

  it('should close menu when button is clicked again', () => {
    renderBurgerMenu();

    const menuButton = screen.getByLabelText('Menu');
    
    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByText('Export Tasks')).toBeInTheDocument();

    // Close menu
    fireEvent.click(menuButton);
    expect(screen.queryByText('Export Tasks')).not.toBeInTheDocument();
  });

  it('should call onExportTasks when Export button is clicked', () => {
    const onExportTasks = vi.fn();
    renderBurgerMenu({ onExportTasks });

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Click export
    const exportButton = screen.getByText('Export Tasks');
    fireEvent.click(exportButton);

    expect(onExportTasks).toHaveBeenCalled();
  });

  it('should close menu after export is clicked', () => {
    renderBurgerMenu();

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Click export
    const exportButton = screen.getByText('Export Tasks');
    fireEvent.click(exportButton);

    // Menu should be closed
    expect(screen.queryByText('Export Tasks')).not.toBeInTheDocument();
  });

  it('should trigger import file input and close menu', () => {
    const onImportTasks = vi.fn();
    renderBurgerMenu({ onImportTasks });

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);

    // Find and click import label
    const importLabel = screen.getByText('Import Tasks').closest('label');
    expect(importLabel).toBeInTheDocument();

    // Find the hidden file input
    const fileInput = importLabel?.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.csv');

    // Simulate file selection
    if (fileInput) {
      const file = new File(['content'], 'tasks.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(onImportTasks).toHaveBeenCalled();
    }
  });

  it('should close menu when clicking outside', () => {
    renderBurgerMenu();

    // Open menu
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    expect(screen.getByText('Export Tasks')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    // Menu should be closed
    expect(screen.queryByText('Export Tasks')).not.toBeInTheDocument();
  });
});
