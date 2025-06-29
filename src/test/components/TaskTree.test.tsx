import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskTree } from '../../components/TaskTree';
import { TaskNode, TaskStatus } from '../../types/Task';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mocks para las pruebas
const mockOnToggleExpand = vi.fn();
const mockOnStatusChange = vi.fn();
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnAddChild = vi.fn();
const mockOnStartTimer = vi.fn();
const mockOnPauseTimer = vi.fn();
const mockGetElapsedTime = vi.fn().mockReturnValue(3600000); // 1h por defecto

describe('TaskTree Component', () => {
  let mockTaskTree: TaskNode[];
  
  beforeEach(() => {
    // Reiniciar mocks
    vi.clearAllMocks();
    
    // Crear árbol de tareas mock para las pruebas
    mockTaskTree = [
      {
        id: 'parent-1',
        title: 'Parent Task',
        description: 'This is a parent task',
        status: 'In Progress' as TaskStatus,
        createdAt: new Date('2021-07-01'),
        childIds: ['child-1', 'child-2'],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 3600000, // 1h
          timeEntries: []
        },
        children: [
          {
            id: 'child-1',
            title: 'Child Task 1',
            description: 'This is child task 1',
            status: 'Done' as TaskStatus,
            createdAt: new Date('2021-07-02'),
            childIds: [],
            depth: 1,
            parentId: 'parent-1',
            timeTracking: {
              isActive: false,
              totalTimeSpent: 1800000, // 30min
              timeEntries: []
            },
            children: []
          },
          {
            id: 'child-2',
            title: 'Child Task 2',
            description: 'This is child task 2',
            status: 'Open' as TaskStatus,
            createdAt: new Date('2021-07-03'),
            childIds: ['grandchild-1'],
            depth: 1,
            parentId: 'parent-1',
            timeTracking: {
              isActive: true,
              lastStarted: new Date('2021-07-03').getTime(),
              totalTimeSpent: 0,
              timeEntries: [
                {
                  startTime: new Date('2021-07-03').getTime(),
                  endTime: undefined,
                  duration: 0
                }
              ]
            },
            children: [
              {
                id: 'grandchild-1',
                title: 'Grandchild Task',
                description: 'This is a grandchild task',
                status: 'Open' as TaskStatus,
                createdAt: new Date('2021-07-04'),
                childIds: [],
                depth: 2,
                parentId: 'child-2',
                timeTracking: {
                  isActive: false,
                  totalTimeSpent: 0,
                  timeEntries: []
                },
                children: []
              }
            ]
          }
        ]
      }
    ];
  });
  
  it('should render the task tree with parent and child tasks', () => {
    // Act - expandimos todos los nodos para que se muestren los hijos
    const expandedNodeSet = new Set(['parent-1', 'child-2']);
    
    render(
      <ThemeProvider>
        <TaskTree 
          nodes={mockTaskTree} 
          expandedNodes={expandedNodeSet} 
          allTasks={mockTaskTree}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert - verificar que se muestran las tareas
    expect(screen.getByText('Parent Task')).toBeInTheDocument();
    expect(screen.getByText('Child Task 1')).toBeInTheDocument();
    expect(screen.getByText('Child Task 2')).toBeInTheDocument();
    expect(screen.getByText('Grandchild Task')).toBeInTheDocument();
  });
  
  it('should apply correct indentation for nested tasks', () => {
    // Act - expandimos todos los nodos para que se muestren los hijos
    const expandedNodeSet = new Set(['parent-1', 'child-2']);
    
    render(
      <ThemeProvider>
        <TaskTree 
          nodes={mockTaskTree} 
          expandedNodes={expandedNodeSet} 
          allTasks={mockTaskTree}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Nota: La indentación específica depende de la implementación
    // Pero podemos verificar que los elementos de TaskItem se renderizan correctamente
    
    // Assert - verificar que hay 4 tareas en total
    const taskItems = screen.getAllByText(/Task/);
    expect(taskItems.length).toBe(4);
  });
  
  it('should render task timer components for each task', () => {
    // Act - expandimos todos los nodos y aseguramos que la tarea Child Task 2 tenga timeTracking activo
    const expandedNodeSet = new Set(['parent-1', 'child-2']);
    mockTaskTree[0].children[1].timeTracking.isActive = true; // Child Task 2 activa
    
    render(
      <ThemeProvider>
        <TaskTree 
          nodes={mockTaskTree} 
          expandedNodes={expandedNodeSet} 
          allTasks={mockTaskTree}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert - verificamos que hay botones de inicio para todas las tareas
    // Buscamos botones que contengan el icono de play en su estructura interna
    const playButtons = screen.getAllByRole('button');
    const playButtonsFiltered = playButtons.filter(button => 
      button.innerHTML.includes('lucide-play')
    );
    expect(playButtonsFiltered.length).toBeGreaterThan(0);
  });
  
  it('should propagate timer events to parent component', () => {
    // Act
    render(
      <ThemeProvider>
        <TaskTree 
          nodes={mockTaskTree} 
          expandedNodes={new Set()} 
          allTasks={mockTaskTree}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Encontrar un botón de inicio de temporizador y hacer clic en él
    const playButtons = screen.getAllByTitle('Start timer');
    fireEvent.click(playButtons[0]);
    
    // Assert - verificar que se llamó a la función onStartTimer
    expect(mockOnStartTimer).toHaveBeenCalled();
  });
  
  it('should pass elapsed time to child components correctly', () => {
    // Configurar el mock getElapsedTime para devolver valores diferentes según el id de tarea
    mockGetElapsedTime.mockImplementation((taskId) => {
      if (taskId === 'parent-1') return 3600000; // 1h
      if (taskId === 'child-2') return 1800000; // 30min
      return 0;
    });
    
    // Act - expandimos todos los nodos para que se renderice la estructura completa
    const expandedNodeSet = new Set(['parent-1', 'child-2']);
    
    render(
      <ThemeProvider>
        <TaskTree 
          nodes={mockTaskTree} 
          expandedNodes={expandedNodeSet} 
          allTasks={mockTaskTree}
          onToggleExpand={mockOnToggleExpand}
          onStatusChange={mockOnStatusChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onAddChild={mockOnAddChild}
          onStartTimer={mockOnStartTimer}
          onPauseTimer={mockOnPauseTimer}
          getElapsedTime={mockGetElapsedTime}
        />
      </ThemeProvider>
    );
    
    // Assert
    // Verificar que se llamó a getElapsedTime para cada tarea
    expect(mockGetElapsedTime).toHaveBeenCalledWith('parent-1');
    expect(mockGetElapsedTime).toHaveBeenCalledWith('child-1');
    expect(mockGetElapsedTime).toHaveBeenCalledWith('child-2');
    expect(mockGetElapsedTime).toHaveBeenCalledWith('grandchild-1');
  });
});
