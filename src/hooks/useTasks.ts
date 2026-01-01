import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, TaskStatus, TaskFilter, TimeEntry } from '../types/Task';
import { generateId, buildTaskTree, canCompleteTask } from '../utils/taskUtils';
import { taskService } from '../services/taskService';
import supabase from '../lib/supabaseClient';

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
    depth: 0,
    timeTracking: {
      totalTimeSpent: 0,
      isActive: false,
      timeEntries: []
    }
  },
  {
    id: '2',
    title: 'Design System',
    description: 'Create reusable UI components',
    status: 'Done',
    createdAt: new Date('2024-01-16'),
    parentId: '1',
    childIds: ['4'],
    depth: 1,
    timeTracking: {
      totalTimeSpent: 0,
      isActive: false,
      timeEntries: []
    }
  },
  {
    id: '3',
    title: 'API Integration',
    description: 'Connect frontend with backend services',
    status: 'Open',
    createdAt: new Date('2024-01-17'),
    parentId: '1',
    childIds: [],
    depth: 1,
    timeTracking: {
      totalTimeSpent: 0,
      isActive: false,
      timeEntries: []
    }
  },
  {
    id: '4',
    title: 'Button Components',
    description: 'Create various button styles and states',
    status: 'Done',
    createdAt: new Date('2024-01-18'),
    parentId: '2',
    childIds: [],
    depth: 2,
    timeTracking: {
      totalTimeSpent: 0,
      isActive: false,
      timeEntries: []
    }
  }
];

// Key for localStorage
const TASKS_STORAGE_KEY = 'taskflow_tasks';
const EXPANDED_NODES_STORAGE_KEY = 'taskflow_expanded_nodes';

// Function to parse dates from localStorage
const parseTasksFromStorage = (storedTasks: string, useDefaultTasks: boolean = true): Task[] => {
  try {
    const parsedTasks = JSON.parse(storedTasks);
    return parsedTasks.map((task: any) => {
      // Ensure timeTracking exists for backward compatibility with older stored tasks
      if (!task.timeTracking) {
        task.timeTracking = {
          totalTimeSpent: 0,
          isActive: false,
          timeEntries: []
        };
      }

      return {
        ...task,
        createdAt: new Date(task.createdAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
      };
    });
  } catch (error) {
    console.error('Error parsing tasks from localStorage:', error);
    return useDefaultTasks ? defaultTasks : [];
  }
};

// Option for tests that allows disabling default tasks
export const useTasks = (options: { useDefaultTasks?: boolean; useApi?: boolean } = { useDefaultTasks: true, useApi: true }) => {
  // Track if we're using API or localStorage
  const [useApi, setUseApi] = useState<boolean>(options.useApi !== false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load tasks from localStorage or use defaults
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Avoid showing default tasks while we don't know auth state yet
    if (options.useApi !== false) {
      return [];
    }
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return storedTasks ? parseTasksFromStorage(storedTasks, options.useDefaultTasks) : (options.useDefaultTasks ? defaultTasks : []);
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

  // Local persistence for active timers to resist reloads/tab changes
  const ACTIVE_TIMERS_KEY = 'taskflow_active_timers';
  const getActiveTimers = (): Record<string, number> => {
    try { return JSON.parse(localStorage.getItem(ACTIVE_TIMERS_KEY) || '{}'); } catch { return {}; }
  };
  const setActiveTimer = useCallback((taskId: string, startedAt: number) => {
    const map = getActiveTimers();
    map[taskId] = startedAt;
    try { localStorage.setItem(ACTIVE_TIMERS_KEY, JSON.stringify(map)); } catch { }
  }, []);

  const clearActiveTimer = useCallback((taskId: string) => {
    const map = getActiveTimers();
    if (map[taskId]) {
      delete map[taskId];
      try { localStorage.setItem(ACTIVE_TIMERS_KEY, JSON.stringify(map)); } catch { }
    }
  }, []);

  // Load tasks from API on mount if authenticated
  useEffect(() => {
    const loadTasksFromApi = async () => {
      if (!useApi) {
        setIsLoading(false);
        return;
      }

      try {
        const isAuthenticated = await taskService.isAuthenticated();

        if (!isAuthenticated) {
          // User not authenticated, switch to localStorage & (re)load defaults
          setUseApi(false);
          const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
          setTasks(storedTasks ? parseTasksFromStorage(storedTasks, options.useDefaultTasks) : (options.useDefaultTasks ? defaultTasks : []));
          setIsLoading(false);
          return;
        }

        // Try to fetch tasks from API
        const response = await taskService.getTasks();

        if (response.error) {
          console.error('Failed to load tasks from API:', response.error);
          setApiError(response.error);
          // Fallback to localStorage on error
          setUseApi(false);
        } else if (response.data) {
          // Successfully loaded from API
          const activeTimers = getActiveTimers();
          const prevMap = new Map(tasks.map(t => [t.id, t]));
          const merged = response.data.map(apiTask => {
            const prev = prevMap.get(apiTask.id);
            let mergedTask = apiTask;
            if (prev && (prev.timeTracking.isActive || prev.timeTracking.totalTimeSpent > 0 || prev.timeTracking.timeEntries.length > 0)) {
              mergedTask = { ...apiTask, timeTracking: prev.timeTracking };
            }
            const lsStart = activeTimers[apiTask.id];
            // Only rehydrate running timers for tasks actually in "In Progress"
            if (lsStart && apiTask.status === 'In Progress') {
              mergedTask = {
                ...mergedTask,
                timeTracking: { ...mergedTask.timeTracking, isActive: true, lastStarted: lsStart }
              };
            }
            return mergedTask;
          });
          setTasks(merged);
          setApiError(null);
        }
      } catch (error) {
        console.error('Error loading tasks from API:', error);
        setApiError(error instanceof Error ? error.message : 'Unknown error');
        // Fallback to localStorage on error
        setUseApi(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasksFromApi();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in, try to load from API
        setUseApi(true);
        setIsLoading(true);
        loadTasksFromApi();
      } else if (event === 'SIGNED_OUT') {
        // User signed out, switch to localStorage
        setUseApi(false);
        const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
        setTasks(storedTasks ? parseTasksFromStorage(storedTasks, options.useDefaultTasks) : (options.useDefaultTasks ? defaultTasks : []));
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [useApi, options.useDefaultTasks]);

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'childIds' | 'depth' | 'timeTracking'>) => {
    // If using API, try to create task on backend
    if (useApi) {
      try {
        const response = await taskService.createTask({
          ...taskData,
          timeTracking: {
            totalTimeSpent: 0,
            isActive: false,
            timeEntries: []
          }
        });

        if (response.error) {
          console.error('Failed to create task on API:', response.error);
          setApiError(response.error);
          // Fallback to localStorage
        } else if (response.data) {
          // Successfully created on API, update local state
          setTasks(prev => {
            const updated = [...prev, response.data!];

            if (taskData.parentId) {
              const parentIndex = updated.findIndex(t => t.id === taskData.parentId);
              if (parentIndex !== -1) {
                updated[parentIndex] = {
                  ...updated[parentIndex],
                  childIds: [...updated[parentIndex].childIds, response.data!.id]
                };
              }
            }

            return updated;
          });
          return response.data.id;
        }
      } catch (error) {
        console.error('Error creating task:', error);
        setApiError(error instanceof Error ? error.message : 'Unknown error');
        // Continue to localStorage fallback
      }
    }

    // localStorage fallback
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      childIds: [],
      depth: taskData.parentId ? (tasks.find(t => t.id === taskData.parentId)?.depth ?? 0) + 1 : 0,
      timeTracking: {
        totalTimeSpent: 0,
        isActive: false,
        timeEntries: []
      }
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
  }, [tasks, useApi]);

  // Special createTask function for imports that preserves timeTracking data
  const createTaskWithTimeTracking = useCallback((taskData: Omit<Task, 'id' | 'childIds' | 'depth'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      childIds: [],
      depth: taskData.parentId ? (tasks.find(t => t.id === taskData.parentId)?.depth ?? 0) + 1 : 0,
      // Use provided timeTracking or default
      timeTracking: taskData.timeTracking || {
        totalTimeSpent: 0,
        isActive: false,
        timeEntries: []
      }
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

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // If using API, try to update task on backend
    if (useApi) {
      try {
        const response = await taskService.updateTask(id, updates);

        if (response.error) {
          console.error('Failed to update task on API:', response.error);
          setApiError(response.error);
          // Fallback to localStorage update
        } else if (response.data) {
          // Successfully updated on API, merge fields but preserve local-only timeTracking
          setTasks(prev => prev.map(task =>
            task.id === id
              ? {
                ...task,
                ...response.data as any,
                // Preserve local timeTracking updates if they exist, otherwise keep existing
                timeTracking: updates.timeTracking || task.timeTracking
              }
              : task
          ));
          return;
        }
      } catch (error) {
        console.error('Error updating task:', error);
        setApiError(error instanceof Error ? error.message : 'Unknown error');
        // Continue to localStorage fallback
      }
    }

    // localStorage fallback
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, ...updates } : task
    ));
  }, [useApi]);

  const deleteTask = useCallback(async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    // If using API, try to delete task on backend
    if (useApi) {
      try {
        const response = await taskService.deleteTask(id);

        if (response.error) {
          console.error('Failed to delete task on API:', response.error);
          setApiError(response.error);
          // Fallback to localStorage delete
        } else {
          // Successfully deleted on API, update local state
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
          return;
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        setApiError(error instanceof Error ? error.message : 'Unknown error');
        // Continue to localStorage fallback
      }
    }

    // localStorage fallback
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
  }, [tasks, useApi]);

  // We will move this function after defining pauseTaskTimer
  const moveTaskImpl = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return false;

    // Check if it can be completed (all subtasks must be completed)
    if (newStatus === 'Done' && !canCompleteTask(task, tasks)) {
      return false;
    }

    let updates: Partial<Task> & { total_time_ms?: number } = { status: newStatus };
    let durationToRecord = 0;

    // If the task is being marked as completed or moved back to Open and the timer is active,
    // we must pause it first
    if ((newStatus === 'Done' || newStatus === 'Open') && task.timeTracking.isActive) {
      const now = Date.now();
      const lastEntryIndex = task.timeTracking.timeEntries.length - 1;
      const lastEntry = task.timeTracking.timeEntries[lastEntryIndex];

      let duration = 0;
      let newTimeEntries = [...task.timeTracking.timeEntries];

      if (lastEntry && !lastEntry.endTime) {
        duration = now - lastEntry.startTime;
        newTimeEntries[lastEntryIndex] = {
          ...lastEntry,
          endTime: now,
          duration
        };
      } else {
        const effectiveStart = task.timeTracking.lastStarted || now;
        duration = Math.max(0, now - effectiveStart);
        newTimeEntries.push({ startTime: effectiveStart, endTime: now, duration } as TimeEntry);
      }

      durationToRecord = duration;
      updates.timeTracking = {
        ...task.timeTracking,
        isActive: false,
        totalTimeSpent: task.timeTracking.totalTimeSpent + duration,
        timeEntries: newTimeEntries
      };

      // Clear persisted running state
      clearActiveTimer(id);
    }

    // If moving to Done, ensure we send the total_time_ms to backend
    if (newStatus === 'Done') {
      const finalTotal = (updates.timeTracking?.totalTimeSpent) ?? task.timeTracking.totalTimeSpent;
      updates.total_time_ms = finalTotal;
    }

    // Perform a single update to avoid race conditions and multiple state renders
    await updateTask(id, updates);

    // Persist session to backend if needed
    if (useApi && durationToRecord > 0) {
      taskService.recordTimeSummary(id, durationToRecord).catch(() => { });
    }

    return true;
  };

  const moveTask = useCallback(moveTaskImpl, [tasks, updateTask, useApi]);


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

  // Save tasks to localStorage whenever they change (only if not using API)
  useEffect(() => {
    if (!useApi) {
      try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
      }
    }
  }, [tasks, useApi]);

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

  // Time tracking functions
  const startTaskTimer = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const now = Date.now();
    let updates: Partial<Task> = {};

    // Pause any other active timers
    const activeTasks = tasks.filter(t => t.timeTracking.isActive && t.id !== taskId);
    for (const activeTask of activeTasks) {
      await pauseTaskTimer(activeTask.id);
    }

    // If task is not in progress, change its status
    if (task.status !== 'In Progress') {
      updates.status = 'In Progress';
    }

    // Start the timer if it's not already running
    if (!task.timeTracking.isActive) {
      const newEntry: TimeEntry = {
        startTime: now
      };

      updates.timeTracking = {
        ...task.timeTracking,
        isActive: true,
        lastStarted: now,
        timeEntries: [...task.timeTracking.timeEntries, newEntry]
      };

      // Persist running state locally to resist tab changes/reloads
      setActiveTimer(taskId, now);
    }

    if (Object.keys(updates).length > 0) {
      await updateTask(taskId, updates);
    }
  }, [tasks, updateTask, setActiveTimer]);

  const pauseTaskTimer = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.timeTracking.isActive) return;

    const now = Date.now();
    const lastEntryIndex = task.timeTracking.timeEntries.length - 1;
    const lastEntry = task.timeTracking.timeEntries[lastEntryIndex];

    let duration = 0;
    let newTimeEntries = [...task.timeTracking.timeEntries];

    if (lastEntry && !lastEntry.endTime) {
      duration = now - lastEntry.startTime;
      newTimeEntries[lastEntryIndex] = {
        ...lastEntry,
        endTime: now,
        duration
      };
    } else {
      const effectiveStart = task.timeTracking.lastStarted || now;
      duration = Math.max(0, now - effectiveStart);
      newTimeEntries.push({ startTime: effectiveStart, endTime: now, duration } as TimeEntry);
    }

    await updateTask(taskId, {
      timeTracking: {
        ...task.timeTracking,
        isActive: false,
        totalTimeSpent: task.timeTracking.totalTimeSpent + duration,
        timeEntries: newTimeEntries
      }
    });

    clearActiveTimer(taskId);

    if (useApi && duration > 0) {
      taskService.recordTimeSummary(taskId, duration).catch(() => { });
    }
  }, [tasks, updateTask, useApi, clearActiveTimer]);

  const getElapsedTime = useCallback((taskId: string): number => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return 0;

    let totalTime = task.timeTracking.totalTimeSpent;

    // If the timer is active, add the current session time
    if (task.timeTracking.isActive && task.timeTracking.lastStarted) {
      const currentSession = Date.now() - task.timeTracking.lastStarted;
      totalTime += currentSession;
    }

    return totalTime;
  }, [tasks]);

  // Get time statistics for specific time periods (uses backend summary when useApi)
  const getTimeStatistics = useCallback((period: 'day' | 'week' | 'month' | 'year' | 'custom', customStart?: Date, customEnd?: Date) => {
    const nowTime = Date.now();
    const now = new Date(nowTime);

    let startDate: Date;
    let endDate: Date = now;

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
      // custom
      startDate = customStart ?? new Date(0);
      endDate = customEnd ?? now;
    }

    if (useApi) {
      // Return synchronous fallback while request happens would complicate UI; instead compute sync from local copy
      // but prefer backend by using de-synced blocking call here (this function is used in useEffect)
      // Since we can't make hooks async easily, compute from local then try to update TimeStatsView via a side effect.
      // Simpler: compute synchronously from local as before when useApi is true.
    }

    // Local computation fallback (works both for API and local-only modes)
    const stats = { totalTime: 0, taskStats: [] as { taskId: string, title: string, timeSpent: number }[] };

    tasks.forEach(task => {
      let taskTime = 0;
      task.timeTracking.timeEntries.forEach(entry => {
        const entryStart = new Date(entry.startTime);
        const entryEnd = entry.endTime ? new Date(entry.endTime) : now;
        if (entryStart >= startDate && entryStart <= endDate) {
          const duration = entry.duration || (entryEnd.getTime() - entryStart.getTime());
          taskTime += duration;
        }
      });
      // For tasks marcadas como Done y con total_time_ms del backend, si no hay entradas locales usamos ese total en rangos amplios
      if (taskTime === 0 && task.status === 'Done' && (task as any).timeTracking?.totalTimeSpent) {
        taskTime = task.timeTracking.totalTimeSpent;
      }
      if (taskTime > 0) {
        stats.totalTime += taskTime;
        stats.taskStats.push({ taskId: task.id, title: task.title, timeSpent: taskTime });
      }
    });

    stats.taskStats.sort((a, b) => b.timeSpent - a.timeSpent);
    return stats;
  }, [tasks, useApi]);

  return {
    tasks,
    taskTree,
    filteredTasks,
    filteredTaskTree,
    filter,
    expandedNodes,
    createTask,
    createTaskWithTimeTracking,
    updateTask,
    deleteTask,
    moveTask,
    setFilter,
    toggleNodeExpansion,
    getTaskById,
    getTasksByStatus,
    // Time tracking functions
    startTaskTimer,
    pauseTaskTimer,
    getElapsedTime,
    getTimeStatistics,
    // API state
    isLoading,
    apiError,
    useApi
  };
};
