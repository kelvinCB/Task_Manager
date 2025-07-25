import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountMenu } from '../../components/features/account/AccountMenu';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTheme } from '../../contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../../hooks/useUserProfile');
vi.mock('../../contexts/ThemeContext');

const mockUseAuth = vi.mocked(useAuth);
const mockUseUserProfile = vi.mocked(useUserProfile);
const mockUseTheme = vi.mocked(useTheme);

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AccountMenu Component', () => {
  const mockProfile = {
    id: 'test-user-id',
    username: 'pizza123',
    display_name: 'Test User',
    avatar_url: null,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  const defaultProps = {
    onExport: vi.fn(),
    onImport: vi.fn(),
    compact: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn()
    });
  });

  it('should render My Account button when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    expect(screen.getByText('My Account')).toBeInTheDocument();
    expect(screen.getByTestId('account-menu-button')).toBeInTheDocument();
  });

  it('should render My Account button when authenticated (not show username in button)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    // The button should still show "My Account", not the username
    expect(screen.getByText('My Account')).toBeInTheDocument();
    expect(screen.queryByText('@pizza123')).not.toBeInTheDocument();
  });

  it('should show username in dropdown when authenticated and clicked', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    // Click the button to open dropdown
    fireEvent.click(screen.getByTestId('account-menu-button'));

    // Username should appear in the dropdown
    await waitFor(() => {
      expect(screen.getByText('@pizza123')).toBeInTheDocument();
    });

    // Display name should also appear
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should show logout button when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    // Click to open dropdown
    fireEvent.click(screen.getByTestId('account-menu-button'));

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should show login button when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    // Click to open dropdown
    fireEvent.click(screen.getByTestId('account-menu-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-button-menu')).toBeInTheDocument();
    });

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should call logout function when logout button is clicked', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: null,
      logout: mockLogout
    });

    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    // Click to open dropdown
    fireEvent.click(screen.getByTestId('account-menu-button'));

    // Click logout
    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('logout-button'));

    // Wait for async operations
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should navigate to login when login button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    // Click to open dropdown
    fireEvent.click(screen.getByTestId('account-menu-button'));

    // Click login
    await waitFor(() => {
      expect(screen.getByTestId('login-button-menu')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('login-button-menu'));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should show export and import options', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    // Click to open dropdown
    fireEvent.click(screen.getByTestId('account-menu-button'));

    await waitFor(() => {
      expect(screen.getByText('Export Tasks')).toBeInTheDocument();
      expect(screen.getByText('Import Tasks')).toBeInTheDocument();
    });
  });

  it('should call onExport when export button is clicked', async () => {
    const mockOnExport = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} onExport={mockOnExport} />);

    // Click to open dropdown
    fireEvent.click(screen.getByTestId('account-menu-button'));

    // Click export
    await waitFor(() => {
      expect(screen.getByText('Export Tasks')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export Tasks'));

    expect(mockOnExport).toHaveBeenCalled();
  });

  it('should handle compact mode correctly', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} compact={true} />);

    // In compact mode, the text should not be visible
    expect(screen.queryByText('My Account')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-menu-button')).toBeInTheDocument();
  });

  it('should not show user info section when profile is loading', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: null,
      logout: vi.fn()
    });

    mockUseUserProfile.mockReturnValue({
      profile: null,
      loading: true,
      error: null,
      updateProfile: vi.fn()
    });

    renderWithRouter(<AccountMenu {...defaultProps} />);

    // Click to open dropdown
    fireEvent.click(screen.getByTestId('account-menu-button'));

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });

    // Username should not appear when loading
    expect(screen.queryByText('@pizza123')).not.toBeInTheDocument();
  });
});
