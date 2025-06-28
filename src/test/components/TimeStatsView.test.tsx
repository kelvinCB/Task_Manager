import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeStatsView } from '../../components/TimeStatsView';
import { TaskTimeStats } from '../../types/Task';

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
    render(<TimeStatsView getTimeStatistics={mockGetTimeStatistics} />);
    
    // Assert - verificar que se muestra el selector de periodo
    expect(screen.getByText(/Time Statistics/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Period/i)).toBeInTheDocument();
  });
  
  it('should show time stats for tasks', () => {
    // Act
    render(<TimeStatsView getTimeStatistics={mockGetTimeStatistics} />);
    
    // Assert - verificar que se muestran los datos de las tareas
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    
    // Verificar que se muestran las duraciones formateadas
    expect(screen.getByText('01:00:00')).toBeInTheDocument(); // 1h
    expect(screen.getByText('02:00:00')).toBeInTheDocument(); // 2h
  });
  
  it('should call getTimeStatistics with the selected period', () => {
    // Act
    render(<TimeStatsView getTimeStatistics={mockGetTimeStatistics} />);
    
    // Seleccionar un periodo diferente (semana)
    const periodSelect = screen.getByLabelText(/Period/i);
    fireEvent.change(periodSelect, { target: { value: 'week' } });
    
    // Assert - verificar que se llamó a getTimeStatistics con 'week'
    expect(mockGetTimeStatistics).toHaveBeenCalledWith('week');
  });
  
  it('should show custom date inputs when "custom" period is selected', () => {
    // Act
    render(<TimeStatsView getTimeStatistics={mockGetTimeStatistics} />);
    
    // Inicialmente no deberían mostrarse los campos de fecha personalizados
    expect(screen.queryByLabelText(/Start Date/i)).not.toBeInTheDocument();
    
    // Seleccionar periodo personalizado
    const periodSelect = screen.getByLabelText(/Period/i);
    fireEvent.change(periodSelect, { target: { value: 'custom' } });
    
    // Assert - verificar que ahora se muestran los campos de fecha
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
  });
  
  it('should update custom date range and fetch new statistics', () => {
    // Act
    render(<TimeStatsView getTimeStatistics={mockGetTimeStatistics} />);
    
    // Seleccionar periodo personalizado
    const periodSelect = screen.getByLabelText(/Period/i);
    fireEvent.change(periodSelect, { target: { value: 'custom' } });
    
    // Esperar a que aparezcan los inputs de fecha
    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    
    // Cambiar las fechas
    fireEvent.change(startDateInput, { target: { value: '2021-07-01' } });
    fireEvent.change(endDateInput, { target: { value: '2021-07-05' } });
    
    // Aplicar el filtro personalizado
    const applyButton = screen.getByRole('button', { name: /Apply/i });
    fireEvent.click(applyButton);
    
    // Assert - verificar que se llamó a getTimeStatistics con fechas personalizadas
    expect(mockGetTimeStatistics).toHaveBeenCalledWith(
      'custom',
      expect.any(Date), // Fecha de inicio
      expect.any(Date)  // Fecha de fin
    );
  });
  
  it('should show total time spent across all tasks', () => {
    // Act
    render(<TimeStatsView getTimeStatistics={mockGetTimeStatistics} />);
    
    // El tiempo total debería ser 3h (1h + 2h = 3h = 10800000ms)
    
    // Assert - verificar que se muestra el tiempo total
    expect(screen.getByText(/Total Time/i)).toBeInTheDocument();
    expect(screen.getByText('03:00:00')).toBeInTheDocument(); // 3h total
  });
  
  it('should handle empty statistics gracefully', () => {
    // Configurar getTimeStatistics para devolver array vacío
    mockGetTimeStatistics.mockReturnValue([]);
    
    // Act
    render(<TimeStatsView getTimeStatistics={mockGetTimeStatistics} />);
    
    // Assert - verificar que se muestra un mensaje de no datos
    expect(screen.getByText(/No time tracking data/i)).toBeInTheDocument();
    
    // El tiempo total debería ser 0
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });
});
