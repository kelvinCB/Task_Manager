import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types/Task';
import { X, Calendar, FileText, Tag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TaskFormProps {
  task?: Task;
  parentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'childIds' | 'depth'>) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  parentId,
  isOpen,
  onClose,
  onSubmit
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Open' as TaskStatus,
    dueDate: '',
    parentId: parentId || ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        parentId: task.parentId || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'Open',
        dueDate: '',
        parentId: parentId || ''
      });
    }
  }, [task, parentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      parentId: formData.parentId || undefined,
      timeTracking: {
        totalTimeSpent: 0,
        isActive: false,
        timeEntries: []
      }
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`p-6 space-y-4 ${theme === 'dark' ? 'text-gray-200' : ''}`}>
          {/* Title */}
          <div>
            <label htmlFor="task-title" className={`flex items-center gap-2 text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <FileText size={16} />
              Title
            </label>
            <input
              id="task-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white'}`}
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className={`flex items-center gap-2 text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <FileText size={16} />
              Description
            </label>
            <textarea
              id="task-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 min-h-[100px] ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white'}`}
              placeholder="Enter task description..."
            ></textarea>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="task-status" className={`flex items-center gap-2 text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Tag size={16} />
              Status
            </label>
            <select
              id="task-status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white'}`}
            >
              <option value="Open" className={theme === 'dark' ? 'bg-gray-700 text-gray-100' : ''}>Open</option>
              <option value="In Progress" className={theme === 'dark' ? 'bg-gray-700 text-gray-100' : ''}>In Progress</option>
              <option value="Done" className={theme === 'dark' ? 'bg-gray-700 text-gray-100' : ''}>Done</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="task-due-date" className={`flex items-center gap-2 text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Calendar size={16} />
              Due Date (Optional)
            </label>
            <input
              id="task-due-date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white'}`}
            />
          </div>

          {/* Parent Info */}
          {parentId && (
            <div className={`rounded-lg p-3 ${theme === 'dark' ? 'bg-blue-900 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                This task will be created as a subtask.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className={`flex justify-end gap-3 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};