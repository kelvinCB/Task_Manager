import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Task } from '../../types/Task';
import { TaskIdBadge } from './TaskIdBadge';

interface TruncatedTaskTitleProps {
  task: Task;
  maxLength: number;
  onEdit: (task: Task) => void;
  className?: string;
  titleClassName?: string;
  idSize?: 'xs' | 'sm' | 'md' | 'lg';
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
}

export const TruncatedTaskTitle: React.FC<TruncatedTaskTitleProps> = ({
  task,
  maxLength,
  onEdit,
  className = '',
  titleClassName = '',
  idSize = 'xs',
  as: Component = 'h3'
}) => {
  const { theme } = useTheme();
  const title = task.title ?? '';
  const safeMaxLength = Math.max(1, maxLength);
  const isLong = title.length > safeMaxLength;
  
  const titleContent = isLong ? title.substring(0, safeMaxLength) : title;

  const buttonThemeClasses = theme === 'dark' 
    ? 'text-indigo-400 hover:text-indigo-300' 
    : 'text-indigo-600 hover:text-indigo-800';

  const hasColorClass = /\btext-(?:[a-z]+(?:-[0-9]{2,3})?|black|white|transparent|current|inherit)\b/.test(titleClassName);
  const colorClasses = hasColorClass 
    ? '' 
    : (theme === 'dark' ? 'text-gray-100' : 'text-gray-900');

  return (
    <div className={`flex items-center min-w-0 ${className}`}>
      {task.id != null && <TaskIdBadge id={task.id} size={idSize} />}
      <Component 
        className={`font-medium flex items-center ${!isLong ? 'truncate' : ''} ${colorClasses} ${titleClassName}`}
        title={isLong ? title : undefined}
      >
        <span className={!isLong ? 'truncate' : ''}>{titleContent}</span>
        {isLong && (
          <button
            type="button"
            aria-label={`Ver título completo: ${title.substring(0, 100)}${title.length > 100 ? '...' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className={`${buttonThemeClasses} font-medium ml-1 transition-colors duration-200 flex-shrink-0`}
          >
            ...
          </button>
        )}
      </Component>
    </div>
  );
};
