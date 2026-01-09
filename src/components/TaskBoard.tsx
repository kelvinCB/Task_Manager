import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Task, TaskStatus } from '../types/Task';
import { getStatusColor, formatDate, isTaskOverdue, canCompleteTask, getTaskAncestry, getTaskDepth } from '../utils/taskUtils';
import { Plus, Calendar, Circle, Clock, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { TaskTimer } from './TaskTimer';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface TaskBoardProps {
  tasks: Task[];
  allTasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onCreateTask: () => void;
  onStartTimer?: (taskId: string) => void;
  onPauseTimer?: (taskId: string) => void;
  getElapsedTime?: (taskId: string) => number;
  onTaskClick?: (taskId: string) => void;
  showError?: (message: string) => void;
}



export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  allTasks,
  onStatusChange,
  onEdit,
  onDelete,
  onCreateTask,
  onStartTimer,
  onPauseTimer,
  getElapsedTime,
  onTaskClick,
  showError
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);

  const statusColumns: { status: TaskStatus; title: string; description: string }[] = [
    { status: 'Open', title: t('tasks.status_open'), description: t('tasks.status_open_desc') || 'Tasks ready to be started' },
    { status: 'In Progress', title: t('tasks.status_in_progress'), description: t('tasks.status_in_progress_desc') || 'Tasks currently being worked on' },
    { status: 'Done', title: t('tasks.status_done'), description: t('tasks.status_done_desc') || 'Completed tasks' }
  ];

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (targetStatus === 'Done' && task && !canCompleteTask(task, tasks)) {
        // Show error modal after a brief delay to allow the drag animation to complete
        setTimeout(() => {
          if (showError) {
            showError(t('tasks.cannot_complete_subtasks'));
          }
        }, 100);
        return;
      }
      onStatusChange(taskId, targetStatus);
    }
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete({ id: task.id, title: task.title });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      onDelete(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const renderTitle = (task: Task) => {
    const maxLength = 40;
    const isLong = task.title.length > maxLength;

    if (isLong) {
      const truncated = task.title.substring(0, maxLength);
      return (
        <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-1`}>
          {truncated}
          <button
            onClick={() => onEdit(task)}
            className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 transition-colors duration-200"
          >
            ...
          </button>
        </h4>
      );
    }

    return (
      <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} truncate mb-1`}>
        {task.title}
      </h4>
    );
  };

  const renderDescription = (task: Task) => {
    if (!task.description) return null;

    const maxLength = 80;
    const isLong = task.description.length > maxLength;

    if (isLong) {
      const truncated = task.description.substring(0, maxLength);
      return (
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 mb-2`}>
          {truncated}
          <button
            onClick={() => onEdit(task)}
            className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 transition-colors duration-200"
          >
            {t('tasks.see_more')}
          </button>
        </p>
      );
    }

    return (
      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 mb-2`}>
        {task.description}
      </p>
    );
  };

  return (
    <div className={`h-full overflow-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {statusColumns.map(column => {
          const columnTasks = getTasksByStatus(column.status);
          const getIconComponent = (status: TaskStatus) => {
            switch (status) {
              case 'Open': return Circle;
              case 'In Progress': return Clock;
              case 'Done': return CheckCircle;
              default: return Circle;
            }
          };
          const StatusIcon = getIconComponent(column.status);

          return (
            <div key={column.status} className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {/* Column Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-5 h-5 ${getStatusColor(column.status).split(' ')[0]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{column.title}</h2>
                      <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-200 text-gray-700'} rounded`}>
                        {columnTasks.length}
                      </span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{column.description}</p>
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <div
                className={`flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg border-2 border-dashed ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 min-h-[400px] transition-colors duration-200 ${theme === 'dark' ? 'hover:border-gray-600' : 'hover:border-gray-300'}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <div className="space-y-3">
                  {columnTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      data-testid="board-task-item"
                      data-task-title={task.title}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onTaskClick?.(task.id)}
                      className={`group mb-2 p-4 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} shadow-sm rounded-lg transition-all duration-200 cursor-move border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className={theme === 'dark' ? 'text-gray-100' : ''}>
                            {task.parentId && (
                              <div className={`text-[10px] mb-1 font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} flex flex-wrap items-center gap-1`}>
                                <span>{t('tasks.subtask_of')}: </span>
                                <span className="opacity-80">
                                  {getTaskAncestry(task, tasks).map(p => p.title).join(' > ')}
                                </span>
                              </div>
                            )}
                            {renderTitle(task)}
                            {renderDescription(task)}
                          </div>

                          {/* Desktop and Mobile layout - Consistent Badges */}
                          <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 text-[10px] sm:text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {/* Subtask / Level Badges */}
                            {(() => {
                              const hasSubtasks = allTasks.some(t => t.parentId === task.id);
                              const depth = task.parentId ? getTaskDepth(task, allTasks) : 0;
                              
                              if (!hasSubtasks && depth === 0) return null;
                              
                              return (
                                <div
                                  data-testid="subtask-badge"
                                  className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap font-bold shadow-sm ${theme === 'dark' ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}
                                >
                                  {hasSubtasks ? t('tasks.has_subtasks') : `Level ${depth}`}
                                </div>
                              );
                            })()}

                            {/* Dates */}
                            {task.dueDate ? (
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${isTaskOverdue(task) ? 'bg-red-500/10 text-red-500 border-red-500/20' : theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                <Calendar size={10} strokeWidth={2.5} />
                                <span>{t('tasks.due')} {formatDate(task.dueDate)}</span>
                                {isTaskOverdue(task) && <span className="ml-0.5">• {t('tasks.overdue')}</span>}
                              </div>
                            ) : (
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                <Calendar size={10} className="opacity-70" />
                                <span>{t('tasks.created')} {formatDate(task.createdAt)}</span>
                              </div>
                            )}

                            {/* Task Timer */}
                            {onStartTimer && onPauseTimer && getElapsedTime && (
                              <div
                                className={`px-2 py-0.5 sm:py-0 rounded-full border flex items-center gap-1.5 ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
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
                          </div>
                        </div>

                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(task);
                            }}
                            className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded transition-colors duration-200`}
                            title="Edit task"
                            data-testid="edit-task-button"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(task);
                            }}
                            className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'} rounded transition-colors duration-200`}
                            title="Delete task"
                            data-testid="delete-task-button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Task Button */}
                  {column.status === 'Open' && (
                    <button
                      onClick={onCreateTask}
                      className={`w-full p-4 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:text-gray-100 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400'} rounded-lg transition-colors duration-200 flex items-center justify-center gap-2`}
                    >
                      <Plus size={16} />
                      {t('tasks.new_task')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        taskTitle={taskToDelete?.title}
      />
    </div>
  );
};