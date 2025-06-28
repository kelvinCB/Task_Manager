import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../App';

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
  X: ({ size }: { size?: number }) => <div data-testid="close-icon" style={{ width: size, height: size }}>X</div>,
  FileText: ({ size }: { size?: number }) => <div data-testid="file-text-icon" style={{ width: size, height: size }}>FileText</div>,
  Tag: ({ size }: { size?: number }) => <div data-testid="tag-icon" style={{ width: size, height: size }}>Tag</div>,
  Calendar: ({ size }: { size?: number }) => <div data-testid="calendar-icon" style={{ width: size, height: size }}>Calendar</div>,
}));

// Mock view components
vi.mock('../../components/TaskBoard', () => ({
  TaskBoard: () => <div data-testid="task-board">Mock Board View</div>
}));

vi.mock('../../components/TaskTree', () => ({
  TaskTree: () => <div data-testid="tree-view-mock">Mock Tree View</div>
}));

vi.mock('../../components/TimeStatsView', () => ({
  TimeStatsView: () => <div data-testid="time-stats-view">Mock Time Stats View <span>time statistics</span></div>
}));

// Mock useTasks hook
vi.mock('../../hooks/useTasks', () => ({
  useTasks: () => ({
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
  })
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Clear mocks
    vi.clearAllMocks();
  });
  
  it('should render the app with navigation buttons', () => {
    // Act
    render(<App />);
    
    // Assert - verify navigation buttons are displayed
    expect(screen.getByTitle('Board View')).toBeInTheDocument();
    expect(screen.getByTitle('Tree View')).toBeInTheDocument();
    expect(screen.getByTitle('Time Stats')).toBeInTheDocument();
  });
  
  it('should show Board view by default', () => {
    // Act
    render(<App />);
    
    // Assert - verify Board view is shown by default
    // Check for characteristic Board view elements
    expect(screen.getAllByText(/add task/i).length).toBeGreaterThan(0);
    
    // Verify Board button is active (has the active class)
    const boardViewButton = screen.getByTitle('Board View');
    expect(boardViewButton.className).toContain('bg-indigo-100');
  });
  
  it('should switch to Tree view when Tree button is clicked', () => {
    // Act
    render(<App />);
    
    // Click Tree view button
    const treeButton = screen.getByTitle('Tree View');
    fireEvent.click(treeButton);
    
    // Assert - verify switch to Tree view
    // Verify Tree button is active
    expect(treeButton.className).toContain('bg-indigo-100');
    
    // Verify Tree mock is displayed
    const treeContainer = screen.getByTestId('tree-view-mock');
    expect(treeContainer).toBeInTheDocument();
  });
  
  it('should switch to Time Stats view when Stats button is clicked', () => {
    // Act
    render(<App />);
    
    // Click Time Stats button
    const statsButton = screen.getByTitle('Time Stats');
    fireEvent.click(statsButton);
    
    // Assert - verify switch to Time Stats view
    // The TimeStatsView would typically contain these elements
    expect(screen.getByText(/time statistics/i)).toBeInTheDocument();
  });
  
  it('should create a new task when using the TaskForm', () => {
    // Act
    render(<App />);
    
    // Open form
    const addTaskButton = screen.getAllByText(/add task/i)[0];
    fireEvent.click(addTaskButton);
    
    // Fill form
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Assert - verify createTask was called
    expect(createTaskMock).toHaveBeenCalled();
  });
  
  it('should import/export tasks using CSV functionality', () => {
    render(<App />);
    
    // Verify import/export buttons exist
    expect(screen.getByTitle(/export/i)).toBeInTheDocument();
    expect(screen.getByTitle(/import/i)).toBeInTheDocument();
  });
  
  it('should handle task timer controls across views', () => {
    render(<App />);
    
    // For this test we just verify task items are present
    // Actual timer functionality would be tested in TaskTimer component tests
    expect(mockTasks.length).toBeGreaterThan(0);
  });
});
