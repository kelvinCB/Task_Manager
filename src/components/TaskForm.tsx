import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Task, TaskStatus } from '../types/Task';
import { X, Calendar, FileText, Tag, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { AIIcon } from './AIIcon';
import { openaiService } from '../services/openaiService';
import { playNotificationSound } from '../utils/audioUtils';
import { FileUploader } from './FileUploader';
import { UploadResult } from '../services/taskService';
import { extractAttachments, formatDescriptionWithAttachments, Attachment } from '../utils/attachmentUtils';
import { AttachmentList } from './AttachmentList';
import { AuthRequiredModal } from './features/account/AuthRequiredModal';

interface TaskFormProps {
  task?: Task;
  parentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'childIds' | 'depth'>) => void;
  canComplete?: boolean;
  showError?: (message: string) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  parentId,
  isOpen,
  onClose,
  onSubmit,
  canComplete,
  showError
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Open' as TaskStatus,
    attachments: [] as Attachment[],
    dueDate: '',
    parentId: parentId || ''
  });
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [aiProcessingState, setAiProcessingState] = useState<'idle' | 'generating' | 'improving'>('idle');
  const [thinkingProcess, setThinkingProcess] = useState('');
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setValidationError('');
    setShowAIOptions(false);
    if (task) {
      const { text, attachments } = extractAttachments(task.description);
      setFormData({
        title: task.title,
        description: text,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        parentId: task.parentId || '',
        attachments: attachments
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'Open',
        dueDate: '',
        parentId: parentId || '',
        attachments: []
      });
    }
  }, [task, parentId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setValidationError(t('tasks.validation_title'));
      return;
    }

    setValidationError('');

    const finalDescription = formatDescriptionWithAttachments(formData.description, formData.attachments);

    onSubmit({
      title: formData.title.trim(),
      description: finalDescription,
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
      <div
        role="dialog"
        aria-modal="true"
        data-testid="task-form-modal"
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md md:max-w-4xl max-h-[90vh] flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className={`relative flex items-center justify-center p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Tag size={20} />
            </div>
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
              {task ? t('tasks.edit_task') : t('tasks.new_task')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`absolute right-6 p-2 rounded-full transition-all duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`flex flex-col overflow-hidden ${theme === 'dark' ? 'text-gray-200' : ''}`}>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="task-title" className={`flex items-center gap-2 text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FileText size={16} className="text-indigo-500" />
                  {t('tasks.title')}
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    if (validationError) setValidationError('');
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-lg font-medium ${validationError ? 'border-red-500 bg-red-50/10' : theme === 'dark' ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700' : 'border-gray-300 bg-gray-50/50 hover:bg-white focus:bg-white'}`}
                  placeholder={t('tasks.placeholder_title')}
                  required
                />
                {validationError && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {validationError}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="task-description" className={`flex items-center gap-2 text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FileText size={16} className="text-indigo-500" />
                  {t('tasks.description')}
                </label>
                <div className="relative group">
                  <textarea
                    id="task-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-h-[320px] resize-none ${theme === 'dark' ? 'border-gray-600 bg-gray-700/50 text-gray-100 hover:bg-gray-700' : 'border-gray-300 bg-gray-50/50 hover:bg-white focus:bg-white'}`}
                    placeholder={t('tasks.placeholder_desc')}
                  ></textarea>

                  {/* AI Icon - Better positioning and style */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        setIsAuthModalOpen(true);
                        return;
                      }
                      setAiError(null);
                      if (formData.title.trim()) {
                        setShowAIOptions(!showAIOptions);
                      } else {
                        setValidationError(t('tasks.validation_ai_title'));
                        document.getElementById('task-title')?.focus();
                      }
                    }}
                    className={`absolute bottom-4 right-4 p-2 rounded-xl transition-all duration-300 shadow-lg hover:scale-110 active:scale-95 z-20 cursor-pointer ${theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    title="AI Assistant"
                  >
                    <AIIcon size={20} animated={true} />
                  </button>
                </div>

                {/* AI Options UI - More integrated look */}
                {showAIOptions && (
                  <div className={`mt-4 p-5 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 duration-300 relative z-30 ${theme === 'dark' ? 'bg-gray-700/50 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-indigo-900/50' : 'bg-white shadow-sm'}`}>
                        <AIIcon size={18} animated={true} />
                      </div>
                      <h3 className={`text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>
                        {t('ai.powered')}
                      </h3>
                      <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-200'}`}></div>
                    </div>

                    {aiError && (
                      <div
                        data-testid="ai-error-container"
                        className={`mb-4 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}
                      >
                        <AlertCircle size={16} />
                        <span className="text-sm font-semibold flex-1">{aiError}</span>
                        <button
                          type="button"
                          onClick={() => setAiError(null)}
                          aria-label="Close error"
                          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* Thinking Process Accordion */}
                    {(aiProcessingState === 'generating' || aiProcessingState === 'improving') && (
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                          className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}
                        >
                          {isThinkingExpanded ? '▼' : '▶'} {t('ai.thinking')}
                        </button>
                        {isThinkingExpanded && (
                          <div className={`p-3 rounded-lg text-sm font-mono max-h-40 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800/50 text-gray-300 border border-gray-600' : 'bg-white text-gray-600 border border-gray-200'}`}>
                            {thinkingProcess ? thinkingProcess : (
                              <span>
                                {t('ai.thinking_status')}
                                <span className="dot-1">.</span>
                                <span className="dot-2">.</span>
                                <span className="dot-3">.</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!isAuthenticated) {
                            setIsAuthModalOpen(true);
                            return;
                          }
                          setAiProcessingState('generating');
                          setThinkingProcess('');
                          setAiError(null);
                          setIsThinkingExpanded(true);

                          let fullResponse = '';

                          try {
                            // Reset description if we are generating a new one? 
                            // Or append? Usually "Generate" implies replacing or filling empty.
                            // Let's clear it if the user explicitely asked to generate.
                            // But usually we might want to keep what they wrote. 
                            // The current flow replaces it at the end. For streaming, we should probably clear strictly if we stream directly into it.
                            // However, let's keep it safe: We will populate formData.description as we receive the "final" part.

                            // Strategy: parsing on the fly

                            const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-nano-2025-08-07';

                            // We need to clear description to show the stream effect clearly
                            setFormData(prev => ({ ...prev, description: '' }));

                            let hasFoundStartTag = false;

                            await openaiService.generateTaskDescription(formData.title, model, (token) => {
                              fullResponse += token;

                              const thinkingStartIdx = fullResponse.indexOf('<thinking>');
                              const thinkingEndIdx = fullResponse.indexOf('</thinking>');

                              if (thinkingStartIdx !== -1) {
                                hasFoundStartTag = true;
                                const contentStart = thinkingStartIdx + '<thinking>'.length;
                                if (thinkingEndIdx !== -1) {
                                  setThinkingProcess(fullResponse.substring(contentStart, thinkingEndIdx));
                                  const descriptionPart = fullResponse.substring(thinkingEndIdx + '</thinking>'.length);
                                  setFormData(prev => ({ ...prev, description: descriptionPart.trimStart() }));
                                } else {
                                  setThinkingProcess(fullResponse.substring(contentStart));
                                }
                              } else {
                                // If no start tag found yet, show raw response in thinking area to see what's happening
                                if (!hasFoundStartTag) {
                                  setThinkingProcess(fullResponse);
                                }

                                if (fullResponse.length > 50 && !fullResponse.includes('<thinking>')) {
                                  setFormData(prev => ({ ...prev, description: fullResponse }));
                                }
                              }
                            });

                            // Final cleanup/formatting after stream ends
                            // (Handled by the fact that promise resolves with full string, but we rely on callback)
                            setShowAIOptions(false);
                            playNotificationSound(1000, 0.5, 0.3); // AI generation completion sound
                          } catch (error) {
                            console.error('Error generating AI description:', error);
                            setAiError(error instanceof Error ? error.message : t('common.error'));
                          } finally {
                            setAiProcessingState('idle');
                          }
                        }}
                        disabled={aiProcessingState !== 'idle'}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        {aiProcessingState === 'generating' ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{t('ai.generating')}</>
                        ) : (
                          <><AIIcon size={14} />{t('ai.generate')}</>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!isAuthenticated) {
                            setIsAuthModalOpen(true);
                            return;
                          }
                          if (!formData.description.trim()) {
                            setAiError(t('tasks.validation_ai_desc'));
                            return;
                          }
                          setAiProcessingState('improving');
                          setThinkingProcess('');
                          setAiError(null);
                          setIsThinkingExpanded(true);

                          let fullResponse = '';

                          try {
                            const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-nano-2025-08-07';
                            const originalDescription = formData.description;

                            // For improving, we might want to clear or keep? 
                            // The user wants "in real time", so let's clear it if they click improve.
                            setFormData(prev => ({ ...prev, description: '' }));

                            let hasFoundStartTag = false;

                            await openaiService.improveGrammar(originalDescription, model, (token) => {
                              fullResponse += token;

                              const thinkingStartIdx = fullResponse.indexOf('<thinking>');
                              const thinkingEndIdx = fullResponse.indexOf('</thinking>');

                              if (thinkingStartIdx !== -1) {
                                hasFoundStartTag = true;
                                const contentStart = thinkingStartIdx + '<thinking>'.length;
                                if (thinkingEndIdx !== -1) {
                                  setThinkingProcess(fullResponse.substring(contentStart, thinkingEndIdx));
                                  const descriptionPart = fullResponse.substring(thinkingEndIdx + '</thinking>'.length);
                                  setFormData(prev => ({ ...prev, description: descriptionPart.trimStart() }));
                                } else {
                                  setThinkingProcess(fullResponse.substring(contentStart));
                                }
                              } else {
                                if (!hasFoundStartTag) {
                                  setThinkingProcess(fullResponse);
                                }

                                if (fullResponse.length > 30 && !fullResponse.includes('<thinking>')) {
                                  setFormData(prev => ({ ...prev, description: fullResponse }));
                                }
                              }
                            });
                            setShowAIOptions(false);
                            playNotificationSound(1000, 0.5, 0.3); // AI improvement completion sound
                          } catch (error) {
                            console.error('Error improving grammar:', error);
                            setAiError(error instanceof Error ? error.message : 'Unknown error');
                          } finally {
                            setAiProcessingState('idle');
                          }
                        }}
                        disabled={aiProcessingState !== 'idle'}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        {aiProcessingState === 'improving' ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{t('ai.improving')}</>
                        ) : (
                          <><AIIcon size={14} />{t('ai.improve')}</>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAIOptions(false)}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
                      >
                        {t('ai.dismiss')}
                      </button>
                    </div>
                  </div>
                )}
              </div>



              {/* Attachments */}
              <div className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Tag size={16} className="text-indigo-500" />
                  {t('tasks.attachments')}
                </label>
                <FileUploader
                  onUploadComplete={(result: UploadResult) => {
                    const newAttachment: Attachment = {
                      name: result.file.name,
                      url: result.file.url,
                      type: result.file.mimetype.startsWith('image/') ? 'image' : result.file.mimetype.startsWith('video/') ? 'video' : 'file'
                    };
                    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, newAttachment] }));
                  }}
                  onError={(msg) => setValidationError(msg)}
                />
                <div className="mt-4">
                  <AttachmentList
                    attachments={formData.attachments}
                    onDelete={(index) => {
                      setFormData(prev => ({
                        ...prev,
                        attachments: prev.attachments.filter((_, i) => i !== index)
                      }));
                    }}
                  />
                </div>
              </div>

              {/* Status and Due Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Section */}
                <div className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-gray-700/20 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <label htmlFor="task-status" className={`flex items-center gap-2 text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Tag size={16} className="text-indigo-500" />
                    {t('tasks.status')}
                  </label>
                  <select
                    id="task-status"
                    value={formData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as TaskStatus;
                      if (newStatus === 'Done' && canComplete === false) {
                        if (showError) {
                          showError(t('tasks.cannot_complete_subtasks'));
                        }
                        return;
                      }
                      setFormData(prev => ({ ...prev, status: newStatus }));
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                  >
                    <option value="Open">{t('tasks.status_open')}</option>
                    <option value="In Progress">{t('tasks.status_in_progress')}</option>
                    <option value="Done" disabled={canComplete === false} title={canComplete === false ? t('tasks.has_subtasks') : undefined}>
                      {t('tasks.status_done')}
                    </option>
                  </select>
                </div>

                {/* Due Date Section */}
                <div className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-gray-700/20 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <label htmlFor="task-due-date" className={`flex items-center gap-2 text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Calendar size={16} className="text-indigo-500" />
                    {t('tasks.due_date')}
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={formData.dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                  />
                </div>
              </div>

              {/* Info / Subtask Panel */}
              {parentId && (
                <div className={`p-5 rounded-xl border animate-pulse-slow ${theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg mt-0.5 ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600'}`}>
                      <Tag size={14} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>
                        {t('tasks.subtask_mode')}
                      </p>
                      <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-indigo-300/80' : 'text-indigo-700/80'}`}>
                        {t('tasks.subtask_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={`p-6 flex justify-end gap-3 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
            <button
              type="button"
              onClick={onClose}
              data-testid="task-form-cancel-button"
              className={`px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${theme === 'dark' ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white' : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 shadow-sm'}`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              data-testid="task-form-submit-button"
              className={`px-8 py-2.5 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:translate-y-0.5 active:shadow-none ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {task ? t('tasks.update_task') : t('tasks.create_task')}
            </button>
          </div>
        </form>

      </div>

      {/* Auth Required Modal for AI - Moved outside form for better stacking */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionType="ai"
      />
    </div>
  );
};