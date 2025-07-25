export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  dueDate?: Date;
  parentId?: string;
  childIds: string[];
  depth: number;
  
  // Time tracking properties
  timeTracking: {
    totalTimeSpent: number; // Total time spent in milliseconds
    isActive: boolean;     // Whether the timer is currently running
    lastStarted?: number;  // Timestamp when the timer was last started
    timeEntries: TimeEntry[];
  };
}

export interface TimeEntry {
  startTime: number;     // Timestamp when tracking started
  endTime?: number;      // Timestamp when tracking ended (undefined if still active)
  duration?: number;     // Duration in milliseconds (calculated when ended)
}

export type TaskStatus = 'Open' | 'In Progress' | 'Done';

export interface TaskNode extends Task {
  children: TaskNode[];
  parent?: TaskNode;
}

export interface TaskFilter {
  status?: TaskStatus;
  searchTerm?: string;
}

export interface ImportedTaskRow {
  id?: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  dueDate?: string;
  parentId?: string;
  childIds?: string;
  // Time tracking fields
  totalTimeSpent?: string;
  timeEntries?: string;
}

export interface TaskTimeStats {
  id: string;
  title: string;
  timeSpent: number;  // time in milliseconds
  status: TaskStatus;
  startDate: number;  // timestamp
  endDate: number;    // timestamp
}