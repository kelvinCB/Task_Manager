
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Task } from '../types/Task';
import { useTheme } from '../contexts/ThemeContext';
import { formatDate, getStatusColor, formatTime } from '../utils/taskUtils';
import { X, Calendar, Clock, Edit2, AlertCircle, CheckCircle } from 'lucide-react';
import { extractAttachments } from '../utils/attachmentUtils';
import { AttachmentList } from './AttachmentList';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  getElapsedTime?: (taskId: string) => number;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  getElapsedTime
}) => {
  const { theme } = useTheme();

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl transition-all duration-200 ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
          }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Content */}
        <div className="p-6 sm:p-8">
          {task && (
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-2xl font-bold leading-tight break-words pr-8">{task.title}</h2>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        onEdit(task);
                        onClose();
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${theme === 'dark'
                          ? 'bg-gray-700 text-indigo-400 hover:bg-gray-600'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={onClose}
                      className={`p-2 rounded-full transition-colors duration-200 ${theme === 'dark'
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                        }`}
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>


                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-0.5 text-sm font-medium border rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>

                  <div className={`flex items-center gap-1.5 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    <Calendar size={14} />
                    <span>Created {formatDate(task.createdAt)}</span>
                  </div>

                  {task.dueDate && (
                    <div className={`flex items-center gap-1.5 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      <AlertCircle size={14} className={new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'text-red-500' : ''} />
                      <span className={new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'text-red-500 font-medium' : ''}>
                        Due {formatDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <hr className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />

              <div className="space-y-2">
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  Description
                </h3>
                <div className={`prose max-w-none ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  {(() => {
                    const { text, attachments } = extractAttachments(task.description || '');
                    return (
                      <>
                        {text ? (
                          <div className={`markdown-preview ${theme === 'dark' ? 'prose-invert' : ''}`}>
                            <ReactMarkdown
                              components={{
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-4" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-md font-bold mb-1 mt-3" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2 whitespace-pre-wrap" {...props} />,
                                code: ({node, ...props}) => <code className={`px-1 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`} {...props} />,
                              }}
                            >
                              {text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          attachments.length === 0 && <p className="italic text-gray-400">No description provided.</p>
                        )}

                        {attachments.length > 0 && (
                          <div className="mt-4">
                            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                              Attachments
                            </h4>
                            <AttachmentList attachments={attachments} readonly={true} />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Stats / Metadata */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                {/* Time Tracking */}
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <Clock size={16} className="text-indigo-500" />
                    Time Tracked
                  </div>
                  <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                    {formatTime(getElapsedTime ? getElapsedTime(task.id) : task.timeTracking.totalTimeSpent)}
                  </p>
                </div>

                {/* Subtasks Count */}
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <CheckCircle size={16} className="text-green-500" />
                    Subtasks
                  </div>
                  <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                    {task.childIds.length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
