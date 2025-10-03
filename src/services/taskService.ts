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
 */
interface BackendTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  time_tracking: {
    totalTimeSpent: number;
    isActive: boolean;
    lastStarted?: number;
    timeEntries: Array<{
      startTime: number;
      endTime?: number;
      duration?: number;
    }>;
  };
}

/**
 * Service for managing tasks through the backend API
 */
export class TaskService {
  private baseUrl: string;

  constructor() {
    // Use backend API URL from environment or default to localhost
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
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

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.message || `Request failed with status ${response.status}`,
        };
      }

      return { data };
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
      id: backendTask.id,
      title: backendTask.title,
      description: backendTask.description,
      status: backendTask.status,
      createdAt: new Date(backendTask.created_at),
      dueDate: backendTask.due_date ? new Date(backendTask.due_date) : undefined,
      parentId: backendTask.parent_task_id || undefined,
      childIds: [], // Will be computed on frontend
      depth: 0, // Will be computed on frontend
      timeTracking: backendTask.time_tracking || {
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
    if (task.parentId !== undefined) backendTask.parent_task_id = task.parentId || null;
    if (task.dueDate !== undefined) {
      backendTask.due_date = task.dueDate ? task.dueDate.toISOString() : null;
    }
    if (task.timeTracking !== undefined) {
      backendTask.time_tracking = task.timeTracking;
    }

    return backendTask;
  }

  /**
   * Get all tasks for the authenticated user
   */
  async getTasks(status?: TaskStatus): Promise<ApiResponse<Task[]>> {
    const endpoint = status ? `/api/tasks?status=${status}` : '/api/tasks';
    const response = await this.makeRequest<{ tasks: BackendTask[] }>(endpoint);

    if (response.error) {
      return { error: response.error };
    }

    if (response.data?.tasks) {
      const tasks = response.data.tasks.map(bt => this.convertBackendToFrontend(bt));
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
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }
}

// Create a singleton instance
export const taskService = new TaskService();
