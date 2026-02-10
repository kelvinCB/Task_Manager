import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

import { playNotificationSound } from '../utils/audioUtils';

interface TaskTimerProps {
  taskId: string;
  isActive: boolean;
  elapsedTime: number; // in milliseconds
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

const MAX_TIMER_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

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
export const TaskTimer: React.FC<TaskTimerProps> = ({
  taskId,
  isActive,
  elapsedTime,
  onStart,
  onPause,
  compact = false,
  disabled = false
}) => {
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(elapsedTime);
  const lastNotificationTimeRef = useRef(0);

  // Update elapsed time if timer is active
  useEffect(() => {
    let interval: number | null = null;

    if (isActive && !disabled) {
      interval = window.setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 1000; // Update every second

          // Check if we reached the 8-hour limit for this session
          const sessionDuration = newTime - elapsedTime;
          if (sessionDuration >= MAX_TIMER_DURATION_MS) {
            if (interval) window.clearInterval(interval);
            onPause(taskId);
            return elapsedTime + MAX_TIMER_DURATION_MS;
          }

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
  }, [isActive, elapsedTime, taskId, onPause, disabled]);


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
    <div className={`timer-component flex items-center gap-1 text-sm ${compact ? 'text-xs' : ''}`} data-testid="task-timer">
      <Clock className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-4 sm:h-4"} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
      <span className={`font-mono text-xs sm:text-sm ${isActive && !disabled
        ? (theme === 'dark' ? 'text-green-400 font-bold' : 'text-green-600 font-bold')
        : (theme === 'dark' ? 'text-gray-300' : 'text-gray-600')
        }`} data-testid="elapsed-time">
        {compact ? (
          <span>{formatTimeCompact(currentTime)}</span>
        ) : (
          <>
            <span className="hidden sm:inline">{formatTime(currentTime)}</span>
            <span className="sm:hidden">{formatTimeCompact(currentTime)}</span>
          </>
        )}
      </span>
      {!disabled && (
        isActive ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPause(taskId);
            }}
            className={`${compact ? 'p-0.5' : 'p-0.5 sm:p-1'} ${theme === 'dark'
              ? 'text-orange-400 hover:text-orange-300 hover:bg-gray-700'
              : 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'} rounded transition-all`}
            title="Pause timer"
            data-testid="pause-timer"
          >
            <Pause className={compact ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-4 sm:h-4"} />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStart(taskId);
            }}
            className={`${compact ? 'p-0.5' : 'p-0.5 sm:p-1'} ${theme === 'dark'
              ? 'text-green-400 hover:text-green-300 hover:bg-gray-700'
              : 'text-green-500 hover:text-green-700 hover:bg-green-50'} rounded transition-all`}
            title="Start timer"
            data-testid="start-timer"
          >
            <Play className={compact ? "w-2.5 h-2.5" : "w-3 h-3 sm:w-4 sm:h-4"} />
          </button>
        )
      )}
    </div>
  );
};
