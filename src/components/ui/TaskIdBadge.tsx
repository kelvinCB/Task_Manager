import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TaskIdBadgeProps {
  id: string | number | undefined;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const TaskIdBadge: React.FC<TaskIdBadgeProps> = ({ id, className = '', size = 'xs' }) => {
  const { theme } = useTheme();

  if (id === undefined || id === null) return null;

  const sizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-[11px]',
    md: 'text-sm',
    lg: 'text-lg',
  };

  const opacityClass = theme === 'dark' ? 'text-gray-400 opacity-70' : 'text-gray-500 opacity-80';

  return (
    <span className={`font-mono mr-2 ${sizeClasses[size]} ${opacityClass} truncate max-w-[120px] ${className}`}>
      #{id}
    </span>
  );
};
