import { describe, it, expect } from 'vitest';
import { Task, TaskNode, TaskStatus } from '../../types/Task';
import {
  canCompleteTask,
  buildTaskTree,
  formatDate,
  isTaskOverdue,
  getStatusColor,
  getStatusIcon
} from '../../utils/taskUtils';

describe('Task Utility Functions', () => {
  describe('canCompleteTask', () => {
    it('should return true when a task has no children', () => {
      // Arrange
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: '',
        status: 'In Progress',
        createdAt: new Date(),
        childIds: [],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      const allTasks: Task[] = [task];
      
      // Act & Assert
      expect(canCompleteTask(task, allTasks)).toBe(true);
    });
    
    it('should return true when all child tasks are done', () => {
      // Arrange
      const parentTask: Task = {
        id: 'parent',
        title: 'Parent',
        description: '',
        status: 'In Progress',
        createdAt: new Date(),
        childIds: ['child1', 'child2'],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      const childTask1: Task = {
        id: 'child1',
        title: 'Child 1',
        description: '',
        status: 'Done',
        createdAt: new Date(),
        childIds: [],
        parentId: 'parent',
        depth: 1,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      const childTask2: Task = {
        id: 'child2',
        title: 'Child 2',
        description: '',
        status: 'Done',
        createdAt: new Date(),
        childIds: [],
        parentId: 'parent',
        depth: 1,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      const allTasks: Task[] = [parentTask, childTask1, childTask2];
      
      // Act & Assert
      expect(canCompleteTask(parentTask, allTasks)).toBe(true);
    });
    
    it('should return false when some child tasks are not done', () => {
      // Arrange
      const parentTask: Task = {
        id: 'parent',
        title: 'Parent',
        description: '',
        status: 'In Progress',
        createdAt: new Date(),
        childIds: ['child1', 'child2'],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      const childTask1: Task = {
        id: 'child1',
        title: 'Child 1',
        description: '',
        status: 'Done',
        createdAt: new Date(),
        childIds: [],
        parentId: 'parent',
        depth: 1,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      const childTask2: Task = {
        id: 'child2',
        title: 'Child 2',
        description: '',
        status: 'In Progress',
        createdAt: new Date(),
        childIds: [],
        parentId: 'parent',
        depth: 1,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      const allTasks: Task[] = [parentTask, childTask1, childTask2];
      
      // Act & Assert
      expect(canCompleteTask(parentTask, allTasks)).toBe(false);
    });
  });
  
  describe('buildTaskTree', () => {
    it('should build a tree from flat task list', () => {
      // Arrange
      const tasks: Task[] = [
        {
          id: 'parent',
          title: 'Parent',
          description: '',
          status: 'In Progress',
          createdAt: new Date(),
          childIds: ['child1'],
          depth: 0,
          timeTracking: {
            isActive: false,
            totalTimeSpent: 0,
            timeEntries: []
          }
        },
        {
          id: 'child1',
          title: 'Child 1',
          description: '',
          status: 'Open',
          createdAt: new Date(),
          childIds: ['grandchild'],
          parentId: 'parent',
          depth: 1,
          timeTracking: {
            isActive: false,
            totalTimeSpent: 0,
            timeEntries: []
          }
        },
        {
          id: 'grandchild',
          title: 'Grandchild',
          description: '',
          status: 'Open',
          createdAt: new Date(),
          childIds: [],
          parentId: 'child1',
          depth: 2,
          timeTracking: {
            isActive: false,
            totalTimeSpent: 0,
            timeEntries: []
          }
        },
        {
          id: 'standalone',
          title: 'Standalone',
          description: '',
          status: 'Open',
          createdAt: new Date(),
          childIds: [],
          depth: 0,
          timeTracking: {
            isActive: false,
            totalTimeSpent: 0,
            timeEntries: []
          }
        }
      ];
      
      // Act
      const result = buildTaskTree(tasks);
      
      // Assert
      expect(result.length).toBe(2); // Dos nodos raíz: 'parent' y 'standalone'
      
      // Verificar estructura del árbol
      const parentNode = result.find(node => node.id === 'parent');
      expect(parentNode?.children.length).toBe(1);
      
      const childNode = parentNode?.children[0];
      expect(childNode?.id).toBe('child1');
      expect(childNode?.children.length).toBe(1);
      
      const grandchildNode = childNode?.children[0];
      expect(grandchildNode?.id).toBe('grandchild');
      expect(grandchildNode?.children.length).toBe(0);
      
      // Verificar nodo independiente
      const standaloneNode = result.find(node => node.id === 'standalone');
      expect(standaloneNode?.children.length).toBe(0);
    });
  });
  
  describe('formatDate', () => {
    it('should format date correctly', () => {
      // Arrange
      // Usar una fecha explícita con zona UTC para evitar problemas de zona horaria
      const date = new Date(Date.UTC(2021, 6, 15));
      
      // Act
      const formattedDate = formatDate(date);
      
      // Assert - verificamos solo el formato general, no la fecha específica
      // ya que depende de la implementación y zona horaria
      expect(formattedDate).toMatch(/[A-Z][a-z]{2} \d{1,2}, 2021/);
    });
  });
  
  describe('isTaskOverdue', () => {
    it('should return true for tasks with due date in the past', () => {
      // Arrange
      const task: Task = {
        id: 'task-1',
        title: 'Overdue Task',
        description: '',
        status: 'Open',
        createdAt: new Date(),
        dueDate: new Date('2021-01-01'), // Fecha en el pasado
        childIds: [],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      // Act & Assert
      expect(isTaskOverdue(task)).toBe(true);
    });
    
    it('should return false for tasks with future due date', () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 días en el futuro
      
      const task: Task = {
        id: 'task-1',
        title: 'Future Task',
        description: '',
        status: 'Open',
        createdAt: new Date(),
        dueDate: futureDate,
        childIds: [],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      // Act & Assert
      expect(isTaskOverdue(task)).toBe(false);
    });
    
    it('should return false for completed tasks even if due date is in the past', () => {
      // Arrange
      const task: Task = {
        id: 'task-1',
        title: 'Completed Task',
        description: '',
        status: 'Done',
        createdAt: new Date(),
        dueDate: new Date('2021-01-01'), // Fecha en el pasado
        childIds: [],
        depth: 0,
        timeTracking: {
          isActive: false,
          totalTimeSpent: 0,
          timeEntries: []
        }
      };
      
      // Act & Assert
      expect(isTaskOverdue(task)).toBe(false);
    });
  });
  
  describe('getStatusColor and getStatusIcon', () => {
    it('should return correct color for Open status', () => {
      expect(getStatusColor('Open')).toContain('blue');
    });
    
    it('should return correct color for In Progress status', () => {
      expect(getStatusColor('In Progress')).toContain('amber');
    });
    
    it('should return correct color for Done status', () => {
      expect(getStatusColor('Done')).toContain('green');
    });
    
    it('should return correct icon name for each status', () => {
      expect(getStatusIcon('Open')).toBeTruthy();
      expect(getStatusIcon('In Progress')).toBeTruthy();
      expect(getStatusIcon('Done')).toBeTruthy();
      // Los nombres exactos dependen de la implementación
    });
  });
});
