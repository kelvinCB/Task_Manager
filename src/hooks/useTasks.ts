import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, TaskStatus, TaskNode, TaskFilter } from '../types/Task';
import { generateId, buildTaskTree, canCompleteTask } from '../utils/taskUtils';

// Tareas iniciales para nuevos usuarios
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

// Clave para el almacenamiento en localStorage
const TASKS_STORAGE_KEY = 'taskflow_tasks';
const EXPANDED_NODES_STORAGE_KEY = 'taskflow_expanded_nodes';

// Función para parsear fechas en localStorage
const parseTasksFromStorage = (storedTasks: string): Task[] => {
  try {
    const parsedTasks = JSON.parse(storedTasks);
    return parsedTasks.map((task: any) => ({
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
  // Carga las tareas desde localStorage o usa las predeterminadas
  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return storedTasks ? parseTasksFromStorage(storedTasks) : defaultTasks;
  });

  const [filter, setFilter] = useState<TaskFilter>({});
  // Carga los nodos expandidos desde localStorage
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const storedExpandedNodes = localStorage.getItem(EXPANDED_NODES_STORAGE_KEY);
    return storedExpandedNodes 
      ? new Set(JSON.parse(storedExpandedNodes)) 
      : new Set(['1', '2']);
  });

  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filtro por estado
      if (filter.status && task.status !== filter.status) return false;
      
      // Filtro por término de búsqueda
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

  // Crear un árbol filtrado basado en las tareas filtradas
  const filteredTaskTree = useMemo(() => {
    // Si no hay filtros activos, devolver el árbol completo
    if (!filter.status && (!filter.searchTerm || filter.searchTerm.trim() === '')) {
      return taskTree;
    }

    // Obtener IDs de tareas filtradas
    const filteredTaskIds = new Set(filteredTasks.map(task => task.id));
    
    // Función para incluir ancestros de tareas que coinciden con el filtro
    const includeAncestors = (taskId: string, includedIds: Set<string>) => {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.parentId && !includedIds.has(task.parentId)) {
        includedIds.add(task.parentId);
        includeAncestors(task.parentId, includedIds);
      }
    };

    // Incluir ancestros de todas las tareas filtradas
    const tasksToInclude = new Set(filteredTaskIds);
    filteredTaskIds.forEach(taskId => {
      includeAncestors(taskId, tasksToInclude);
    });

    // Crear lista de tareas que incluye las filtradas y sus ancestros
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

    // Verificar si puede completarse (todas las hijas deben estar completadas)
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

  // Guarda las tareas en localStorage cada vez que cambian
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);

  // Guarda los nodos expandidos en localStorage
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