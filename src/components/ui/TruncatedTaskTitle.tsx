import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Task } from '../../types/Task';
import { TaskIdBadge } from './TaskIdBadge';

interface TruncatedTaskTitleProps {
  task: Task;
  maxLength: number;
  onEdit?: (task: Task) => void;
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
  
  const titleContent = isLong ? Array.from(title).slice(0, safeMaxLength).join('') : title;
  const safeAriaLabel = `Edit task: ${Array.from(title).slice(0, 100).join('')}${title.length > 100 ? '...' : ''}`;

  const buttonThemeClasses = theme === 'dark' 
    ? 'text-indigo-400 hover:text-indigo-300' 
    : 'text-indigo-600 hover:text-indigo-800';

  const hasColorClass = /\b(?:[a-z0-9]+:)?text-(?:gray|red|blue|indigo|green|yellow|white|black|transparent|current|inherit|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|purple|fuchsia|pink|rose)(?:-\d+)?\b/.test(titleClassName) || 
                       titleClassName.includes('text-[') || 
                       ['text-current', 'text-transparent', 'text-inherit'].some(c => titleClassName.includes(c));
  const colorClasses = hasColorClass 
    ? '' 
    : (theme === 'dark' ? 'text-gray-100' : 'text-gray-900');

  return (
    <div className={`flex items-center min-w-0 ${className}`}>
      <Component 
        className={`font-medium flex items-center min-w-0 ${colorClasses} ${titleClassName}`}
        title={isLong ? title : undefined}
      >
        {task.id != null && <TaskIdBadge id={task.id} size={idSize} />}
        <span className="truncate">{titleContent}</span>
      </Component>
      {isLong && (
        <button
          type="button"
          aria-label={safeAriaLabel}
          onClick={(e) => {
            e.stopPropagation();
            if (onEdit) onEdit(task);
          }}
          className={`${buttonThemeClasses} font-medium ml-1 hover:underline focus:outline-none transition-colors duration-200 flex-shrink-0 cursor-pointer`}
        >
          ...
        </button>
      )}
    </div>
  );
};
