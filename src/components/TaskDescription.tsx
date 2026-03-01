import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Task } from '../types/Task';

interface TaskDescriptionProps {
  task: Task;
  onEdit: (task: Task) => void;
  className?: string; // Container classes
  lines?: 1 | 2 | 3;
}

const lineClampClasses = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
};

export const TaskDescription: React.FC<TaskDescriptionProps> = ({ task, onEdit, className = '', lines = 2 }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const text = (task.description ?? '').trim();
  if (!text) return null;

  const maxLength = 80;
  const isLong = text.length > maxLength;
  
  const textColorClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const clampClass = lineClampClasses[lines];
  const baseClasses = `${className} ${textColorClass}`;

  if (isLong) {
    const displayMax = maxLength - 3;
    const descriptionPrefix = text.substring(0, displayMax);
    const lastSpaceIndex = descriptionPrefix.lastIndexOf(' ');
    const cutIndex = lastSpaceIndex > 0 ? lastSpaceIndex : displayMax;
    const truncated = text.substring(0, cutIndex) + '...';
    
    return (
      <div className={`${baseClasses} ${clampClass}`}>
        <span>{truncated}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} font-medium ml-1 transition-colors duration-200 inline`}
        >
          {t('tasks.see_more')}
        </button>
      </div>
    );
  }

  return (
    <p className={`${baseClasses} ${clampClass}`}>
      {text}
    </p>
  );
};
