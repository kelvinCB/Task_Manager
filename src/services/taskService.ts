import supabase from '../lib/supabaseClient';
import { Task, TaskStatus } from '../types/Task';

/**
 * API Response interface
 */
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
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
  // Backend status enum now matches frontend: 'Open' | 'In Progress' | 'Done'
  status: 'Open' | 'In Progress' | 'Done';
  parent_id: number | null;
  created_at: string;
  updated_at?: string;
  due_date: string | null; // ISO date string (YYYY-MM-DD)
}

// No mapping needed; backend and frontend share the same status values

/**
 * Service for managing tasks through the backend API
 */
export class TaskService {
  private baseUrl: string;

  constructor() {
    // Use backend API URL from environment or default to localhost
    const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
    this.baseUrl = env.VITE_BACKEND_URL || env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  /**
   * Get the current user's JWT token
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
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

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      const data = (await response.json().catch(() => ({}))) as unknown as T & { error?: string; message?: string };

      if (!response.ok) {
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
        totalTimeSpent: 0,
        isActive: false,
        timeEntries: [],
      },
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
    if (task.parentId !== undefined) backendTask.parent_id = task.parentId ? Number(task.parentId) : null;
    if (task.dueDate !== undefined) {
      backendTask.due_date = task.dueDate ? task.dueDate.toISOString().split('T')[0] : null;
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
