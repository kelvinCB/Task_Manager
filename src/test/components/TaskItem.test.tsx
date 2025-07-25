import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from '../../components/TaskItem';
import { Task, TaskStatus } from '../../types/Task';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mocks para las pruebas
const mockOnStatusChange = vi.fn();
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnAddChild = vi.fn();
const mockOnToggleExpand = vi.fn();
const mockOnStartTimer = vi.fn();
const mockOnPauseTimer = vi.fn();
const mockGetElapsedTime = vi.fn().mockReturnValue(3600000); // 1h

describe('TaskItem Component', () => {
  let mockTask: Task;
  
  beforeEach(() => {
    // Reiniciar mocks
    vi.clearAllMocks();
    
    // Crear tarea mock para las pruebas
    mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'Open' as TaskStatus,
      createdAt: new Date('2021-07-01'),
      childIds: [],
      depth: 0,
      timeTracking: {
        isActive: false,
        totalTimeSpent: 3600000, // 1h
        timeEntries: []
      }
    };
    
    // Configurar valor por defecto para el tiempo transcurrido
    mockGetElapsedTime.mockReturnValue(3600000);
  });
  
  it('should render the task title and status', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskItem
          task={mockTask}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          hasChildren={false}
          canComplete={true}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
  
  it('should render the task description when expanded', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskItem
          task={mockTask}
          isExpanded={true} // Renderizar directamente como expandido
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          hasChildren={false}
          canComplete={true}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
  
  it('should open menu when clicking menu button', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskItem
          task={mockTask}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          hasChildren={false}
          canComplete={true}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Clic en el botón de menú con el ícono MoreHorizontal
    // Usamos una consulta más específica para obtener el botón de menú que tiene el svg de puntos
    const menuButtons = screen.getAllByRole('button', { name: '' });
    const menuButton = menuButtons.find(button => 
      button.innerHTML.includes('lucide-more-horizontal'));
    
    if (!menuButton) {
      throw new Error('Menu button not found');
    }
    
    fireEvent.click(menuButton);
    
    // Assert - buscar opciones del menú
    expect(screen.getByText(/edit/i)).toBeInTheDocument();
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });
  
  it('should call onStatusChange when changing task status', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskItem
          task={mockTask}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          hasChildren={false}
          canComplete={true}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Cambiar el estado directamente en el selector
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'In Progress' } });
    
    // Assert
    expect(mockOnStatusChange).toHaveBeenCalled();
    expect(mockOnStatusChange).toHaveBeenCalledWith('task-1', 'In Progress');
  });
  
  it('should display the task timer component with elapsed time', () => {
    // Configurar tarea con temporizador activo
    const taskWithActiveTimer = {
      ...mockTask,
      timeTracking: {
        ...mockTask.timeTracking,
        isActive: true
      }
    };
    
    // Act
    render(
      <ThemeProvider>
        <TaskItem
          task={taskWithActiveTimer}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          hasChildren={false}
          canComplete={true}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert - Verificar que se muestra el tiempo formateado (01:00:00 para 3600000ms)
    // Ahora tenemos versiones mobile y desktop, usamos getAllByText
    const timeDisplays = screen.getAllByText('01:00:00');
    expect(timeDisplays.length).toBeGreaterThan(0);
    
    // Verificar que se muestra el botón de pausa (puede haber múltiples)
    const pauseButtons = screen.getAllByTitle('Pause timer');
    expect(pauseButtons.length).toBeGreaterThan(0);
  });
  
  it('should call onStartTimer when play button is clicked', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskItem
          task={mockTask}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          hasChildren={false}
          canComplete={true}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Clic en el botón de iniciar temporizador (tomar el primero disponible)
    const playButtons = screen.getAllByTitle('Start timer');
    expect(playButtons.length).toBeGreaterThan(0);
    fireEvent.click(playButtons[0]);
    
    // Assert
    expect(mockOnStartTimer).toHaveBeenCalledWith('task-1');
  });
  
  it('should call onDelete when delete option is clicked', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskItem
          task={mockTask}
          isExpanded={false}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          hasChildren={false}
          canComplete={true}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Abrir menú - usar el mismo enfoque que en la prueba anterior
    const menuButtons = screen.getAllByRole('button', { name: '' });
    const menuButton = menuButtons.find(button => 
      button.innerHTML.includes('lucide-more-horizontal'));
    
    if (!menuButton) {
      throw new Error('Menu button not found');
    }
    
    fireEvent.click(menuButton);
    
    // Clic en la opción de eliminar
    const deleteOption = screen.getByText(/delete/i);
    fireEvent.click(deleteOption);
    
    // Assert
    expect(mockOnDelete).toHaveBeenCalledWith('task-1');
  });
});
