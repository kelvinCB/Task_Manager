import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Task, TaskStatus } from '../types/Task';
import { formatDate, isTaskOverdue, getStatusColor, getStatusIcon, getTaskAncestry } from '../utils/taskUtils';
import { ChevronRight, ChevronDown, MoreHorizontal, Calendar, User, Circle, Clock, CheckCircle, Play, Pause, CornerDownRight } from 'lucide-react';
import { TaskTimer } from './TaskTimer';
import { useTheme } from '../contexts/ThemeContext';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

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
  showError?: (message: string) => void;
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
  allTasks,
  showError
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
    e.stopPropagation(); // Stop propagation to prevent task click
    const newStatus = e.target.value as TaskStatus;
    if (newStatus === 'Done' && !canComplete) {
      if (showError) {
        showError(t('tasks.cannot_complete_subtasks'));
      }
      return;
    }
    onStatusChange(task.id, newStatus);
  };

  const handleDeleteClick = () => {
    setIsMenuOpen(false);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(task.id);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
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
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
          ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700 shadow-sm hover:border-gray-600'
            : 'bg-white hover:bg-gray-50 border-gray-200 shadow hover:shadow-md'
          } 
          ${isOverdue ? (theme === 'dark' ? 'border-l-red-500' : 'border-l-red-500') : ''}
          ${task.status === 'Done' ? 'opacity-70' : ''}
        `}
        style={{
          marginLeft: `${task.depth * 28}px`,
          borderLeftWidth: isOverdue ? '4px' : '1px'
        }}
        data-testid="task-item"
        data-task-title={task.title}
        onClick={() => onTaskClick?.(task.id)}
      >
        {/* Toggle Expand Section */}
        <div className="flex-shrink-0 pt-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(task.id);
            }}
            className={`
              p-1 rounded-md transition-colors duration-200
              ${hasChildren
                ? theme === 'dark'
                  ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-700'
                  : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                : 'invisible'
              }
            `}
            disabled={!hasChildren}
            data-testid="expand-button"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown size={15} strokeWidth={2.5} /> : <ChevronRight size={15} strokeWidth={2.5} />}
          </button>
        </div>

        {/* content container */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">

          <div className="flex items-start justify-between gap-4">
            {/* Title and breadcrumbs */}
            <div className="flex-1 min-w-0">
              {task.parentId && (
                <div className={`flex items-center gap-1 text-[10px] font-medium mb-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <CornerDownRight size={10} />
                  <span className="truncate max-w-[200px]">
                    {getTaskAncestry(task, allTasks).map(p => p.title).join(' / ')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <StatusIcon
                  size={16}
                  className={`
                    flex-shrink-0 mt-0.5
                    ${task.status === 'Done'
                      ? 'text-emerald-500'
                      : task.status === 'In Progress'
                        ? 'text-amber-500 animate-pulse-slow'
                        : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }
                  `}
                />
                <h3
                  className={`
                    text-base font-medium truncate leading-tight cursor-pointer
                    ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}
                    ${task.status === 'Done' ? 'line-through text-gray-500 decoration-gray-400' : ''}
                  `}
                >
                  {task.title}
                </h3>
              </div>
            </div>

            {/* QUICK Actions (Desktop) */}
            <div className={`
              hidden sm:flex items-center gap-2 transition-opacity duration-200
              ${isHovered || isMenuOpen ? 'opacity-100' : 'opacity-0'}
            `}>
              {/* Quick Edit */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className={`p-1.5 rounded-md ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-600'}`}
                title={t('common.edit')}
              >
                <span className="sr-only">{t('common.edit')}</span>
                {/* Reuse Edit Icon Logic or just text/icon - using simple edit icon here would be good if imported, or just triggering modal */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              </button>
              {/* Quick Add Subtask */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(task.id);
                }}
                className={`p-1.5 rounded-md ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-600'}`}
                title={t('tasks.add_subtask')}
              >
                <span className="sr-only">{t('tasks.add_subtask')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>

            {/* Action Menu & Status Selector Container */}
            <div className="flex items-center gap-2">
              {/* Time Tracker Mini */}
              {onStartTimer && onPauseTimer && getElapsedTime && (
                <div
                  className={`mr-2 px-3 py-1 rounded-full border flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <TaskTimer
                    taskId={task.id}
                    isActive={task.timeTracking.isActive}
                    elapsedTime={getElapsedTime(task.id)}
                    onStart={onStartTimer}
                    onPause={onPauseTimer}
                    compact={true}
                  />
                </div>
              )}

              <div onClick={(e) => e.stopPropagation()}>
                <select
                  value={task.status}
                  onChange={handleStatusChange}
                  className={`
                    px-2 py-1 text-xs font-medium rounded-full border appearance-none cursor-pointer text-center min-w-[80px]
                    transition-all duration-200
                    ${getStatusColor(task.status)}
                    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500/50
                  `}
                >
                  <option value="Open">{t('tasks.status_open')}</option>
                  <option value="In Progress">{t('tasks.status_in_progress')}</option>
                  <option value="Done" disabled={!canComplete}>
                    {t('tasks.status_done')}
                  </option>
                </select>
              </div>

              <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button
                  className={`
                    p-1.5 rounded-md transition-colors duration-200
                    ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}
                  `}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  data-testid="task-menu-button"
                >
                  <MoreHorizontal size={18} />
                </button>

                {isMenuOpen && (
                  <div className={`
                    absolute right-0 mt-2 w-40 rounded-xl shadow-xl border z-20 overflow-hidden text-sm font-medium
                    ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 ring-1 ring-black/5'}
                  `}>
                    <button
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                      onClick={() => {
                        onEdit(task);
                        setIsMenuOpen(false);
                      }}
                      data-testid="edit-task-button"
                    >
                      <span>{t('common.edit')}</span>
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                      onClick={() => {
                        onAddChild(task.id);
                        setIsMenuOpen(false);
                      }}
                      data-testid="add-subtask-button"
                    >
                      <span>{t('tasks.add_subtask')}</span>
                    </button>
                    <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}></div>
                    <button
                      className={`block w-full px-3 py-2 text-left text-sm ${theme === 'dark' ? 'text-red-400 hover:bg-red-900' : 'text-red-600 hover:bg-red-50'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick();
                      }}
                      data-testid="delete-task-button"
                    >
                      <span>{t('common.delete')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Snippet */}
          {task.description && (
            <p className={`
              text-xs line-clamp-1 ml-6
              ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
            `}>
              {task.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-3 mt-1 ml-6">
            {/* Dates */}
            {/* Dates in Pill */}
            {task.dueDate ? (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                <Calendar size={12} strokeWidth={2.5} />
                <span>{formatDate(task.dueDate)}</span>
                {isOverdue && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded-full ml-1">{t('tasks.overdue')}</span>}
              </div>
            ) : (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                <Calendar size={12} className="opacity-70" />
                <span>Created {formatDate(task.createdAt)}</span>
              </div>
            )}

            {/* Subtask Count Badge - Only if not zero and no expand button (or redundant) */}
            {(hasChildren || task.depth > 0) && (
              <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                {hasChildren ? t('tasks.has_subtasks') : `Level ${task.depth}`}
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        taskTitle={task.title}
      />
      {/* Connecting line for children (visual cue) */}
      {hasChildren && isExpanded && (
        <div
          className={`absolute bottom-0 left-[${(task.depth * 28) + 12}px] w-px h-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
          style={{ left: `${(task.depth * 28) + 15}px`, top: '100%' }} // Adjust based on layout
        />
      )}
    </div>
  );
};