import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Task, TaskStatus } from '../types/Task';
import { formatDate, isTaskOverdue, getStatusColor, getStatusIcon, getTaskAncestry } from '../utils/taskUtils';
import { ChevronRight, ChevronDown, MoreHorizontal, Calendar, User, Circle, Clock, CheckCircle } from 'lucide-react';
import { TaskTimer } from './TaskTimer';
import { useTheme } from '../contexts/ThemeContext';

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  hasChildren: boolean;
  canComplete: boolean;
  onStartTimer?: (taskId: string) => void;
  onPauseTimer?: (taskId: string) => void;
  getElapsedTime?: (taskId: string) => number;
  onTaskClick?: (taskId: string) => void;
  allTasks: Task[];
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onEdit,
  onDelete,
  onAddChild,
  hasChildren,
  canComplete,
  onStartTimer,
  onPauseTimer,
  getElapsedTime,
  onTaskClick,
  allTasks
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const getIconComponent = (status: TaskStatus) => {
    switch (status) {
      case 'Open': return Circle;
      case 'In Progress': return Clock;
      case 'Done': return CheckCircle;
      default: return Circle;
    }
  };
  const StatusIcon = getIconComponent(task.status);
  const isOverdue = isTaskOverdue(task);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    if (newStatus === 'Done' && !canComplete) {
      alert('Cannot complete a task that has incomplete subtasks');
      return;
    }
    onStatusChange(task.id, newStatus);
  };

  const renderTitle = () => {
    const maxLength = 60;
    const isLong = task.title.length > maxLength;

    if (isLong) {
      const truncated = task.title.substring(0, maxLength);
      return (
        <h3 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          {truncated}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className={`${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} font-medium ml-1 transition-colors duration-200`}
          >
            ...
          </button>
        </h3>
      );
    }

    return (
      <h3 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} truncate`}>
        {task.title}
      </h3>
    );
  };

  const renderDescription = () => {
    if (!task.description) return null;

    const maxLength = 80;
    const isLong = task.description.length > maxLength;

    if (isLong) {
      const truncated = task.description.substring(0, maxLength);
      return (
        <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
      <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
        {task.description}
      </p>
    );
  };

  return (
    <div className="group">
      <div
        className={`
          flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
          hover:shadow-md ${theme === 'dark' ? 'hover:border-indigo-700' : 'hover:border-indigo-200'} 
          ${theme === 'dark'
            ? isOverdue ? 'border-red-600/50 bg-gray-700 border-l-red-500 border-l-4' : 'border-gray-700 bg-gray-700'
            : isOverdue ? 'border-gray-200 bg-white border-l-red-500 border-l-4' : 'border-gray-200 bg-white'}
        `}
        style={{ marginLeft: `${task.depth * 24}px` }}
        data-testid="task-item"
        data-task-title={task.title}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => onToggleExpand(task.id)}
          className={`
            flex-shrink-0 p-1 rounded transition-colors duration-200
            ${hasChildren
              ? theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              : 'text-transparent cursor-default'
            }
          `}
          disabled={!hasChildren}
          data-testid="expand-button"
        >
          {hasChildren && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        </button>

        {/* Status Icon */}
        <div className="flex-shrink-0">
          <StatusIcon className={`w-5 h-5 ${getStatusColor(task.status).split(' ')[0]}`} />
        </div>

        {/* Task Content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onTaskClick?.(task.id)}
        >
          <div className="flex items-start justify-between space-x-2">
            <div className="flex-1 min-w-0">
              {task.parentId && (
                <div className={`text-[10px] mb-1 font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} flex flex-wrap items-center gap-1`}>
                  <span>{t('tasks.subtask_of')}: </span>
                  <span className="opacity-80">
                    {getTaskAncestry(task, allTasks).map(p => p.title).join(' > ')}
                  </span>
                </div>
              )}
              {renderTitle()}
              {renderDescription()}

              {/* Task Meta - Responsive Layout */}
              <div className="mt-2">
                {/* Mobile Layout */}
                <div className="sm:hidden space-y-1">
                  {/* Task Info with Timer and Due Date in one compact line */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                      {/* Date info (Created or Due) */}
                      {task.dueDate ? (
                        <div className={`flex items-center gap-1 text-xs ${isOverdue
                          ? 'text-red-600 font-medium'
                          : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                          <Calendar size={12} />
                          <span className="whitespace-nowrap">{t('tasks.due')} {formatDate(task.dueDate)}{isOverdue ? ` • ${t('tasks.overdue')}` : ''}</span>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Calendar size={12} />
                          <span className="whitespace-nowrap">{t('tasks.created')} {formatDate(task.createdAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Timer - always show if available */}
                    {onStartTimer && onPauseTimer && getElapsedTime && (
                      <div className="flex-shrink-0">
                        <TaskTimer
                          taskId={task.id}
                          isActive={task.timeTracking.isActive}
                          elapsedTime={getElapsedTime(task.id)}
                          onStart={onStartTimer}
                          onPause={onPauseTimer}
                        />
                      </div>
                    )}
                  </div>

                  {/* Hierarchy Info */}
                  {(hasChildren || task.depth > 0) && (
                    <div className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {hasChildren ? t('tasks.has_subtasks') : `${t('tasks.level')} ${task.depth}`}
                    </div>
                  )}
                </div>

                {/* Desktop Layout - unchanged */}
                <div className={`hidden sm:flex items-center gap-4 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{t('tasks.created')} {formatDate(task.createdAt)}</span>
                  </div>
                  {task.dueDate && (
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                      <Calendar size={12} />
                      <span>{t('tasks.due')} {formatDate(task.dueDate)}</span>
                      {isOverdue && <span className="text-red-600">• {t('tasks.overdue')}</span>}
                    </div>
                  )}
                  {task.depth > 0 && (
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span>{t('tasks.level')} {task.depth}</span>
                    </div>
                  )}
                  {/* Task Timer */}
                  {onStartTimer && onPauseTimer && getElapsedTime && (
                    <TaskTimer
                      taskId={task.id}
                      isActive={task.timeTracking.isActive}
                      elapsedTime={getElapsedTime(task.id)}
                      onStart={onStartTimer}
                      onPause={onPauseTimer}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-0 sm:ml-2">
              {/* Status Selector */}
              <select
                value={task.status}
                onChange={handleStatusChange}
                className={`
                  px-1 sm:px-2 py-0.5 text-xs font-medium border rounded-md transition-colors duration-200
                  ${getStatusColor(task.status)}
                  focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1
                  min-w-0 max-w-[70px] sm:max-w-none
                `}
              >
                <option value="Open">{t('tasks.status_open')}</option>
                <option value="In Progress" className="sm:hidden">{t('tasks.status_in_progress')}</option>
                <option value="In Progress" className="hidden sm:block">{t('tasks.status_in_progress')}</option>
                <option value="Done" disabled={!canComplete}>
                  {t('tasks.status_done')}{!canComplete ? ` (${t('tasks.has_subtasks')})` : ''}
                </option>
              </select>

              {/* Menu Button */}
              <div className="relative" ref={menuRef}>
                <button
                  className={`opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-0.5 sm:p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded transition-all duration-200`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(prev => !prev);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>

                {isMenuOpen && (
                  <div className={`absolute right-0 mt-1 w-32 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-md shadow-lg z-10`}>
                    <button
                      className={`block w-full px-3 py-2 text-left text-sm ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                        setIsMenuOpen(false);
                      }}
                      data-testid="edit-task-button"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className={`block w-full px-3 py-2 text-left text-sm ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddChild(task.id);
                        setIsMenuOpen(false);
                      }}
                      data-testid="add-subtask-button"
                    >
                      {t('tasks.add_subtask')}
                    </button>
                    <button
                      className={`block w-full px-3 py-2 text-left text-sm ${theme === 'dark' ? 'text-red-400 hover:bg-red-900' : 'text-red-600 hover:bg-red-50'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                        setIsMenuOpen(false);
                      }}
                      data-testid="delete-task-button"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};