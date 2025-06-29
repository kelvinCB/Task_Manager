import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { TaskTimer } from '../../components/TaskTimer';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mocks para las pruebas
const mockOnStart = vi.fn();
const mockOnPause = vi.fn();

describe('TaskTimer Component', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    vi.clearAllMocks();
    
    // Mock para Date.now() para tener un valor consistente
    vi.spyOn(Date, 'now').mockImplementation(() => 1625097600000); // 2021-07-01
    
    // Mock para window.setInterval y clearInterval
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  it('should render correctly with initial elapsed time', () => {
    // Arrange
    const props = {
      taskId: 'task-1',
      isActive: false,
      elapsedTime: 3661000, // 1h 1m 1s
      onStart: mockOnStart,
      onPause: mockOnPause,
    };
    
    // Act
    render(
      <ThemeProvider>
        <TaskTimer {...props} />
      </ThemeProvider>
    );
    
    // Assert - comprobar que se muestra el tiempo formateado correctamente
    expect(screen.getByText('01:01:01')).toBeInTheDocument();
    
    // Comprobar que se muestra el botón de reproducción cuando no está activo
    const playButton = screen.getByTitle('Iniciar cronómetro');
    expect(playButton).toBeInTheDocument();
  });
  
  it('should render pause button when timer is active', () => {
    // Arrange
    const props = {
      taskId: 'task-1',
      isActive: true,
      elapsedTime: 60000, // 1m
      onStart: mockOnStart,
      onPause: mockOnPause,
    };
    
    // Act
    render(
      <ThemeProvider>
        <TaskTimer {...props} />
      </ThemeProvider>
    );
    
    // Assert - comprobar que se muestra el botón de pausa cuando está activo
    const pauseButton = screen.getByTitle('Pausar cronómetro');
    expect(pauseButton).toBeInTheDocument();
  });
  
  it('should call onStart callback when play button is clicked', () => {
    // Arrange
    const props = {
      taskId: 'task-1',
      isActive: false,
      elapsedTime: 0,
      onStart: mockOnStart,
      onPause: mockOnPause,
    };
    
    // Act
    render(
      <ThemeProvider>
        <TaskTimer {...props} />
      </ThemeProvider>
    );
    const playButton = screen.getByTitle('Iniciar cronómetro');
    fireEvent.click(playButton);
    
    // Assert
    expect(mockOnStart).toHaveBeenCalledWith('task-1');
    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });
  
  it('should call onPause callback when pause button is clicked', () => {
    // Arrange
    const props = {
      taskId: 'task-1',
      isActive: true,
      elapsedTime: 0,
      onStart: mockOnStart,
      onPause: mockOnPause,
    };
    
    // Act
    render(
      <ThemeProvider>
        <TaskTimer {...props} />
      </ThemeProvider>
    );
    const pauseButton = screen.getByTitle('Pausar cronómetro');
    fireEvent.click(pauseButton);
    
    // Assert
    expect(mockOnPause).toHaveBeenCalledWith('task-1');
    expect(mockOnPause).toHaveBeenCalledTimes(1);
  });
  
  it('should update time display every second when active', () => {
    // Arrange
    const props = {
      taskId: 'task-1',
      isActive: true,
      elapsedTime: 0,
      onStart: mockOnStart,
      onPause: mockOnPause,
    };
    
    // Act
    render(
      <ThemeProvider>
        <TaskTimer {...props} />
      </ThemeProvider>
    );
    
    // Verificar el tiempo inicial
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
    
    // Avanzar 1 segundo
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Verificar que el tiempo se actualizó
    expect(screen.getByText('00:00:01')).toBeInTheDocument();
    
    // Avanzar 59 segundos más (1 minuto total)
    act(() => {
      vi.advanceTimersByTime(59000);
    });
    
    // Verificar que el tiempo muestra 1 minuto
    expect(screen.getByText('00:01:00')).toBeInTheDocument();
  });
  
  it('should try to play a notification sound after 10 minutes', () => {
    // Arrange - mock para playNotificationSound (como es privada, espiaremos el AudioContext)
    const audioContextSpy = vi.spyOn(window, 'AudioContext');
    
    const props = {
      taskId: 'task-1',
      isActive: true,
      elapsedTime: 0,
      onStart: mockOnStart,
      onPause: mockOnPause,
    };
    
    // Act
    render(
      <ThemeProvider>
        <TaskTimer {...props} />
      </ThemeProvider>
    );
    
    // Avanzar 10 minutos
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });
    
    // Assert - comprobar que se llamó al AudioContext para reproducir el sonido
    expect(audioContextSpy).toHaveBeenCalled();
  });
});
