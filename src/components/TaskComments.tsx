import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskComment } from '../types/Task';
import { taskService } from '../services/taskService';
import { useTheme } from '../contexts/ThemeContext';
import { MessageSquare, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../utils/taskUtils';
import supabase from '../lib/supabaseClient';

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
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const requestSeqRef = useRef(0);
  const MAX_COMMENT_LENGTH = 2000;

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

    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });

    return () => {
      requestSeqRef.current += 1;
    };
  }, [taskId]);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }

    const tick = () => {
      const remainingMs = cooldownUntil - Date.now();
      if (remainingMs <= 0) {
        setCooldownUntil(null);
        setCooldownSeconds(0);
        return;
      }
      setCooldownSeconds(Math.ceil(remainingMs / 1000));
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await taskService.addComment(taskId, trimmed);
      if (response.error) {
        const retryMatch = response.error.match(/wait\s+(\d+)s/i);
        if (retryMatch) {
          const seconds = Math.max(1, Number(retryMatch[1]));
          setCooldownUntil(Date.now() + seconds * 1000);
        }
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

  const beginEdit = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const trimmed = editingContent.trim();
    if (!trimmed) return;

    const response = await taskService.updateComment(taskId, editingId, trimmed);
    if (response.error) {
      toast.error(response.error);
      return;
    }

    if (response.data) {
      setComments((prev) => prev.map((c) => (c.id === editingId ? response.data! : c)));
      cancelEdit();
    }
  };

  const removeComment = async (commentId: string) => {
    if (!window.confirm(t('tasks.confirm_delete_comment', 'Delete this comment?'))) return;

    const response = await taskService.deleteComment(taskId, commentId);
    if (response.error) {
      toast.error(response.error);
      return;
    }

    setComments((prev) => prev.filter((c) => c.id !== commentId));
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
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">
                    {formatDate(comment.updatedAt || comment.createdAt)}
                  </span>
                  {comment.userId === currentUserId && (
                    <div className="flex gap-2 justify-end mt-1">
                      <button type="button" className="text-[10px] text-indigo-500" onClick={() => beginEdit(comment)}>
                        {t('common.edit', 'Edit')}
                      </button>
                      <button type="button" className="text-[10px] text-red-500" onClick={() => removeComment(comment.id)}>
                        {t('common.delete', 'Delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={2}
                    maxLength={MAX_COMMENT_LENGTH}
                    className={`w-full p-2 text-sm rounded border ${
                      theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" className="text-xs text-gray-500" onClick={cancelEdit}>{t('common.cancel', 'Cancel')}</button>
                    <button type="button" className="text-xs text-indigo-500" onClick={saveEdit}>{t('common.save', 'Save')}</button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm whitespace-pre-wrap ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {comment.content}
                </p>
              )}
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
          maxLength={MAX_COMMENT_LENGTH}
          data-testid="comment-input"
          className={`w-full p-3 pr-12 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
            theme === 'dark'
              ? 'bg-gray-900 border-gray-700 text-gray-100'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        />
        <button
          type="submit"
          aria-label={t('tasks.send_comment', 'Send comment')}
          data-testid="add-comment-button"
          disabled={!newComment.trim() || isSubmitting || cooldownSeconds > 0}
          className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
            !newComment.trim() || isSubmitting || cooldownSeconds > 0
              ? 'text-gray-400'
              : 'text-indigo-500 hover:bg-indigo-50'
          }`}
        >
          <Send size={18} />
        </button>
        <div className={`mt-1 text-[11px] text-right ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          {newComment.length}/{MAX_COMMENT_LENGTH}
        </div>
        {cooldownSeconds > 0 && (
          <div className={`text-[11px] mt-1 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
            {t('tasks.comment_cooldown_wait', 'Please wait {{seconds}}s before posting another comment.', { seconds: cooldownSeconds })}
          </div>
        )}
      </form>
    </div>
  );
};
