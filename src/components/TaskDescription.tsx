import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Task } from '../types/Task';

interface TaskDescriptionProps {
  task: Task;
  onEdit: (task: Task) => void;
  className?: string; // Container classes
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({ task, onEdit, className = '' }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!task.description) return null;

  const maxLength = 80;
  const isLong = task.description.length > maxLength;

  if (isLong) {
    const truncated = task.description.substring(0, maxLength);
    return (
      <p className={`${className} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        {truncated}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} font-medium ml-1 transition-colors duration-200`}
        >
          {t('tasks.see_more')}
        </button>
      </p>
    );
  }

  return (
    <p className={`${className} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
      {task.description}
    </p>
  );
};
