import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Task } from '../../types/Task';
import { TaskIdBadge } from './TaskIdBadge';

interface TruncatedTaskTitleProps {
  task: Task;
  maxLength: number;
  onEdit: (task: Task) => void;
  className?: string;
  idSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export const TruncatedTaskTitle: React.FC<TruncatedTaskTitleProps> = ({
  task,
  maxLength,
  onEdit,
  className = '',
  idSize = 'xs'
}) => {
  const { theme } = useTheme();
  const isLong = task.title.length > maxLength;
  
  const titleContent = isLong ? task.title.substring(0, maxLength) : task.title;

  return (
    <div className={`flex items-baseline min-w-0 ${className}`}>
      <TaskIdBadge id={task.id} size={idSize} />
      <h3 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} ${!isLong ? 'truncate' : ''}`}>
        {titleContent}
        {isLong && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 transition-colors duration-200"
          >
            ...
          </button>
        )}
      </h3>
    </div>
  );
};
