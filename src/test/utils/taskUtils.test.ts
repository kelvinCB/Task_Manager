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
    it('should format date correctly with complete validation', () => {
      // Arrange
      // Usar una fecha específica en la zona horaria local para evitar problemas de UTC
      const date = new Date(2021, 6, 15, 12, 0, 0); // July 15, 2021 at noon
      
      // Act
      const formattedDate = formatDate(date);
      
      // Assert - verificamos el formato completo incluyendo mes y día
      expect(formattedDate).toMatch(/[A-Z][a-z]{2} \d{1,2}, 2021/);
      
      // Validar componentes específicos de la fecha
      expect(formattedDate).toContain('2021'); // Year
      expect(formattedDate).toContain('15'); // Day
      // July puede aparecer como 'Jul' o 'July' dependiendo de la implementación
      expect(formattedDate).toMatch(/Jul|July/);
    });
    
    it('should format different months correctly', () => {
      // Test cases for different months usando fechas locales
      const testCases = [
        { date: new Date(2025, 0, 1, 12, 0, 0), expectedMonth: /Jan|January/, expectedDay: '1', expectedYear: '2025' },
        { date: new Date(2025, 5, 30, 12, 0, 0), expectedMonth: /Jun|June/, expectedDay: '30', expectedYear: '2025' },
        { date: new Date(2025, 11, 25, 12, 0, 0), expectedMonth: /Dec|December/, expectedDay: '25', expectedYear: '2025' }
      ];
      
      testCases.forEach(testCase => {
        const formattedDate = formatDate(testCase.date);
        
        // Verify year
        expect(formattedDate).toContain(testCase.expectedYear);
        
        // Verify month
        expect(formattedDate).toMatch(testCase.expectedMonth);
        
        // Verify day
        expect(formattedDate).toContain(testCase.expectedDay);
      });
    });
    
    it('should handle edge cases for dates', () => {
      // Test first day of year
      const firstDay = new Date(2025, 0, 1, 12, 0, 0);
      const formattedFirstDay = formatDate(firstDay);
      expect(formattedFirstDay).toContain('2025');
      expect(formattedFirstDay).toContain('1');
      expect(formattedFirstDay).toMatch(/Jan|January/);
      
      // Test last day of year
      const lastDay = new Date(2025, 11, 31, 12, 0, 0);
      const formattedLastDay = formatDate(lastDay);
      expect(formattedLastDay).toContain('2025');
      expect(formattedLastDay).toContain('31');
      expect(formattedLastDay).toMatch(/Dec|December/);
      
      // Test leap year Feb 29
      const leapDay = new Date(2024, 1, 29, 12, 0, 0);
      const formattedLeapDay = formatDate(leapDay);
      expect(formattedLeapDay).toContain('2024');
      expect(formattedLeapDay).toContain('29');
      expect(formattedLeapDay).toMatch(/Feb|February/);
    });
    
    it('should validate specific date components comprehensively', () => {
      // Test case específico para validar que todos los componentes de fecha son correctos
      const testDate = new Date(2025, 11, 30, 12, 0, 0); // Dec 30, 2025
      const formattedDate = formatDate(testDate);
      
      // Verificar que contiene todos los componentes esperados
      expect(formattedDate).toContain('2025'); // Year
      expect(formattedDate).toContain('30'); // Day
      expect(formattedDate).toMatch(/Dec|December/); // Month
      
      // Verificar el formato general
      expect(formattedDate).toMatch(/[A-Z][a-z]{2,8} \d{1,2}, \d{4}/);
      
      // Verificar que no contiene caracteres extraños
      expect(formattedDate).not.toContain('undefined');
      expect(formattedDate).not.toContain('null');
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
