import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskForm } from '../../components/TaskForm';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Task, TaskStatus } from '../../types/Task';
import * as openaiService from '../../services/openaiService';
import { playNotificationSound } from '../../utils/audioUtils';
import { useAuth } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the contexts
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the OpenAI service
vi.mock('../../services/openaiService', () => ({
  openaiService: {
    generateTaskDescription: vi.fn(),
    improveGrammar: vi.fn(),
    isConfigured: vi.fn(() => true)
  }
}));

// Mock the audio utility
vi.mock('../../utils/audioUtils', () => ({
  playNotificationSound: vi.fn(),
}));

// Mock environment variables
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_OPENAI_MODEL: 'gpt-4o',
      OPENAI_API_KEY: 'test-key'
    }
  }
});

const mockTask: Task = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'Open' as TaskStatus,
  dueDate: new Date('2030-12-31'),
  createdAt: new Date('2024-01-01'),
  parentId: undefined,
  childIds: [],
  depth: 0,
  timeTracking: {
    totalTimeSpent: 0,
    isActive: false,
    timeEntries: []
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('TaskForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ isAuthenticated: true });
  });

  describe('Rendering', () => {
    it('should render create form when no task is provided', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('should have min attribute set to today on due date input', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const today = new Date().toISOString().split('T')[0];
      const dueDateInput = screen.getByLabelText(/due date/i);
      expect(dueDateInput).toHaveAttribute('min', today);
    });

    it('should render edit form when task is provided', () => {
      render(
        <TestWrapper>
          <TaskForm
            task={mockTask}
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Open')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={false}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    it('should show subtask info when parentId is provided', () => {
      render(
        <TestWrapper>
          <TaskForm
            parentId="parent-task-id"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Subtask Mode')).toBeInTheDocument();
      expect(screen.getByText(/This task will be nested under its parent./i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update form fields correctly', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      const statusSelect = screen.getByLabelText(/status/i);

      fireEvent.change(titleInput, { target: { value: 'New Task Title' } });
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
      fireEvent.change(statusSelect, { target: { value: 'In Progress' } });

      expect(titleInput).toHaveValue('New Task Title');
      expect(descriptionInput).toHaveValue('New Description');
      expect(statusSelect).toHaveValue('In Progress');
    });

    it('should call onClose when cancel button is clicked', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button is clicked', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should submit form with correct data', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      const dueDateInput = screen.getByLabelText(/due date/i);

      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
      fireEvent.change(statusSelect, { target: { value: 'In Progress' } });
      fireEvent.change(dueDateInput, { target: { value: '2030-12-25' } });

      fireEvent.click(screen.getByText('Create Task'));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Description',
        status: 'In Progress',
        dueDate: new Date('2030-12-25'),
        parentId: undefined,
        timeTracking: {
          totalTimeSpent: 0,
          isActive: false,
          timeEntries: []
        }
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not submit form without title', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Create Task'));

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should trim whitespace from title and description', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });

      fireEvent.change(titleInput, { target: { value: '  Trimmed Title  ' } });
      fireEvent.change(descriptionInput, { target: { value: '  Trimmed Description  ' } });

      fireEvent.click(screen.getByText('Create Task'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Trimmed Title',
          description: 'Trimmed Description'
        })
      );
    });

    it('should preserve timeTracking data when editing existing task', () => {
      const taskWithTimer = {
        ...mockTask,
        timeTracking: {
          totalTimeSpent: 3000, // 50 minutes
          isActive: true,
          timeEntries: [
            {
              id: 'entry-1',
              startTime: new Date('2024-01-01T10:00:00').getTime(),
              endTime: new Date('2024-01-01T10:50:00').getTime(),
              duration: 3000
            }
          ]
        }
      };

      render(
        <TestWrapper>
          <TaskForm
            task={taskWithTimer}
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });

      // Modify the task
      fireEvent.change(titleInput, { target: { value: 'Updated Task Title' } });
      fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });

      fireEvent.click(screen.getByText('Update Task'));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Updated Task Title',
        description: 'Updated Description',
        status: 'Open',
        dueDate: new Date('2030-12-31'),
        parentId: undefined,
        timeTracking: {
          totalTimeSpent: 3000,
          isActive: true,
          timeEntries: [
            {
              id: 'entry-1',
              startTime: new Date('2024-01-01T10:00:00').getTime(),
              endTime: new Date('2024-01-01T10:50:00').getTime(),
              duration: 3000
            }
          ]
        }
      });
    });

    it('should use default timeTracking for new tasks', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.click(screen.getByText('Create Task'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          timeTracking: {
            totalTimeSpent: 0,
            isActive: false,
            timeEntries: []
          }
        })
      );
    });
  });

  describe('AI Functionality', () => {
    it('should show AI icon in description field', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const aiButton = screen.getByTitle('AI Assistant');
      expect(aiButton).toBeInTheDocument();
    });

    it('should show validation error when clicking AI without title', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      expect(screen.getByText('Please enter a task title first to use AI assistance.')).toBeInTheDocument();
    });

    it('should show AI options when title is provided and AI button is clicked', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      expect(screen.getByText('AI POWERED')).toBeInTheDocument();
      expect(screen.getByText('Generate Description')).toBeInTheDocument();
    });

    it('should hide AI options when cancel is clicked', () => {
      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      expect(screen.getByText('AI POWERED')).toBeInTheDocument();

      // Get the dismiss button inside the AI options panel
      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      expect(screen.queryByText('AI POWERED')).not.toBeInTheDocument();
    });

    it('should generate description using AI service', async () => {
      const mockGeneratedDescription = 'AI generated description for the task';

      // Update mock to handle callback
      (openaiService.openaiService.generateTaskDescription as any).mockImplementation(
        async (_title: string, _model: string, onToken?: (token: string) => void) => {
          if (onToken) {
            onToken('<thinking>Thinking...</thinking>');
            onToken(mockGeneratedDescription);
          }
          return `<thinking>Thinking...</thinking>${mockGeneratedDescription}`;
        }
      );

      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Task Title' } });

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      const generateButton = screen.getByText('Generate Description');
      fireEvent.click(generateButton);

      // Should show generating state
      expect(screen.getByText('Generating...')).toBeInTheDocument();

      await waitFor(() => {
        expect(openaiService.openaiService.generateTaskDescription).toHaveBeenCalledWith(
          'Test Task Title',
          expect.any(String),
          expect.any(Function)
        );
      });

      await waitFor(() => {
        const descriptionInput = screen.getByRole('textbox', { name: /description/i });
        expect(descriptionInput).toHaveValue(mockGeneratedDescription);
      });

      expect(screen.queryByText('AI POWERED')).not.toBeInTheDocument();

      // Verify sound was played
      expect(playNotificationSound).toHaveBeenCalled();
    });

    it('should handle AI generation errors', async () => {
      const errorMessage = 'API key not configured';
      (openaiService.openaiService.generateTaskDescription as any).mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Task Title' } });

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      const generateButton = screen.getByText('Generate Description');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(`Failed to generate description: ${errorMessage}`);
      });

      expect(screen.getByText('Generate Description')).toBeInTheDocument(); // Button should be back to normal state

      alertSpy.mockRestore();
    });

    it('should disable generate button while generating', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      (openaiService.openaiService.generateTaskDescription as any).mockReturnValue(promise);

      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Task Title' } });

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      const generateButton = screen.getByText('Generate Description');
      fireEvent.click(generateButton);

      // Check that the button is disabled by looking for the button element, not the span
      const disabledButton = screen.getByRole('button', { name: /generating/i });
      expect(disabledButton).toBeDisabled();

      // Ensure Improve Grammar button is NOT showing processing state
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      expect(screen.getByText('Improve Grammar')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!('Generated description');

      await waitFor(() => {
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      });
    });

    it('should improve grammar using AI service', async () => {
      const mockImproved = 'Improved description.';
      (openaiService.openaiService.improveGrammar as any).mockResolvedValue(mockImproved);

      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      fireEvent.change(descriptionInput, { target: { value: 'Bad grammar text' } });

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      const improveButton = screen.getByText('Improve Grammar');
      fireEvent.click(improveButton);

      // Should show processing state
      expect(screen.getByText('Improving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(openaiService.openaiService.improveGrammar).toHaveBeenCalledWith('Bad grammar text', expect.any(String));
      });

      await waitFor(() => {
        expect(descriptionInput).toHaveValue(mockImproved);
      });

      expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();

      // Verify sound was played
      expect(playNotificationSound).toHaveBeenCalled();
    });

    it('should require description for grammar improvement', async () => {
      /* Mock alert */
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      // Empty description

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      const improveButton = screen.getByText('Improve Grammar');
      fireEvent.click(improveButton);

      expect(alertSpy).toHaveBeenCalledWith('Please enter a description first.');
      expect(openaiService.openaiService.improveGrammar).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should show AuthRequiredModal when generating description while unauthenticated', async () => {
      // Set unauthenticated state
      (useAuth as any).mockReturnValue({ isAuthenticated: false });

      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Task Title' } });

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      // Should show AuthRequiredModal immediately
      expect(screen.getByText('Unlock AI Power')).toBeInTheDocument();
      expect(screen.getByText(/Unlock the power of AI to supercharge your productivity/)).toBeInTheDocument();

      // OpenAI service should NOT have been called
      expect(openaiService.openaiService.generateTaskDescription).not.toHaveBeenCalled();
    });

    it('should show AuthRequiredModal when improving grammar while unauthenticated', async () => {
      // Set unauthenticated state
      (useAuth as any).mockReturnValue({ isAuthenticated: false });

      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      fireEvent.change(descriptionInput, { target: { value: 'Some text' } });

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);

      // Should show AuthRequiredModal immediately
      expect(screen.getByText('Unlock AI Power')).toBeInTheDocument();

      // OpenAI service should NOT have been called
      expect(openaiService.openaiService.improveGrammar).not.toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when task prop changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });

      expect(titleInput).toHaveValue('Changed Title');

      rerender(
        <TestWrapper>
          <TaskForm
            task={mockTask}
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      expect(titleInput).toHaveValue('Test Task');
    });

    it('should reset form when parentId changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <TaskForm
            parentId="parent-1"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });

      expect(titleInput).toHaveValue('Changed Title');

      rerender(
        <TestWrapper>
          <TaskForm
            parentId="parent-2"
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      expect(titleInput).toHaveValue('');
    });

    it('should clear validation error when modal is reopened', () => {
      const { rerender } = render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const aiButton = screen.getByTitle('AI Assistant');
      fireEvent.click(aiButton);
      expect(screen.getByText('Please enter a task title first to use AI assistance.')).toBeInTheDocument();

      // Close modal
      rerender(
        <TestWrapper>
          <TaskForm
            isOpen={false}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Reopen modal
      rerender(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Please enter a task title first to use AI assistance.')).not.toBeInTheDocument();
    });
  });
});
