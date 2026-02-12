import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskComment } from '../types/Task';
import { taskService } from '../services/taskService';
import { useTheme } from '../contexts/ThemeContext';
import { MessageSquare, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../utils/taskUtils';

interface TaskCommentsProps {
  taskId: string;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestSeqRef = useRef(0);

  const fetchComments = async () => {
    const requestId = ++requestSeqRef.current;

    setIsLoading(true);
    setComments([]);
    try {
      const response = await taskService.getComments(taskId);
      if (requestId !== requestSeqRef.current) return;

      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.data) {
        setComments(response.data);
      }
    } catch (error) {
      if (requestId !== requestSeqRef.current) return;
      console.error('Error fetching comments:', error);
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      if (requestId === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchComments();

    return () => {
      requestSeqRef.current += 1;
    };
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await taskService.addComment(taskId, newComment);
      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.data) {
        setComments((prev) => [...prev, response.data!]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare size={18} className="text-indigo-500" />
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {t('tasks.comments', 'Comments')}
        </h3>
      </div>

      {/* Comment List */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <p className="text-sm text-gray-500 italic">{t('common.loading')}</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">{t('tasks.no_comments', 'No comments yet.')}</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-full ${
                    theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    {comment.authorAvatar ? (
                      <img src={comment.authorAvatar} alt={comment.authorName} className="w-5 h-5 rounded-full" />
                    ) : (
                      <User size={12} className="text-gray-500" />
                    )}
                  </div>
                  <span className={`text-xs font-bold ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {comment.authorName}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className={`text-sm whitespace-pre-wrap ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="relative" data-testid="add-comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('tasks.add_comment_placeholder', 'Add a comment...')}
          rows={2}
          data-testid="comment-input"
          className={`w-full p-3 pr-12 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
            theme === 'dark'
              ? 'bg-gray-900 border-gray-700 text-gray-100'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        />
        <button
          type="submit"
          data-testid="add-comment-button"
          disabled={!newComment.trim() || isSubmitting}
          className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
            !newComment.trim() || isSubmitting
              ? 'text-gray-400'
              : 'text-indigo-500 hover:bg-indigo-50'
          }`}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
