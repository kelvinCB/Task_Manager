
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskDetailModal } from '../../components/TaskDetailModal';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Task } from '../../types/Task';

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'Open',
  createdAt: new Date('2024-01-01'),
  dueDate: new Date('2024-01-15'),
  depth: 0,
  childIds: [],
  timeTracking: {
    isActive: false,
    totalTimeSpent: 3600000, // 1 hour
    timeEntries: []
  }
};

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('TaskDetailModal', () => {
  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithTheme(
      <TaskDetailModal
        task={mockTask}
        isOpen={false}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should not render when task is null', () => {
    renderWithTheme(
      <TaskDetailModal
        task={null}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render task details when task is provided', () => {
    renderWithTheme(
      <TaskDetailModal
        task={mockTask}
        allTasks={[]}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('01:00:00')).toBeInTheDocument(); // 1 hour formatted
  });

  it('should call onClose when close button is clicked', () => {
    renderWithTheme(
      <TaskDetailModal
        task={mockTask}
        allTasks={[]}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onEdit when edit button is clicked', () => {
    renderWithTheme(
      <TaskDetailModal
        task={mockTask}
        allTasks={[]}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('should call onClose when Escape key is pressed', () => {
    renderWithTheme(
      <TaskDetailModal
        task={mockTask}
        allTasks={[]}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should render correct subtask count', () => {
    const subtasks: Task[] = [
      { ...mockTask, id: '2', parentId: mockTask.id, title: 'Subtask 1' },
      { ...mockTask, id: '3', parentId: mockTask.id, title: 'Subtask 2' },
    ];

    renderWithTheme(
      <TaskDetailModal
        task={mockTask}
        allTasks={[mockTask, ...subtasks]}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
