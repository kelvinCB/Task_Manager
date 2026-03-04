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
  const [displayTime, setDisplayTime] = useState(0);
  const displayTimeRef = useRef(0);
  const lastNotificationTimeRef = useRef(0);
  const elapsedTimeRef = useRef(elapsedTime);
  const activeStartAtRef = useRef<number | null>(null);
  const activeBaseElapsedRef = useRef(0);

  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    if (!isActive || disabled) {
      activeStartAtRef.current = null;
      // Keep latest visual time to avoid pause flicker if parent updates asynchronously.
      setDisplayTime(prev => {
        const next = Math.max(prev, elapsedTime);
        displayTimeRef.current = next;
        return next;
      });
      return;
    }

    activeStartAtRef.current = Date.now();
    activeBaseElapsedRef.current = elapsedTimeRef.current;
    displayTimeRef.current = activeBaseElapsedRef.current;
    setDisplayTime(activeBaseElapsedRef.current);

    const interval = window.setInterval(() => {
      const startedAt = activeStartAtRef.current;
      if (!startedAt) return;

      const sessionDuration = Date.now() - startedAt;
      const cappedSessionDuration = Math.min(sessionDuration, MAX_TIMER_DURATION_MS);
      const nextDisplayTime = activeBaseElapsedRef.current + cappedSessionDuration;

      // Check if we should play a sound (every 10 minutes)
      const tenMinutesInMs = 10 * 60 * 1000;
      const previousMinutes = Math.floor(displayTimeRef.current / tenMinutesInMs);
      const currentMinutes = Math.floor(nextDisplayTime / tenMinutesInMs);

      if (currentMinutes > previousMinutes) {
        const now = Date.now();
        if (now - lastNotificationTimeRef.current > 9 * 60 * 1000) {
          playNotificationSound();
          lastNotificationTimeRef.current = now;
        }
      }

      displayTimeRef.current = nextDisplayTime;
      setDisplayTime(nextDisplayTime);

      // Check if we reached the 8-hour limit for this session
      if (sessionDuration >= MAX_TIMER_DURATION_MS) {
        window.clearInterval(interval);
        onPause(taskId);
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isActive, taskId, onPause, disabled, elapsedTime]);

  const currentTime = isActive && !disabled
    ? displayTime
    : Math.max(displayTime, elapsedTime);

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
