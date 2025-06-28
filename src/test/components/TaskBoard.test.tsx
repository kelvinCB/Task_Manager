import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskBoard } from '../../components/TaskBoard';
import { Task, TaskStatus } from '../../types/Task';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mocks para las pruebas
const mockOnStatusChange = vi.fn();
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnCreateTask = vi.fn();
const mockOnStartTimer = vi.fn();
const mockOnPauseTimer = vi.fn();
const mockGetElapsedTime = vi.fn().mockReturnValue(3600000); // 1h por defecto

describe('TaskBoard Component', () => {
  let mockTasks: Task[];
  
  beforeEach(() => {
    // Reiniciar mocks
    vi.clearAllMocks();
    
    // Crear tareas mock para las pruebas
    mockTasks = [
      {
        id: 'task-1',
        title: 'Open Task',
        description: 'This is an open task',
        status: 'Open' as TaskStatus,
        createdAt: new Date('2021-07-01'),
        childIds: [],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      },
      {
        id: 'task-2',
        title: 'In Progress Task',
        description: 'This is a task in progress',
        status: 'In Progress' as TaskStatus,
        createdAt: new Date('2021-07-02'),
        childIds: [],
        depth: 0,
        timeTracking: {
          isActive: true,
          lastStarted: new Date('2021-07-02').getTime(),
          totalTimeSpent: 1800000, // 30min
          timeEntries: [
            {
              startTime: new Date('2021-07-02').getTime(),
              endTime: undefined,
              duration: 0
            }
          ]
        }
      },
      {
        id: 'task-3',
        title: 'Done Task',
        description: 'This is a completed task',
        status: 'Done' as TaskStatus,
        createdAt: new Date('2021-07-03'),
        childIds: [],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 7200000, // 2h
          timeEntries: [
            {
              startTime: new Date('2021-07-03').getTime() - 7200000,
              endTime: new Date('2021-07-03').getTime(),
              duration: 7200000
            }
          ]
        }
      }
    ];
  });
  
  it('should render the board with correct columns and tasks', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskBoard 
          tasks={mockTasks}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateTask={mockOnCreateTask}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert - verificar que se muestran las columnas
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    
    // Verificar que se muestran las tareas
    expect(screen.getByText('Open Task')).toBeInTheDocument();
    expect(screen.getByText('In Progress Task')).toBeInTheDocument();
    expect(screen.getByText('Done Task')).toBeInTheDocument();
  });
  
  it('should render "Add New Task" button in Open column', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskBoard 
          tasks={mockTasks}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateTask={mockOnCreateTask}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert - verificar que hay un botón para añadir tareas en la columna Open
    const addButton = screen.getByText(/add new task/i);
    expect(addButton).toBeInTheDocument();
  });
  
  it('should call onCreateTask when "Add New Task" button is clicked', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskBoard 
          tasks={mockTasks}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateTask={mockOnCreateTask}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Clic en el botón de añadir tarea (columna Open)
    const addButton = screen.getByText(/add new task/i);
    fireEvent.click(addButton);
    
    // Assert
    expect(mockOnCreateTask).toHaveBeenCalled();
  });
  
  it('should render task timer component for tasks', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskBoard 
          tasks={mockTasks}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateTask={mockOnCreateTask}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert - verificar que se muestra el componente TaskTimer
    // La tarea en progreso debería mostrar un botón de pausa
    expect(screen.getAllByTitle('Pausar cronómetro').length).toBeGreaterThan(0);
    
    // La tarea abierta debería mostrar un botón de inicio
    expect(screen.getAllByTitle('Iniciar cronómetro').length).toBeGreaterThan(0);
  });
  
  it('should show task details when a task is clicked', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskBoard 
          tasks={mockTasks}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateTask={mockOnCreateTask}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Clic en la primera tarea
    const taskElement = screen.getByText('Open Task');
    // Encontrar el contenedor más cercano que sea un div
    const taskCard = taskElement.closest('div') || taskElement;
    fireEvent.click(taskCard);
    
    // Assert - verificar que se muestra la descripción
    expect(screen.getByText('This is an open task')).toBeInTheDocument();
  });
});
