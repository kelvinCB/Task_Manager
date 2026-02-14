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
  const title = task.title ?? '';
  const isLong = title.length > maxLength;
  
  const titleContent = isLong ? title.substring(0, maxLength) : title;

  return (
    <div className={`flex items-baseline min-w-0 ${className}`}>
      {task.id && <TaskIdBadge id={task.id} size={idSize} />}
      <h3 
        className={`font-medium ${!isLong ? 'truncate' : ''}`}
        style={{ color: 'inherit' }}
      >
        {titleContent}
        {isLong && (
          <button
            type="button"
            aria-label="Ver título completo o editar tarea"
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
