import React from 'react';
import { Task, TaskStatus } from '../types/Task';
import { getStatusColor, getStatusIcon } from '../utils/taskUtils';
import { Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { TaskTimer } from './TaskTimer';

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onCreateTask: () => void;
  onStartTimer?: (taskId: string) => void;
  onPauseTimer?: (taskId: string) => void;
  getElapsedTime?: (taskId: string) => number;
}

const statusColumns: { status: TaskStatus; title: string; description: string }[] = [
  { status: 'Open', title: 'Open', description: 'Tasks ready to be started' },
  { status: 'In Progress', title: 'In Progress', description: 'Tasks currently being worked on' },
  { status: 'Done', title: 'Done', description: 'Completed tasks' }
];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onCreateTask,
  onStartTimer,
  onPauseTimer,
  getElapsedTime
}) => {
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
      onStatusChange(taskId, targetStatus);
    }
  };

  const renderTitle = (task: Task) => {
    const maxLength = 40;
    const isLong = task.title.length > maxLength;
    
    if (isLong) {
      const truncated = task.title.substring(0, maxLength);
      return (
        <h4 className="font-medium text-gray-900 mb-1">
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
      <h4 className="font-medium text-gray-900 truncate mb-1">
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
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {truncated}
          <button
            onClick={() => onEdit(task)}
            className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 transition-colors duration-200"
          >
            ...See more
          </button>
        </p>
      );
    }
    
    return (
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
        {task.description}
      </p>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {statusColumns.map(column => {
          const columnTasks = getTasksByStatus(column.status);
          const StatusIcon = LucideIcons[getStatusIcon(column.status) as keyof typeof LucideIcons] as React.ComponentType<{className?: string}>;
          
          return (
            <div key={column.status} className="flex flex-col h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-5 h-5 ${getStatusColor(column.status).split(' ')[0]}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <p className="text-sm text-gray-500">{column.description}</p>
                  </div>
                </div>
                <div className={`
                  px-2 py-1 text-xs font-medium rounded-full
                  ${getStatusColor(column.status)}
                `}>
                  {columnTasks.length}
                </div>
              </div>

              {/* Column Content */}
              <div
                className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-4 min-h-[400px] transition-colors duration-200 hover:border-gray-300"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <div className="space-y-3">
                  {columnTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-move group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {renderTitle(task)}
                          {renderDescription(task)}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Depth: {task.depth}</span>
                            {task.childIds.length > 0 && (
                              <span>• {task.childIds.length} subtask{task.childIds.length !== 1 ? 's' : ''}</span>
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

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => onEdit(task)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                          >
                            <LucideIcons.Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(task.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                          >
                            <LucideIcons.Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Task Button */}
                  {column.status === 'Open' && (
                    <button
                      onClick={onCreateTask}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add New Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};