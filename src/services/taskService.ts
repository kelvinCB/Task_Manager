import supabase, { supabaseUrl } from '../lib/supabaseClient';
import { Task, TaskStatus, TaskComment } from '../types/Task';
import { API_BASE_URL } from '../utils/apiConfig';

export interface UploadResult {
  message: string;
  file: {
    name: string;
    path: string;
    fullPath: string;
    url: string;
    size: number;
    mimetype: string;
  };
}

/**
 * API Response interface
 */
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  retryAfterSeconds?: number;
}

/**
 * Backend Task interface (matches backend structure)
 * Note: Types reflect the API, not the DB exactly.
 */
interface BackendTask {
  id: number; // Supabase returns numeric id (int8)
  user_id: string;
  title: string;
  description: string;
  // Backend status enum now matches frontend: 'Open' | 'In Progress' | 'Review' | 'Done'
  status: 'Open' | 'In Progress' | 'Review' | 'Done';
  parent_id: number | null;
  created_at: string;
  updated_at?: string;
  due_date: string | null; // ISO date string (YYYY-MM-DD)
  total_time_ms?: number; // Summary total (persisted only when Done)
  active_start_time?: string | null; // ISO string if a timer is currently running
  estimation?: number | null;
  responsible?: string | null;
}

interface BackendComment {
  id: string;
  task_id: number;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
  updated_at?: string | null;
}

// No mapping needed; backend and frontend share the same status values

/**
 * Service for managing tasks through the backend API
 */
export class TaskService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get the current user's JWT token
   *
   * Note: In some browser runtimes (e.g. headless Chromium on a VPS),
   * we've observed that the UI can appear logged-in, yet `supabase.auth.getSession()`
   * returns null at the moment a request is made. In that case, we fall back to
   * reading Supabase's persisted auth token from localStorage.
   */
  private async getAuthToken(): Promise<string | null> {
    // Primary: ask Supabase client
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;
      if (token) return token;
    } catch {
      // ignore and fall back
    }

    // Fallback: read from localStorage (browser only)
    // Prefer the project-specific key: `sb-<projectRef>-auth-token`
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const projectRef = supabaseUrl?.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1];
        const preferredKey = projectRef ? `sb-${projectRef}-auth-token` : null;

        const authKey = (preferredKey && localStorage.getItem(preferredKey))
          ? preferredKey
          : Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));

        if (!authKey) return null;

        const raw = localStorage.getItem(authKey);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        return parsed?.access_token || null;
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        return { error: 'Not authenticated. Please log in.' };
      }

      // Normalize headers: spreading a `Headers` instance produces `{}` and can silently drop values.
      const headers = new Headers(options.headers);
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      headers.set('Authorization', `Bearer ${token}`);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = (await response.json().catch(() => ({}))) as unknown as T & { error?: string; message?: string };

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfterRaw = (data as any)?.retry_after_seconds || response.headers.get('Retry-After');
          const retryAfter = retryAfterRaw ? Number(retryAfterRaw) : undefined;
          const waitText = retryAfter ? ` Please wait ${retryAfter}s before posting another comment.` : ' Please wait before posting another comment.';
          return {
            error: (data as any)?.error || `Too many requests.${waitText}`,
            retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
          };
        }

        return {
          error: data && (data as any).error || (data as any).message || `Request failed with status ${response.status}`,
        };
      }

      return { data } as ApiResponse<T>;
    } catch (error) {
      console.error('API request error:', error);
      return {
        error: error instanceof Error
          ? error.message
          : 'Failed to connect to server. Please check your connection.',
      };
    }
  }

  /**
   * Convert backend task to frontend Task format
   */
  private convertBackendToFrontend(backendTask: BackendTask): Task {
    return {
      id: String(backendTask.id),
      title: backendTask.title,
      description: backendTask.description || '',
      status: backendTask.status,
      createdAt: new Date(backendTask.created_at),
      dueDate: backendTask.due_date ? new Date(backendTask.due_date) : undefined,
      parentId: backendTask.parent_id !== null ? String(backendTask.parent_id) : undefined,
      childIds: [], // Will be computed on frontend
      depth: 0, // Will be computed on frontend
      // Backend does not store time tracking; default locally
      timeTracking: {
        // If backend provided a summary, prefer it (especially for Done)
        totalTimeSpent: backendTask.total_time_ms ?? 0,
        isActive: !!backendTask.active_start_time,
        lastStarted: backendTask.active_start_time ? new Date(backendTask.active_start_time).getTime() : undefined,
        timeEntries: [],
      },
      estimation: backendTask.estimation || undefined,
      responsible: backendTask.responsible || undefined,
    };
  }

  /**
   * Convert frontend Task to backend format for creation/update
   */
  private convertFrontendToBackend(task: Partial<Task>): Partial<BackendTask> {
    const backendTask: any = {};

    if (task.title !== undefined) backendTask.title = task.title;
    if (task.description !== undefined) backendTask.description = task.description;
    if (task.status !== undefined) backendTask.status = task.status;
    if (task.parentId !== undefined) {
      if (task.parentId) {
        const pid = Number(task.parentId);
        if (isNaN(pid)) {
          // If parentId is a non-numeric string (e.g. valid UUID or temp ID), 
          // and backend expects number, we must not send 'null' (which makes it root).
          // Throwing ensures we fall back to localStorage/offline logic logic in useTasks.
          throw new Error('Invalid parent ID: cannot convert non-numeric ID to number for backend.');
        }
        backendTask.parent_id = pid;
      } else {
        backendTask.parent_id = null;
      }
    }
    if (task.dueDate !== undefined) {
      backendTask.due_date = task.dueDate ? task.dueDate.toISOString().split('T')[0] : null;
    }
    if (task.estimation !== undefined) backendTask.estimation = task.estimation;
    if (task.responsible !== undefined) backendTask.responsible = task.responsible;

    // pass-through for backend-specific fields (e.g., total_time_ms)
    if ((task as any).total_time_ms !== undefined) {
      backendTask.total_time_ms = (task as any).total_time_ms;
    } else if (task.timeTracking?.totalTimeSpent !== undefined) {
      // Map frontend totalTimeSpent to backend total_time_ms
      backendTask.total_time_ms = task.timeTracking.totalTimeSpent;
    }

    return backendTask;
  }

  /**
   * Get all tasks for the authenticated user
   */
  async getTasks(status?: TaskStatus): Promise<ApiResponse<Task[]>> {
    const endpoint = status
      ? `/api/tasks?status=${encodeURIComponent(status)}`
      : '/api/tasks';

    const response = await this.makeRequest<{ tasks: BackendTask[] }>(endpoint);

    if (response.error) {
      return { error: response.error };
    }

    if (response.data?.tasks) {
      const tasks = response.data.tasks.map((bt) => this.convertBackendToFrontend(bt));
      return { data: tasks };
    }

    return { error: 'Invalid response from server' };
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    const response = await this.makeRequest<{ task: BackendTask }>(`/api/tasks/${id}`);

    if (response.error) {
      return { error: response.error };
    }

    if (response.data?.task) {
      const task = this.convertBackendToFrontend(response.data.task);
      return { data: task };
    }

    return { error: 'Task not found' };
  }

  /**
   * Create a new task
   */
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'childIds' | 'depth'>): Promise<ApiResponse<Task>> {
    const backendTask = this.convertFrontendToBackend(task);

    const response = await this.makeRequest<{ task: BackendTask }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(backendTask),
    });

    if (response.error) {
      return { error: response.error };
    }

    if (response.data?.task) {
      const newTask = this.convertBackendToFrontend(response.data.task);
      return { data: newTask };
    }

    return { error: 'Failed to create task' };
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    const backendUpdates = this.convertFrontendToBackend(updates);

    // If there are no backend-mappable fields (e.g., only timeTracking was provided),
    // skip the API call to avoid a 400 "No fields to update" from the backend.
    if (!backendUpdates || Object.keys(backendUpdates).length === 0) {
      return { message: 'No-op: nothing to sync to backend' };
    }

    const response = await this.makeRequest<{ task: BackendTask }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendUpdates),
    });

    if (response.error) {
      return { error: response.error };
    }

    if (response.data?.task) {
      const updatedTask = this.convertBackendToFrontend(response.data.task);
      return { data: updatedTask };
    }

    return { error: 'Failed to update task' };
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.makeRequest<{ message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });

    return response;
  }

  /**
   * Upload a file
   */
  async uploadFile(file: File): Promise<ApiResponse<UploadResult>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = await this.getAuthToken();
    console.log('[TaskService] Uploading file...', { fileName: file.name, fileSize: file.size, hasToken: !!token, baseUrl: this.baseUrl });

    if (!token) {
      console.error('[TaskService] No auth token found!');
      return { error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Content-Type header must NOT be set manually for FormData, browser sets it with boundary
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || data.message || 'Upload failed' };
      }

      return { data: data };
    } catch (error) {
      console.error('Upload request error:', error);
      return {
        error: error instanceof Error
          ? error.message
          : 'Failed to upload file',
      };
    }
  }

  // --- Time entries API ---
  async startTimeEntry(taskId: string, startedAt?: number): Promise<ApiResponse<{ id: number }>> {
    const response = await this.makeRequest<{ entry: { id: number } }>(`/api/time-entries/start`, {
      method: 'POST',
      body: JSON.stringify({ task_id: Number(taskId), start_time: startedAt ? new Date(startedAt).toISOString() : undefined })
    });
    if (response.error) return { error: response.error };
    return { data: { id: (response.data as any).entry.id } } as any;
  }

  async stopTimeEntry(entryId?: number, taskId?: string, endedAt?: number): Promise<ApiResponse<{ id: number }>> {
    const response = await this.makeRequest<{ entry: { id: number } }>(`/api/time-entries/stop`, {
      method: 'POST',
      body: JSON.stringify({ entry_id: entryId, task_id: taskId ? Number(taskId) : undefined, end_time: endedAt ? new Date(endedAt).toISOString() : undefined })
    });
    if (response.error) return { error: response.error };
    return { data: { id: (response.data as any).entry.id } } as any;
  }

  async getTimeSummary(start: Date, end: Date): Promise<ApiResponse<{ id: string; title: string; status: TaskStatus; timeSpent: number; }[]>> {
    const qs = new URLSearchParams({ start: start.toISOString(), end: end.toISOString() });
    const response = await this.makeRequest<{ stats: { id: string; title: string; status: TaskStatus; timeSpent: number; }[] }>(`/api/time-entries/summary?${qs.toString()}`);
    if (response.error) return { error: response.error };
    return { data: (response.data as any).stats } as any;
  }

  async recordTimeSummary(taskId: string, durationMs: number): Promise<ApiResponse<{ id: number }>> {
    const response = await this.makeRequest<{ entry: { id: number } }>(`/api/time-entries/complete`, {
      method: 'POST',
      body: JSON.stringify({ task_id: Number(taskId), duration_ms: durationMs })
    });
    if (response.error) return { error: response.error };
    return { data: { id: (response.data as any).entry.id } } as any;
  }

  /**
   * Convert backend comment to frontend TaskComment format
   */
  private convertBackendCommentToFrontend(bc: BackendComment): TaskComment {
    return {
      id: bc.id,
      taskId: String(bc.task_id),
      userId: bc.user_id,
      authorName: bc.author_name,
      authorAvatar: bc.author_avatar || undefined,
      content: bc.content,
      createdAt: new Date(bc.created_at),
      updatedAt: bc.updated_at ? new Date(bc.updated_at) : undefined,
    };
  }

  /**
   * Get all comments for a specific task
   */
  async getComments(taskId: string, limit = 50, offset = 0): Promise<ApiResponse<TaskComment[]>> {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await this.makeRequest<{ comments: BackendComment[] }>(`/api/tasks/${taskId}/comments?${qs.toString()}`);

    if (response.error) {
      return { error: response.error };
    }

    if (response.data?.comments) {
      const comments = response.data.comments.map((bc) => this.convertBackendCommentToFrontend(bc));
      return { data: comments };
    }

    return { error: 'Invalid response from server' };
  }

  /**
   * Add a new comment to a task
   */
  async addComment(taskId: string, content: string): Promise<ApiResponse<TaskComment>> {
    const response = await this.makeRequest<{ comment: BackendComment }>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (response.error) {
      return { error: response.error };
    }

    if (response.data?.comment) {
      const newComment = this.convertBackendCommentToFrontend(response.data.comment);
      return { data: newComment };
    }

    return { error: 'Failed to add comment' };
  }

  async updateComment(taskId: string, commentId: string, content: string): Promise<ApiResponse<TaskComment>> {
    const response = await this.makeRequest<{ comment: BackendComment }>(`/api/tasks/${taskId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });

    if (response.error) return { error: response.error };
    if (response.data?.comment) {
      return { data: this.convertBackendCommentToFrontend(response.data.comment) };
    }

    return { error: 'Failed to update comment' };
  }

  async deleteComment(taskId: string, commentId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.makeRequest<{ message: string }>(`/api/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });

    return response;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }
}

// Create a singleton instance
export const taskService = new TaskService();
