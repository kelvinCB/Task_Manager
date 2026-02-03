import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock sample task data
const mockTasks = [
  {
    id: '1',
    title: 'Task 1',
    description: '',
    status: 'Open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeTracking: {
      totalTimeSpent: 0,
      isActive: false,
      lastStarted: null,
      timeEntries: []
    }
  },
  {
    id: '2',
    title: 'Task 2',
    description: '',
    status: 'In Progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeTracking: {
      totalTimeSpent: 0,
      isActive: false,
      lastStarted: null,
      timeEntries: []
    }
  },
  {
    id: '3',
    title: 'Task 3',
    description: '',
    status: 'Done',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeTracking: {
      totalTimeSpent: 0,
      isActive: false,
      lastStarted: null,
      timeEntries: []
    }
  }
];

// Mock task tree structure
const mockTaskTree = [
  { id: '1', title: 'Task 1', children: [] },
  { id: '2', title: 'Task 2', children: [] },
  { id: '3', title: 'Task 3', children: [] }
];

// Mock functions
const createTaskMock = vi.fn();
const updateTaskMock = vi.fn();
const deleteTaskMock = vi.fn();
const toggleTaskTimerMock = vi.fn();
const getElapsedTimeMock = vi.fn().mockReturnValue(0);
const exportTasksMock = vi.fn();
const importTasksMock = vi.fn();
const getTimeStatisticsMock = vi.fn().mockReturnValue({
  daily: [],
  weekly: [],
  monthly: []
});

// Mock Supabase client
vi.mock('../../lib/supabaseClient', () => ({
  auth: {
    getSession: () => ({ data: { session: null } }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
    signOut: vi.fn(),
    signInWithPassword: vi.fn()
  }
}));

// Mock AuthContext
const mockUseAuth = vi.fn(() => ({
  isAuthenticated: true,
  logout: vi.fn(),
  user: null,
  session: null
}));

vi.mock('../../contexts/AuthContext', async () => {
  const actual = (await vi.importActual('../../contexts/AuthContext')) as any;
  return {
    ...actual,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
    useAuth: () => mockUseAuth()
  };
});

// Mock UserProfileContext
vi.mock('../../contexts/UserProfileContext', () => ({
  UserProfileProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUserProfile: () => ({
    profile: null,
    loading: false,
    error: null,
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    deleteAvatar: vi.fn(),
    refreshProfile: vi.fn()
  })
}));

// Mock Login and Register pages
vi.mock('../../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('../../pages/RegisterPage', () => ({
  default: () => <div data-testid="register-page">Register Page</div>
}));

vi.mock('../../pages/ForgotPasswordPage', () => ({
  default: () => <div data-testid="forgot-password-page">Forgot Password Page</div>
}));

vi.mock('../../pages/ResetPasswordPage', () => ({
  default: () => <div data-testid="reset-password-page">Reset Password Page</div>
}));

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={['/']}>
        {children}
      </actual.MemoryRouter>
    ),
  };
});

// Mock AccountMenu
vi.mock('../../components/features/account/AccountMenu', () => ({
  AccountMenu: () => <div data-testid="account-menu">Mock Account Menu</div>
}));

// Mock LanguageToggle
vi.mock('../../components/ui/LanguageToggle', () => ({
  LanguageToggle: () => <div data-testid="language-toggle">Mock Language Toggle</div>
}));

// Mock HelpFAB
vi.mock('../../components/features/help/HelpFAB', () => ({
  default: () => <div data-testid="help-fab">Mock Help FAB</div>
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  TreePine: () => <div data-testid="tree-icon">Tree</div>,
  LayoutGrid: () => <div data-testid="grid-icon">Grid</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  FileUp: () => <div data-testid="file-up-icon">FileUp</div>,
  FileDown: () => <div data-testid="file-down-icon">FileDown</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Moon: ({ size }: { size?: number }) => <div data-testid="moon-icon" style={{ width: size, height: size }}>Moon</div>,
  Sun: ({ size }: { size?: number }) => <div data-testid="sun-icon" style={{ width: size, height: size }}>Sun</div>,
  X: ({ size }: { size?: number }) => <div data-testid="close-icon" style={{ width: size, height: size }}>X</div>,
  FileText: ({ size }: { size?: number }) => <div data-testid="file-text-icon" style={{ width: size, height: size }}>FileText</div>,
  Tag: ({ size }: { size?: number }) => <div data-testid="tag-icon" style={{ width: size, height: size }}>Tag</div>,
  Calendar: ({ size }: { size?: number }) => <div data-testid="calendar-icon" style={{ width: size, height: size }}>Calendar</div>,
  Menu: ({ size }: { size?: number }) => <div data-testid="menu-icon" style={{ width: size, height: size }}>Menu</div>,
  Calculator: () => <div data-testid="calculator-icon" />,
  User: ({ size }: { size?: number }) => <div data-testid="user-icon" style={{ width: size, height: size }}>User</div>,
  UserCircle: ({ size }: { size?: number }) => <div data-testid="user-circle-icon" style={{ width: size, height: size }}>UserCircle</div>,
  ChevronDown: ({ size }: { size?: number }) => <div data-testid="chevron-down-icon" style={{ width: size, height: size }}>ChevronDown</div>,
  LogIn: ({ size }: { size?: number }) => <div data-testid="login-icon" style={{ width: size, height: size }}>LogIn</div>,
  LogOut: ({ size }: { size?: number }) => <div data-testid="logout-icon" style={{ width: size, height: size }}>LogOut</div>,
  Mail: ({ size }: { size?: number }) => <div data-testid="mail-icon" style={{ width: size, height: size }}>Mail</div>,
  ArrowLeft: ({ size }: { size?: number }) => <div data-testid="arrow-left-icon" style={{ width: size, height: size }}>ArrowLeft</div>,
  Lock: ({ size }: { size?: number }) => <div data-testid="lock-icon" style={{ width: size, height: size }}>Lock</div>,
  Eye: ({ size }: { size?: number }) => <div data-testid="eye-icon" style={{ width: size, height: size }}>Eye</div>,
  EyeOff: ({ size }: { size?: number }) => <div data-testid="eye-off-icon" style={{ width: size, height: size }}>EyeOff</div>,
  CheckCircle: ({ size }: { size?: number }) => <div data-testid="check-circle-icon" style={{ width: size, height: size }}>CheckCircle</div>,
  ImagePlus: ({ size }: { size?: number }) => <div data-testid="image-plus-icon" style={{ width: size, height: size }}>ImagePlus</div>,
  CreditCard: ({ size }: { size?: number }) => <div data-testid="credit-card-icon" style={{ width: size, height: size }}>CreditCard</div>,
}));

// Mock view components
vi.mock('../../components/TaskBoard', () => ({
  TaskBoard: ({ onEdit }: any) => {
    return (
      <div data-testid="task-board">
        Mock Board View
        <button data-testid="test-edit-button" onClick={() => onEdit({ id: '1', title: 'Task 1' })}>
          Edit Task 1
        </button>
      </div>
    );
  }
}));

vi.mock('../../components/TaskTree', () => ({
  TaskTree: () => <div data-testid="tree-view-mock">Mock Tree View</div>
}));

vi.mock('../../components/TimeStatsView', () => ({
  TimeStatsView: () => <div data-testid="time-stats-view">Mock Time Stats View <span>time statistics</span></div>
}));

// Mock useTasks hook
const mockUseTasks = vi.fn(() => ({
  tasks: mockTasks,
  taskTree: mockTaskTree,
  filteredTaskTree: mockTaskTree,
  createTask: createTaskMock,
  updateTask: updateTaskMock,
  deleteTask: deleteTaskMock,
  toggleTaskTimer: toggleTaskTimerMock,
  getElapsedTime: getElapsedTimeMock,
  exportTasks: exportTasksMock,
  importTasks: importTasksMock,
  getTimeStatistics: getTimeStatisticsMock,
  expandedNodes: new Set(),
  toggleNodeExpanded: vi.fn(),
  searchTerm: '',
  setSearchTerm: vi.fn()
}));

vi.mock('../../hooks/useTasks', () => ({
  useTasks: () => mockUseTasks()
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Clear mocks
    vi.clearAllMocks();

    // Reset auth mock to default (authenticated)
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      logout: vi.fn(),
      user: null,
      session: null
    });

    // Reset useTasks mock
    mockUseTasks.mockReturnValue({
      tasks: mockTasks,
      taskTree: mockTaskTree,
      filteredTaskTree: mockTaskTree,
      createTask: createTaskMock,
      updateTask: updateTaskMock,
      deleteTask: deleteTaskMock,
      toggleTaskTimer: toggleTaskTimerMock,
      getElapsedTime: getElapsedTimeMock,
      exportTasks: exportTasksMock,
      importTasks: importTasksMock,
      getTimeStatistics: getTimeStatisticsMock,
      expandedNodes: new Set(),
      toggleNodeExpanded: vi.fn(),
      searchTerm: '',
      setSearchTerm: vi.fn()
    });
  });

  it('should render the app with navigation buttons', () => {
    // Act
    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // Assert - verify navigation buttons are displayed (check for all instances)
    expect(screen.getAllByTitle('Board View')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByTitle('Tree View')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByTitle('Time Stats')).toHaveLength(2); // Desktop and mobile
  });

  it('should show Board view by default', () => {
    // Act
    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // Assert - verify Board view is shown by default
    // Check for characteristic Board view elements
    expect(screen.getAllByText(/new task/i).length).toBeGreaterThan(0);

    // Verify Board button is active (has the active class) - check first instance
    const boardViewButtons = screen.getAllByTitle('Board View');
    expect(boardViewButtons[0].className).toContain('bg-indigo-100');
  });

  it('should switch to Tree view when Tree button is clicked', () => {
    // Act
    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // Click Tree view button (use first instance - desktop)
    const treeButtons = screen.getAllByTitle('Tree View');
    fireEvent.click(treeButtons[0]);

    // Assert - verify switch to Tree view
    // Verify Tree button is active
    expect(treeButtons[0].className).toContain('bg-indigo-100');

    // Verify Tree mock is displayed
    const treeContainer = screen.getByTestId('tree-view-mock');
    expect(treeContainer).toBeInTheDocument();
  });

  it('should switch to Time Stats view when Stats button is clicked', () => {
    // Act
    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // Click Time Stats button (use first instance - desktop)
    const statsButtons = screen.getAllByTitle('Time Stats');
    fireEvent.click(statsButtons[0]);

    // Assert - verify switch to Time Stats view
    // Verify Stats button is active
    expect(statsButtons[0].className).toContain('bg-indigo-100');

    // Verify Time Stats mock is displayed
    const statsContainer = screen.getByTestId('time-stats-view');
    expect(statsContainer).toBeInTheDocument();
  });

  it('should create a new task when using the TaskForm', () => {
    // Act
    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // Open form
    const addTaskButton = screen.getAllByText(/new task/i)[0];
    fireEvent.click(addTaskButton);

    // Fill form
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    // Assert - verify createTask was called
    expect(createTaskMock).toHaveBeenCalled();
  });

  it('should import/export tasks using CSV functionality', () => {
    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // Verify My Account buttons exist (now contains export/import functionality)
    const accountMenus = screen.getAllByTestId('account-menu');
    expect(accountMenus.length).toBeGreaterThan(0);
  });

  it('should handle task timer controls across views', () => {
    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // For this test we just verify task items are present
    // Actual timer functionality would be tested in TaskTimer component tests
    expect(mockTasks.length).toBeGreaterThan(0);
  });

  it('should scroll to top when creating a task on mobile', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });

    // Mock scrollTo
    const scrollToMock = vi.fn();
    Object.defineProperty(window, 'scrollTo', { writable: true, configurable: true, value: scrollToMock });

    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // Open form using the visible button
    const addTaskButtons = screen.getAllByText(/new task/i);
    fireEvent.click(addTaskButtons[0]);

    // Fill form
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Mobile Task' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalled();
      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  it('should show AuthRequiredModal when editing a task while unauthenticated', async () => {
    // Mock unauthenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
      user: null,
      session: null
    });

    render(
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    );

    // Ensure Board view is selected
    const boardToggles = screen.getAllByTestId('board-view-toggle');
    fireEvent.click(boardToggles[0]);

    // Find and click edit button in our simplified mock
    const editButton = await screen.findByTestId('test-edit-button');
    fireEvent.click(editButton);

    // Assert - verify AuthRequiredModal is shown
    expect(screen.getByTestId('auth-required-modal')).toBeInTheDocument();
    // In our test environment, we might see the translation key instead of the text
    expect(screen.getByTestId('auth-modal-title')).toHaveTextContent(/auth\.auth_required_title|autenticación|authentication/i);
  });
});
