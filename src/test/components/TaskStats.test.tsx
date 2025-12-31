import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskStats } from '../../components/TaskStats';
import { Task } from '../../types/Task';

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: Math.random().toString(),
  title: 'Test Task',
  description: '',
  status: 'Open',
  createdAt: new Date(),
  childIds: [],
  depth: 0,
  timeTracking: {
    totalTimeSpent: 0,
    isActive: false,
    timeEntries: [],
  },
  ...overrides,
});

describe('TaskStats', () => {
  it('should display zero counts for empty task list', () => {
    render(<TaskStats tasks={[]} />);

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(5); // Total, Open, In Progress, Done, Overdue
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
  });

  it('should count total tasks correctly', () => {
    const tasks = [
      createMockTask(),
      createMockTask(),
      createMockTask(),
    ];

    render(<TaskStats tasks={tasks} />);

    expect(screen.getAllByText('3')).toHaveLength(2); // Total and Open (since defaults are Open)
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
  });

  it('should count open tasks correctly', () => {
    const tasks = [
      createMockTask({ status: 'Open' }),
      createMockTask({ status: 'Open' }),
      createMockTask({ status: 'In Progress' }),
    ];

    render(<TaskStats tasks={tasks} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should count in progress tasks correctly', () => {
    const tasks = [
      createMockTask({ status: 'In Progress' }),
      createMockTask({ status: 'In Progress' }),
      createMockTask({ status: 'In Progress' }),
      createMockTask({ status: 'Open' }),
    ];

    render(<TaskStats tasks={tasks} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should count done tasks correctly', () => {
    const tasks = [
      createMockTask({ status: 'Done' }),
      createMockTask({ status: 'Done' }),
      createMockTask({ status: 'Open' }),
    ];

    render(<TaskStats tasks={tasks} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('should count overdue tasks correctly', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const tasks = [
      createMockTask({ status: 'Open', dueDate: pastDate }),
      createMockTask({ status: 'In Progress', dueDate: pastDate }),
      createMockTask({ status: 'Done', dueDate: pastDate }), // Should not count
      createMockTask({ status: 'Open' }), // No due date
    ];

    render(<TaskStats tasks={tasks} />);

    expect(screen.getAllByText('2')).toHaveLength(2); // Overdue and Open
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('should display all stat categories', () => {
    const tasks = [createMockTask()];

    render(<TaskStats tasks={tasks} />);

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});
