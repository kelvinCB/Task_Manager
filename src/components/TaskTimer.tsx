import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TaskTimerProps {
  taskId: string;
  isActive: boolean;
  elapsedTime: number; // in milliseconds
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
}

// Utility to format time in hh:mm:ss format
const formatTime = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
};

// Utility to play a short notification sound
const playNotificationSound = () => {
  try {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create an oscillator to generate a tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure the oscillator
    oscillator.type = 'sine'; // Sine wave type (smooth)
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime); // Frequency in Hz
    
    // Configure volume and duration
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime); // Higher volume (0.4 instead of 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.0); // Fade out for 2 seconds
    
    // Connect the nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2.0); // 2 seconds duration
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

export const TaskTimer: React.FC<TaskTimerProps> = ({ 
  taskId, 
  isActive, 
  elapsedTime, 
  onStart, 
  onPause 
}) => {
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(elapsedTime);
  const lastNotificationTimeRef = useRef(0);

  // Update elapsed time if timer is active
  useEffect(() => {
    let interval: number | null = null;
    
    if (isActive) {
      interval = window.setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 1000; // Update every second
          
          // Check if we should play a sound (every 10 minutes)
          const tenMinutesInMs = 10 * 60 * 1000;
          const previousMinutes = Math.floor(prevTime / tenMinutesInMs);
          const currentMinutes = Math.floor(newTime / tenMinutesInMs);
          
          if (currentMinutes > previousMinutes) {
            // Only play if at least 9 minutes have passed since last notification
            // This prevents multiple notifications if there are several active timers
            const now = Date.now();
            if (now - lastNotificationTimeRef.current > 9 * 60 * 1000) {
              playNotificationSound();
              lastNotificationTimeRef.current = now;
            }
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      setCurrentTime(elapsedTime); // Sync with external time when paused
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, elapsedTime]);

  // Format time more compactly for mobile
  const formatTimeCompact = (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-component flex items-center gap-1 text-sm" data-testid="task-timer">
      <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
      <span className={`font-mono text-xs sm:text-sm ${
        isActive 
          ? (theme === 'dark' ? 'text-green-400 font-bold' : 'text-green-600 font-bold')
          : (theme === 'dark' ? 'text-gray-300' : 'text-gray-600')
      }`} data-testid="elapsed-time">
        <span className="hidden sm:inline">{formatTime(currentTime)}</span>
        <span className="sm:hidden">{formatTimeCompact(currentTime)}</span>
      </span>
      {isActive ? (
        <button 
          onClick={() => onPause(taskId)}
          className={`p-0.5 sm:p-1 ${theme === 'dark' 
            ? 'text-orange-400 hover:text-orange-300 hover:bg-gray-700' 
            : 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'} rounded transition-all`}
          title="Pause timer"
        >
          <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      ) : (
        <button 
          onClick={() => onStart(taskId)}
          className={`p-0.5 sm:p-1 ${theme === 'dark' 
            ? 'text-green-400 hover:text-green-300 hover:bg-gray-700' 
            : 'text-green-500 hover:text-green-700 hover:bg-green-50'} rounded transition-all`}
          title="Start timer"
        >
          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
  );
};
