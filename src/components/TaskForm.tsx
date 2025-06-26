import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types/Task';
import { X, Calendar, FileText, Tag } from 'lucide-react';

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
      parentId: formData.parentId || undefined
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} />
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 resize-none"
              rows={3}
              placeholder="Enter task description..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Tag size={16} />
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} />
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          {/* Parent Info */}
          {parentId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                This task will be created as a subtask.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};