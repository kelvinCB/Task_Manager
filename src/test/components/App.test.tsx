import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../App';

// Mocks para localStorage
vi.mock('../../hooks/useTasks', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    // Podemos sobreescribir algunas funciones si es necesario
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada prueba
    localStorage.clear();
    
    // Limpiar mocks
    vi.clearAllMocks();
  });
  
  it('should render the app with navigation buttons', () => {
    // Act
    render(<App />);
    
    // Assert - verificar que se muestran los botones de navegación
    expect(screen.getByTitle(/board view/i)).toBeInTheDocument();
    expect(screen.getByTitle(/tree view/i)).toBeInTheDocument();
    expect(screen.getByTitle(/time stats/i)).toBeInTheDocument();
  });
  
  it('should show Board view by default', () => {
    // Act
    render(<App />);
    
    // Assert - verificar que se muestra la vista de Board por defecto
    // Buscamos elementos característicos del Board view
    expect(screen.getAllByText(/add task/i).length).toBeGreaterThan(0);
    
    // Verificar elementos que definitivamente existen en la vista Board
    
    // Verificar que existe un botón "Add Task" en alguna de las columnas
    expect(screen.getAllByText(/add task/i).length).toBeGreaterThan(0);
    
    // Verificar que estamos en la vista Board verificando que el botón Board está activo
    // (tiene una clase que indica que está seleccionado)
    const boardButton = screen.getByTitle('Board View');
    expect(boardButton.className).toContain('bg-indigo-100');
    
    // Verificar que NO estamos en la vista Tree (el botón Tree no está activo)
    const treeButton = screen.getByTitle('Tree View');
    expect(treeButton.className).not.toContain('bg-indigo-100');
  });
  
  it('should switch to Tree view when Tree button is clicked', () => {
    // Act
    render(<App />);
    
    // Cambiar a la vista de árbol
    const treeButton = screen.getByTitle(/tree view/i);
    fireEvent.click(treeButton);
    
    // Assert - verificar que se ha cambiado a la vista de árbol
    // En la vista de árbol normalmente hay un botón para crear una tarea raíz
    expect(screen.getByText(/create root task/i)).toBeInTheDocument();
  });
  
  it('should switch to Time Stats view when Stats button is clicked', () => {
    // Act
    render(<App />);
    
    // Cambiar a la vista de estadísticas
    const statsButton = screen.getByTitle(/time stats/i);
    fireEvent.click(statsButton);
    
    // Assert - verificar que se ha cambiado a la vista de estadísticas
    expect(screen.getByText(/time statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/period/i)).toBeInTheDocument();
  });
  
  it('should create a new task when using the TaskForm', async () => {
    // Act
    render(<App />);
    
    // Buscar y hacer clic en un botón "Add Task"
    const addTaskButton = screen.getAllByText(/add task/i)[0];
    fireEvent.click(addTaskButton);
    
    // Completar el formulario de nueva tarea
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Test Task' } });
    
    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'This is a test task' } });
    
    // Enviar el formulario
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Assert - verificar que se ha creado la tarea
    expect(screen.getByText('New Test Task')).toBeInTheDocument();
  });
  
  it('should import/export tasks using CSV functionality', () => {
    // Nota: Esta prueba es más compleja y puede requerir mockear la funcionalidad de Papa Parse
    // y los eventos de carga de archivos. Una implementación simplificada:
    
    // Act
    render(<App />);
    
    // Verificar que los botones de importar/exportar están presentes
    expect(screen.getByTitle(/import/i)).toBeInTheDocument();
    expect(screen.getByTitle(/export/i)).toBeInTheDocument();
  });
  
  it('should handle task timer controls across views', () => {
    // Act
    render(<App />);
    
    // Crear una tarea primero
    const addTaskButton = screen.getAllByText(/add task/i)[0];
    fireEvent.click(addTaskButton);
    
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Task with Timer' } });
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Iniciar el temporizador de la tarea
    const playButtons = screen.getAllByTitle('Iniciar cronómetro');
    // Hacer clic en el primer botón de inicio de temporizador que encontremos
    fireEvent.click(playButtons[0]);
    
    // Verificar que el temporizador está activo (aparece el botón de pausa)
    expect(screen.getByTitle('Pausar cronómetro')).toBeInTheDocument();
    
    // Cambiar a la vista de árbol
    const treeButton = screen.getByTitle(/tree view/i);
    fireEvent.click(treeButton);
    
    // Verificar que el temporizador sigue activo en la vista de árbol
    expect(screen.getByTitle('Pausar cronómetro')).toBeInTheDocument();
  });
});
