import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { TaskTimer } from '../../components/TaskTimer';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mocks for tests
const mockOnStart = vi.fn();
const mockOnPause = vi.fn();

describe('TaskTimer Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    
    // Mock Date.now() to have a consistent value
    vi.spyOn(Date, 'now').mockImplementation(() => 1625097600000); // 2021-07-01
    
    // Mock window.setInterval and clearInterval
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
    
    // Assert - check formatted time is displayed correctly
    expect(screen.getByText('01:01:01')).toBeInTheDocument();
    
    // Check that play button is displayed when inactive
    const playButton = screen.getByTitle('Start timer');
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
    
    // Assert - check that pause button is displayed when active
    const pauseButton = screen.getByTitle('Pause timer');
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
    const playButton = screen.getByTitle('Start timer');
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
    const pauseButton = screen.getByTitle('Pause timer');
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
    
    // Verify initial time
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
    
    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Verify the time updated
    expect(screen.getByText('00:00:01')).toBeInTheDocument();
    
    // Advance 59 seconds more (1 minute total)
    act(() => {
      vi.advanceTimersByTime(59000);
    });
    
    // Verify the time shows 1 minute
    expect(screen.getByText('00:01:00')).toBeInTheDocument();
  });
  
  it('should try to play a notification sound after 10 minutes', () => {
    // Arrange - mock playNotificationSound (since it's private, we'll spy on AudioContext)
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
    
    // Advance 10 minutes
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });
    
    // Assert - check that AudioContext was called to play sound
    expect(audioContextSpy).toHaveBeenCalled();
  });
});
