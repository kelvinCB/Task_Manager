import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeStatsView } from '../../components/TimeStatsView';
import { TaskTimeStats } from '../../types/Task';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mocks para las pruebas
const mockGetTimeStatistics = vi.fn();

describe('TimeStatsView Component', () => {
  let mockTimeStats: TaskTimeStats[];
  
  beforeEach(() => {
    // Reiniciar mocks
    vi.clearAllMocks();
    
    // Crear datos mock para las estadísticas de tiempo
    mockTimeStats = [
      {
        id: 'task-1',
        title: 'Task 1',
        timeSpent: 3600000, // 1h
        status: 'Done',
        startDate: new Date('2021-07-01').getTime(),
        endDate: new Date('2021-07-01').getTime() + 3600000
      },
      {
        id: 'task-2',
        title: 'Task 2',
        timeSpent: 7200000, // 2h
        status: 'In Progress',
        startDate: new Date('2021-07-02').getTime(),
        endDate: new Date('2021-07-02').getTime() + 7200000
      }
    ];
    
    // Configurar getTimeStatistics para devolver los datos mock
    mockGetTimeStatistics.mockReturnValue(mockTimeStats);
  });
  
  it('should render the time statistics view with period selector', () => {
    // Act
    render(
      <ThemeProvider>
        <TimeStatsView getTimeStatistics={mockGetTimeStatistics} />
      </ThemeProvider>
    );
    
    // Assert - verificar que se muestra el título y los botones de periodo
    expect(screen.getByText(/Time Tracking Statistics/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /This Week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /This Month/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /This Year/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Custom/i })).toBeInTheDocument();
  });
  
  it('should show time stats for tasks', () => {
    // Act
    render(
      <ThemeProvider>
        <TimeStatsView getTimeStatistics={mockGetTimeStatistics} />
      </ThemeProvider>
    );
    
    // Assert - verificar que se muestran los datos de las tareas
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    
    // Verificar que se muestran las duraciones formateadas (formato h m s)
    expect(screen.getByText('1h 0m 0s')).toBeInTheDocument(); // 1h
    expect(screen.getByText('2h 0m 0s')).toBeInTheDocument(); // 2h
  });
  
  it('should call getTimeStatistics with the selected period', () => {
    // Act
    render(
      <ThemeProvider>
        <TimeStatsView getTimeStatistics={mockGetTimeStatistics} />
      </ThemeProvider>
    );
    
    // Limpiar las llamadas iniciales (mount + useEffect)
    mockGetTimeStatistics.mockClear();
    
    // Seleccionar un periodo diferente (semana)
    const weekButton = screen.getByRole('button', { name: /This Week/i });
    fireEvent.click(weekButton);
    
    // Assert - verificar que se llamó a getTimeStatistics con 'week'
    expect(mockGetTimeStatistics).toHaveBeenCalledWith('week');
  });
  
  it('should show custom date inputs when "custom" period is selected', () => {
    // Act
    render(
      <ThemeProvider>
        <TimeStatsView getTimeStatistics={mockGetTimeStatistics} />
      </ThemeProvider>
    );
    
    // Inicialmente no deberían mostrarse los campos de fecha personalizados
    expect(screen.queryByText(/Start Date/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/End Date/i)).not.toBeInTheDocument();
    
    // Seleccionar periodo personalizado haciendo clic en el botón Custom
    const customButton = screen.getByRole('button', { name: /Custom/i });
    fireEvent.click(customButton);
    
    // Assert - verificar que ahora se muestran los campos de fecha
    expect(screen.getByText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByText(/End Date/i)).toBeInTheDocument();
    // Verificar que hay 2 inputs de tipo date
    const dateInputs = screen.getAllByDisplayValue('');
    expect(dateInputs).toHaveLength(2);
  });
  
  it('should update custom date range and fetch new statistics', () => {
    // Act
    render(
      <ThemeProvider>
        <TimeStatsView getTimeStatistics={mockGetTimeStatistics} />
      </ThemeProvider>
    );
    
    // Limpiar las llamadas iniciales
    mockGetTimeStatistics.mockClear();
    
    // Seleccionar periodo personalizado haciendo clic en el botón Custom
    const customButton = screen.getByRole('button', { name: /Custom/i });
    fireEvent.click(customButton);
    
    // Esperar a que aparezcan los inputs de fecha por tipo date
    const dateInputs = screen.getAllByDisplayValue('');
    const startDateInput = dateInputs[0]; // Primer input (Start Date)
    const endDateInput = dateInputs[1];   // Segundo input (End Date)
    
    // Cambiar las fechas (esto automáticamente dispara el useEffect)
    fireEvent.change(startDateInput, { target: { value: '2021-07-01' } });
    fireEvent.change(endDateInput, { target: { value: '2021-07-05' } });
    
    // Assert - verificar que se llamó a getTimeStatistics con fechas personalizadas
    // (el useEffect se dispara automáticamente cuando cambian las fechas)
    expect(mockGetTimeStatistics).toHaveBeenCalledWith(
      'custom',
      expect.any(Date), // Fecha de inicio
      expect.any(Date)  // Fecha de fin
    );
  });
  
  it('should show total time spent across all tasks', () => {
    // Act
    render(
      <ThemeProvider>
        <TimeStatsView getTimeStatistics={mockGetTimeStatistics} />
      </ThemeProvider>
    );
    
    // El tiempo total debería ser 3h (1h + 2h = 3h = 10800000ms)
    
    // Assert - verificar que se muestra el tiempo total
    expect(screen.getByText(/Total Time/i)).toBeInTheDocument();
    expect(screen.getByText('3h 0m 0s')).toBeInTheDocument(); // 3h total
  });
  
  it('should handle empty statistics gracefully', () => {
    // Configurar getTimeStatistics para devolver array vacío
    mockGetTimeStatistics.mockReturnValue([]);
    
    // Act
    render(
      <ThemeProvider>
        <TimeStatsView getTimeStatistics={mockGetTimeStatistics} />
      </ThemeProvider>
    );
    
    // Assert - verificar que se muestra un mensaje de no datos
    expect(screen.getByText(/No time tracking data/i)).toBeInTheDocument();
    
    // El tiempo total debería ser 0 en formato h m s
    expect(screen.getByText('0h 0m 0s')).toBeInTheDocument();
  });
});
