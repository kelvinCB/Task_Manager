import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
const MAX_TIMER_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

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
  const { t } = useTranslation();

  // Load tasks from localStorage or use defaults
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Initial load: Attempt to load from localStorage first to prevent UI flash/data loss
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    // If no stored tasks, and we might be using API (default), return empty to await API text
    // BUT since we want to support offline tasks persisting, we return stored tasks if available.
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
          // Fallback to localStorage on error?
          // We already loaded from LS in useState, so we just set useApi false to indicate "Offline Mode"
          setUseApi(false);
        } else if (response.data) {
          // Successfully loaded from API
          const activeTimers = getActiveTimers();

          // Merge Strategy: Keep local tasks that are NOT on server (offline created)
          // For now, assume any task with non-numeric ID is local-only.
          const serverIds = new Set(response.data.map(t => t.id));
          const localOnlyTasks = tasks.filter(t => {
            // Keep task if it's NOT in server list AND it has a non-numeric ID (generated by our offline logic)
            return !serverIds.has(t.id) && isNaN(Number(t.id));
          });

          const prevMap = new Map(tasks.map(t => [t.id, t]));
          const mergedServerTasks = response.data.map(apiTask => {
            const prev = prevMap.get(apiTask.id);
            let mergedTask = apiTask;

            if (prev) {
              const backendTotal = apiTask.timeTracking?.totalTimeSpent || 0;
              const localTotal = prev.timeTracking?.totalTimeSpent || 0;

              mergedTask = {
                ...apiTask,
                timeTracking: {
                  ...apiTask.timeTracking,
                  // Trust backend but keep local if it has more recorded time (e.g. offline work)
                  totalTimeSpent: Math.max(backendTotal, localTotal),
                  // Rehydrate active state based on who has the freshest data (highest total time)
                  isActive: backendTotal > localTotal
                    ? apiTask.timeTracking.isActive
                    : (localTotal > backendTotal
                      ? prev.timeTracking.isActive
                      : (apiTask.timeTracking.isActive || prev.timeTracking.isActive)),
                  lastStarted: backendTotal > localTotal
                    ? apiTask.timeTracking.lastStarted
                    : (localTotal > backendTotal
                      ? prev.timeTracking.lastStarted
                      : (apiTask.timeTracking.lastStarted || prev.timeTracking.lastStarted)),
                  timeEntries: prev.timeTracking.timeEntries.length > 0
                    ? prev.timeTracking.timeEntries
                    : apiTask.timeTracking.timeEntries
                }
              };
            }

            const lsStart = activeTimers[apiTask.id];
            // Rehydrate/ensure running timers for tasks actually in "In Progress"
            if (lsStart && apiTask.status === 'In Progress') {
              mergedTask = {
                ...mergedTask,
                timeTracking: {
                  ...mergedTask.timeTracking,
                  isActive: true,
                  lastStarted: lsStart
                }
              };
            }
            return mergedTask;
          });

          setTasks([...mergedServerTasks, ...localOnlyTasks]);
          setApiError(null);
        }
      } catch (error) {
        console.error('Error loading tasks from API:', error);
        setApiError(error instanceof Error ? error.message : 'Unknown error');
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

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'childIds' | 'depth' | 'timeTracking'>): Promise<Task | null> => {
    // If using API, try to create task on backend
    if (useApi) {
      const isParentNumeric = !taskData.parentId || !isNaN(Number(taskData.parentId));
      if (isParentNumeric) {
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
            return response.data;
          }
        } catch (error) {
          console.error('Error creating task:', error);
          setApiError(error instanceof Error ? error.message : 'Unknown error');
          // Continue to localStorage fallback
        }
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

    // Auto-expand the parent node so the new child is visible
    if (taskData.parentId) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(taskData.parentId!);
        return newSet;
      });
    }

    return newTask;
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

    // Auto-expand the parent node so the new child is visible
    if (taskData.parentId) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(taskData.parentId!);
        return newSet;
      });
    }

    return newTask.id;
  }, [tasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Validation: Cannot complete if subtasks are not done
    if (updates.status === 'Done' && !canCompleteTask(task, tasks)) {
      setApiError(t('tasks.cannot_complete_subtasks'));
      return;
    }

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
  }, [useApi, tasks, t]);

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
  const moveTaskImpl = async (id: string, newStatus: TaskStatus): Promise<Task | null> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    // Check if it can be completed (all subtasks must be completed)
    if (newStatus === 'Done' && !canCompleteTask(task, tasks)) {
      return null;
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
        duration = Math.min(now - lastEntry.startTime, MAX_TIMER_DURATION_MS);
        newTimeEntries[lastEntryIndex] = {
          ...lastEntry,
          endTime: lastEntry.startTime + duration,
          duration
        };
      } else {
        const effectiveStart = task.timeTracking.lastStarted || now;
        duration = Math.min(Math.max(0, now - effectiveStart), MAX_TIMER_DURATION_MS);
        newTimeEntries.push({ startTime: effectiveStart, endTime: effectiveStart + duration, duration } as TimeEntry);
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

    return { ...task, ...updates } as Task;
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

  // Save tasks to localStorage whenever they change (Active persistence / Backup)
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

  // Time tracking functions
  // Keep a ref to tasks for async operations to avoid stale closures
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const startTaskTimer = useCallback(async (taskId: string, currentTask?: Task) => {
    const task = currentTask || tasksRef.current.find(t => t.id === taskId);
    if (!task) return;

    const now = Date.now();
    let updates: Partial<Task> = {};

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
  }, [updateTask, setActiveTimer]);

  const pauseTaskTimer = useCallback(async (taskId: string) => {
    const task = tasksRef.current.find(t => t.id === taskId);
    if (!task || !task.timeTracking.isActive) return;

    const now = Date.now();
    const lastEntryIndex = task.timeTracking.timeEntries.length - 1;
    const lastEntry = task.timeTracking.timeEntries[lastEntryIndex];

    let duration = 0;
    let newTimeEntries = [...task.timeTracking.timeEntries];

    if (lastEntry && !lastEntry.endTime) {
      duration = Math.min(now - lastEntry.startTime, MAX_TIMER_DURATION_MS);
      newTimeEntries[lastEntryIndex] = {
        ...lastEntry,
        endTime: lastEntry.startTime + duration,
        duration
      };
    } else {
      const effectiveStart = task.timeTracking.lastStarted || now;
      duration = Math.min(Math.max(0, now - effectiveStart), MAX_TIMER_DURATION_MS);
      newTimeEntries.push({ startTime: effectiveStart, endTime: effectiveStart + duration, duration } as TimeEntry);
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
      // Cap at 8 hours per session
      totalTime += Math.min(currentSession, MAX_TIMER_DURATION_MS);
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
