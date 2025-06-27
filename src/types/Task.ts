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
}