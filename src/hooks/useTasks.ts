import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, TaskStatus, TaskFilter } from '../types/Task';
import { generateId, buildTaskTree, canCompleteTask } from '../utils/taskUtils';

// Initial tasks for new users
const defaultTasks: Task[] = [
  {
    id: '1',
    title: 'Frontend Development',
    description: 'Complete the user interface components',
    status: 'In Progress',
    createdAt: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    parentId: undefined,
    childIds: ['2', '3'],
    depth: 0
  },
  {
    id: '2',
    title: 'Design System',
    description: 'Create reusable UI components',
    status: 'Done',
    createdAt: new Date('2024-01-16'),
    parentId: '1',
    childIds: ['4'],
    depth: 1
  },
  {
    id: '3',
    title: 'API Integration',
    description: 'Connect frontend with backend services',
    status: 'Open',
    createdAt: new Date('2024-01-17'),
    parentId: '1',
    childIds: [],
    depth: 1
  },
  {
    id: '4',
    title: 'Button Components',
    description: 'Create various button styles and states',
    status: 'Done',
    createdAt: new Date('2024-01-18'),
    parentId: '2',
    childIds: [],
    depth: 2
  }
];

// Key for localStorage
const TASKS_STORAGE_KEY = 'taskflow_tasks';
const EXPANDED_NODES_STORAGE_KEY = 'taskflow_expanded_nodes';

// Function to parse dates from localStorage
const parseTasksFromStorage = (storedTasks: string): Task[] => {
  try {
    const parsedTasks = JSON.parse(storedTasks);
    return parsedTasks.map((task: Task) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined
    }));
  } catch (error) {
    console.error('Error parsing tasks from localStorage:', error);
    return defaultTasks;
  }
};

export const useTasks = () => {
  // Load tasks from localStorage or use defaults
  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return storedTasks ? parseTasksFromStorage(storedTasks) : defaultTasks;
  });

  const [filter, setFilter] = useState<TaskFilter>({});
  // Load expanded nodes from localStorage
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const storedExpandedNodes = localStorage.getItem(EXPANDED_NODES_STORAGE_KEY);
    return storedExpandedNodes 
      ? new Set(JSON.parse(storedExpandedNodes)) 
      : new Set(['1', '2']);
  });

  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by status
      if (filter.status && task.status !== filter.status) return false;
      
      // Filter by search term
      if (filter.searchTerm && filter.searchTerm.trim() !== '') {
        const searchLower = filter.searchTerm.toLowerCase().trim();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descriptionMatch = task.description.toLowerCase().includes(searchLower);
        if (!titleMatch && !descriptionMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, filter]);

  // Create a filtered tree based on the filtered tasks
  const filteredTaskTree = useMemo(() => {
    // If there are no active filters, return the full tree
    if (!filter.status && (!filter.searchTerm || filter.searchTerm.trim() === '')) {
      return taskTree;
    }

    // Get IDs of filtered tasks
    const filteredTaskIds = new Set(filteredTasks.map(task => task.id));
    
    // Function to include ancestors of tasks that match the filter
    const includeAncestors = (taskId: string, includedIds: Set<string>) => {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.parentId && !includedIds.has(task.parentId)) {
        includedIds.add(task.parentId);
        includeAncestors(task.parentId, includedIds);
      }
    };

    // Include ancestors of all filtered tasks
    const tasksToInclude = new Set(filteredTaskIds);
    filteredTaskIds.forEach(taskId => {
      includeAncestors(taskId, tasksToInclude);
    });

    // Create a list of tasks that includes the filtered ones and their ancestors
    const tasksForTree = tasks.filter(task => tasksToInclude.has(task.id));
    
    return buildTaskTree(tasksForTree);
  }, [tasks, taskTree, filteredTasks, filter]);

  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'childIds' | 'depth'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      childIds: [],
      depth: taskData.parentId ? (tasks.find(t => t.id === taskData.parentId)?.depth ?? 0) + 1 : 0
    };

    setTasks(prev => {
      const updated = [...prev, newTask];
      
      if (taskData.parentId) {
        const parentIndex = updated.findIndex(t => t.id === taskData.parentId);
        if (parentIndex !== -1) {
          updated[parentIndex] = {
            ...updated[parentIndex],
            childIds: [...updated[parentIndex].childIds, newTask.id]
          };
        }
      }
      
      return updated;
    });

    return newTask.id;
  }, [tasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  }, []);

  const deleteTask = useCallback((id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    setTasks(prev => {
      let updated = [...prev];
      
      // Remove from parent's childIds
      if (taskToDelete.parentId) {
        const parentIndex = updated.findIndex(t => t.id === taskToDelete.parentId);
        if (parentIndex !== -1) {
          updated[parentIndex] = {
            ...updated[parentIndex],
            childIds: updated[parentIndex].childIds.filter(childId => childId !== id)
          };
        }
      }

      // Recursively delete children
      const deleteRecursive = (taskId: string) => {
        const task = updated.find(t => t.id === taskId);
        if (task) {
          task.childIds.forEach(childId => deleteRecursive(childId));
          updated = updated.filter(t => t.id !== taskId);
        }
      };

      deleteRecursive(id);
      return updated;
    });
  }, [tasks]);

  const moveTask = useCallback((id: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return false;

    // Check if it can be completed (all subtasks must be completed)
    if (newStatus === 'Done' && !canCompleteTask(task, tasks)) {
      return false;
    }

    updateTask(id, { status: newStatus });
    return true;
  }, [tasks, updateTask]);

  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const getTaskById = useCallback((id: string): Task | undefined => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);

  // Save expanded nodes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        EXPANDED_NODES_STORAGE_KEY, 
        JSON.stringify(Array.from(expandedNodes))
      );
    } catch (error) {
      console.error('Error saving expanded nodes to localStorage:', error);
    }
  }, [expandedNodes]);

  return {
    tasks,
    taskTree,
    filteredTasks,
    filteredTaskTree,
    filter,
    expandedNodes,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    setFilter,
    toggleNodeExpansion,
    getTaskById,
    getTasksByStatus
  };
};