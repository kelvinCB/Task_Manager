import { Task, TaskNode } from '../types/Task';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const buildTaskTree = (tasks: Task[]): TaskNode[] => {
  const taskMap = new Map<string, TaskNode>();
  const rootTasks: TaskNode[] = [];

  // Create TaskNode objects
  tasks.forEach(task => {
    taskMap.set(task.id, {
      ...task,
      children: [],
      parent: undefined
    });
  });

  // Build relationships
  tasks.forEach(task => {
    const taskNode = taskMap.get(task.id)!;
    
    if (task.parentId) {
      const parent = taskMap.get(task.parentId);
      if (parent) {
        parent.children.push(taskNode);
        taskNode.parent = parent;
      }
    } else {
      rootTasks.push(taskNode);
    }
  });

  return rootTasks;
};

export const canCompleteTask = (task: Task, allTasks: Task[]): boolean => {
  // If it has no children, it can be completed
  if (task.childIds.length === 0) return true;
  
  // If it has children, all must be completed
  return task.childIds.every(childId => {
    const childTask = allTasks.find(t => t.id === childId);
    return childTask?.status === 'Done';
  });
};

export const getTaskDepth = (task: Task, allTasks: Task[]): number => {
  if (!task.parentId) return 0;
  
  const parent = allTasks.find(t => t.id === task.parentId);
  if (!parent) return 0;
  
  return getTaskDepth(parent, allTasks) + 1;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate) return false;
  return new Date() > task.dueDate && task.status !== 'Done';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Open': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'In Progress': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'Done': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'Open': return 'Circle';
    case 'In Progress': return 'Clock';
    case 'Done': return 'CheckCircle';
    default: return 'Circle';
  }
};