import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskComments } from '../../components/TaskComments';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { taskService } from '../../services/taskService';

vi.mock('../../services/taskService', () => ({
  taskService: {
    getComments: vi.fn(),
    addComment: vi.fn(),
  },
}));

const mockComments = [
  {
    id: 'c1',
    taskId: '1',
    userId: 'u1',
    authorName: 'User One',
    content: 'First comment',
    createdAt: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: 'c2',
    taskId: '1',
    userId: 'u2',
    authorName: 'Bot One',
    content: 'Second comment',
    createdAt: new Date('2024-01-01T11:00:00Z'),
  },
];

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('TaskComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render comments and handle loading state', async () => {
    vi.mocked(taskService.getComments).mockResolvedValue({ data: mockComments });

    renderWithTheme(<TaskComments taskId="1" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Bot One')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
    });
  });

  it('should show empty message when no comments', async () => {
    vi.mocked(taskService.getComments).mockResolvedValue({ data: [] });

    renderWithTheme(<TaskComments taskId="1" />);

    await waitFor(() => {
      expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    });
  });

  it('should add a new comment', async () => {
    vi.mocked(taskService.getComments).mockResolvedValue({ data: [] });
    const newComment = {
      id: 'c3',
      taskId: '1',
      userId: 'u1',
      authorName: 'User One',
      content: 'New test comment',
      createdAt: new Date(),
    };
    vi.mocked(taskService.addComment).mockResolvedValue({ data: newComment });

    renderWithTheme(<TaskComments taskId="1" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: 'New test comment' } });

    // The Send button has a Send icon but it's a button
    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(taskService.addComment).toHaveBeenCalledWith('1', 'New test comment');
      expect(screen.getByText('New test comment')).toBeInTheDocument();
    });
  });
});
