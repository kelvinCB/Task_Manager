import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Task } from '../types/Task';

interface TaskDescriptionProps {
  task: Task;
  onEdit: (task: Task) => void;
  className?: string; // Container classes
  lines?: number;
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({ task, onEdit, className = '', lines = 2 }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const text = (task.description ?? '').trim();
  if (!text) return null;

  const maxLength = 80;
  const isLong = text.length > maxLength;
  
  const textColorClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const clampClass = `line-clamp-${lines}`;
  const baseClasses = `${className} ${textColorClass}`;

  if (isLong) {
    const descriptionPrefix = text.substring(0, maxLength);
    const lastSpaceIndex = descriptionPrefix.lastIndexOf(' ');
    const cutIndex = lastSpaceIndex > 0 ? lastSpaceIndex : maxLength;
    const truncated = text.substring(0, cutIndex) + '...';
    
    return (
      <div className={baseClasses}>
        <span>{truncated}</span>
        <button
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
    <div className={`${baseClasses} ${clampClass}`}>
      {text}
    </div>
  );
};
