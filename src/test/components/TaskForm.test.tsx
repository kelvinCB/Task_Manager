import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskForm } from '../../components/TaskForm';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Task, TaskStatus } from '../../types/Task';
import * as openaiService from '../../services/openaiService';

// Mock the OpenAI service
vi.mock('../../services/openaiService', () => ({
  openaiService: {
    generateTaskDescription: vi.fn(),
    isConfigured: vi.fn(() => true)
  }
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
  dueDate: new Date('2024-12-31'),
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
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('TaskForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
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

      expect(screen.getByText('This task will be created as a subtask.')).toBeInTheDocument();
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
      const statusSelect = screen.getByRole('combobox', { name: /status/i });

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

      const closeButton = screen.getByRole('button', { name: '' }); // X button has no accessible name
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
      fireEvent.change(dueDateInput, { target: { value: '2024-12-25' } });

      fireEvent.click(screen.getByText('Save'));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Description',
        status: 'In Progress',
        dueDate: new Date('2024-12-25'),
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

      fireEvent.click(screen.getByText('Save'));

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

      fireEvent.click(screen.getByText('Save'));

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
              startTime: new Date('2024-01-01T10:00:00'),
              endTime: new Date('2024-01-01T10:50:00'),
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

      fireEvent.click(screen.getByText('Save'));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Updated Task Title',
        description: 'Updated Description',
        status: 'Open',
        dueDate: new Date('2024-12-31'),
        parentId: undefined,
        timeTracking: {
          totalTimeSpent: 3000,
          isActive: true,
          timeEntries: [
            {
              id: 'entry-1',
              startTime: new Date('2024-01-01T10:00:00'),
              endTime: new Date('2024-01-01T10:50:00'),
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
      fireEvent.click(screen.getByText('Save'));

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

      const aiButton = screen.getByTitle('AI Assistant - Generate description');
      expect(aiButton).toBeInTheDocument();
    });

    it('should show alert when clicking AI without title', () => {
      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <TestWrapper>
          <TaskForm
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const aiButton = screen.getByTitle('AI Assistant - Generate description');
      fireEvent.click(aiButton);

      expect(alertSpy).toHaveBeenCalledWith('Please enter a task title first to use AI assistance.');
      
      alertSpy.mockRestore();
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

      const aiButton = screen.getByTitle('AI Assistant - Generate description');
      fireEvent.click(aiButton);

      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Choose an AI action to enhance your task:')).toBeInTheDocument();
      expect(screen.getByText('Add Description')).toBeInTheDocument();
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

      const aiButton = screen.getByTitle('AI Assistant - Generate description');
      fireEvent.click(aiButton);

      expect(screen.getByText('AI Assistant')).toBeInTheDocument();

      // Get the cancel button inside the AI options panel
      const aiCancelButtons = screen.getAllByText('Cancel');
      const aiCancelButton = aiCancelButtons.find(button => 
        button.className.includes('px-2.5 py-1.5 text-xs')
      );
      fireEvent.click(aiCancelButton!);

      expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
    });

    it('should generate description using AI service', async () => {
      const mockGeneratedDescription = 'AI generated description for the task';
      (openaiService.openaiService.generateTaskDescription as any).mockResolvedValue(mockGeneratedDescription);

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

      const aiButton = screen.getByTitle('AI Assistant - Generate description');
      fireEvent.click(aiButton);

      const generateButton = screen.getByText('Add Description');
      fireEvent.click(generateButton);

      // Should show generating state
      expect(screen.getByText('Generating...')).toBeInTheDocument();

      await waitFor(() => {
        expect(openaiService.openaiService.generateTaskDescription).toHaveBeenCalledWith('Test Task Title', expect.any(String));
      });

      await waitFor(() => {
        const descriptionInput = screen.getByRole('textbox', { name: /description/i });
        expect(descriptionInput).toHaveValue(mockGeneratedDescription);
      });

      expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
    });

    it('should handle AI generation errors', async () => {
      const errorMessage = 'API key not configured';
      (openaiService.openaiService.generateTaskDescription as any).mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

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

      const aiButton = screen.getByTitle('AI Assistant - Generate description');
      fireEvent.click(aiButton);

      const generateButton = screen.getByText('Add Description');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(`Failed to generate description: ${errorMessage}`);
      });

      expect(screen.getByText('Add Description')).toBeInTheDocument(); // Button should be back to normal state

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

      const aiButton = screen.getByTitle('AI Assistant - Generate description');
      fireEvent.click(aiButton);

      const generateButton = screen.getByText('Add Description');
      fireEvent.click(generateButton);

      // Check that the button is disabled by looking for the button element, not the span
      const disabledButton = screen.getByRole('button', { name: /generating/i });
      expect(disabledButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!('Generated description');
      
      await waitFor(() => {
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      });
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
  });
});
