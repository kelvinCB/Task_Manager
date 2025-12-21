import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types/Task';
import { X, Calendar, FileText, Tag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { AIIcon } from './AIIcon';
import { openaiService } from '../services/openaiService';
import { FileUploader } from './FileUploader';
import { UploadResult } from '../services/taskService';

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
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [aiProcessingState, setAiProcessingState] = useState<'idle' | 'generating' | 'improving'>('idle');
  const [validationError, setValidationError] = useState('');

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
    
    if (!formData.title.trim()) {
      setValidationError('Title is required');
      return;
    }
    
    setValidationError('');

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      parentId: formData.parentId || undefined,
      timeTracking: task?.timeTracking || {
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
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                if (validationError) setValidationError(''); // Clear error when user types
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${validationError ? 'border-red-500' : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
              placeholder="Enter task title..."
              required
            />
            {validationError && (
              <p className="mt-1 text-sm text-red-500" role="alert">{validationError}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className={`flex items-center gap-2 text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <FileText size={16} />
              Description
            </label>
            <div className="relative">
              <textarea
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 min-h-[100px] resize-none ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white'}`}
                placeholder="Enter task description..."
              ></textarea>
              {/* AI Icon */}
              <button
                type="button"
                onClick={() => {
                  if (formData.title.trim()) {
                    setShowAIOptions(!showAIOptions);
                  } else {
                    // Optionally show a tooltip or alert that title is required
                    alert('Please enter a task title first to use AI assistance.');
                  }
                }}
                className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${theme === 'dark' ? 'hover:bg-gray-600 hover:bg-opacity-50' : 'hover:bg-gray-100 hover:bg-opacity-50'}`}
                title="AI Assistant - Generate description"
              >
                <AIIcon size={24} animated={true} />
              </button>
            </div>
            
            {/* AI Options UI */}
            {showAIOptions && formData.title.trim() && (
              <div className={`mt-3 p-4 rounded-lg border transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <AIIcon size={20} animated={true} />
                    <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                      AI Assistant
                    </h3>
                  </div>
                  <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-indigo-700' : 'bg-indigo-200'}`}></div>
                </div>
                
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Choose an AI action to enhance your task:
                </p>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setAiProcessingState('generating');
                      try {
                        const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';
                        const generatedDescription = await openaiService.generateTaskDescription(formData.title, model);
                        setFormData(prev => ({ 
                          ...prev, 
                          description: generatedDescription
                        }));
                        setShowAIOptions(false);
                      } catch (error) {
                        console.error('Error generating AI description:', error);
                        alert(`Failed to generate description: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      } finally {
                        setAiProcessingState('idle');
                      }
                    }}
                    disabled={aiProcessingState !== 'idle'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:opacity-70 ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md'
                    }`}
                  >
                    {aiProcessingState === 'generating' ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <AIIcon size={14} />
                        <span>Add Description</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.description.trim()) {
                        alert('Please enter a description first to improve its grammar.');
                        return;
                      }
                      
                      setAiProcessingState('improving');
                      try {
                        const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';
                        const improvedDescription = await openaiService.improveGrammar(formData.description, model);
                        setFormData(prev => ({ 
                          ...prev, 
                          description: improvedDescription
                        }));
                        setShowAIOptions(false);
                      } catch (error) {
                        console.error('Error improving grammar:', error);
                        alert(`Failed to improve grammar: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      } finally {
                        setAiProcessingState('idle');
                      }
                    }}
                    disabled={aiProcessingState !== 'idle'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:opacity-70 ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md'
                    }`}
                  >
                    {aiProcessingState === 'improving' ? (
                       <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <AIIcon size={14} />
                        <span>Improve Grammar</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowAIOptions(false)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors duration-200 ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
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

          {/* Attachments (File Upload) */}
          <div>
             <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <Tag size={16} /> {/* Reusing Tag icon for now or better Paperclip if available in imports */}
                Attachments
             </label>
             <FileUploader 
               onUploadComplete={(result: UploadResult) => {
                  // For now, append the file URL to the description as we don't have an attachments column
                  const startNewLine = formData.description ? '\n\n' : '';
                  const attachmentText = `${startNewLine}**Attachment:** [${result.file.name}](${result.file.url})`;
                  setFormData(prev => ({
                    ...prev,
                    description: prev.description + attachmentText
                  }));
               }}
               onError={(msg) => setValidationError(msg)}
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