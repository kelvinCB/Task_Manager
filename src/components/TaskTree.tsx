import React from 'react';
import { useTranslation } from 'react-i18next';
import { TaskNode, TaskStatus, Task } from '../types/Task';
import { TaskItem } from './TaskItem';
import { canCompleteTask } from '../utils/taskUtils';
import { useTheme } from '../contexts/ThemeContext';

interface TaskTreeProps {
  nodes: TaskNode[];
  expandedNodes: Set<string>;
  allTasks: TaskNode[];
  onToggleExpand: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: TaskNode) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onStartTimer?: (taskId: string) => void;
  onPauseTimer?: (taskId: string) => void;
  getElapsedTime?: (taskId: string) => number;
  onTaskClick?: (taskId: string) => void;
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  nodes,
  expandedNodes,
  allTasks,
  onToggleExpand,
  onStatusChange,
  onEdit,
  onDelete,
  onAddChild,
  onStartTimer,
  onPauseTimer,
  getElapsedTime,
  onTaskClick
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();


  const flattenTasks = (nodes: TaskNode[]): TaskNode[] => {
    const result: TaskNode[] = [];

    const traverse = (nodeList: TaskNode[]) => {
      nodeList.forEach(node => {
        result.push(node);
        if (expandedNodes.has(node.id) && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(nodes);
    return result;
  };

  const flatTasks = flattenTasks(nodes);

  if (flatTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-4`}>
          <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'} mb-2`}>{t('tasks.no_tasks')}</h3>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} max-w-sm`}>
          {t('tasks.create_first')}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${theme === 'dark' ? 'bg-gray-800' : ''}`}>
      {flatTasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          isExpanded={expandedNodes.has(task.id)}
          onToggleExpand={onToggleExpand}
          onStatusChange={onStatusChange}
          onEdit={(t: Task) => onEdit(t as unknown as TaskNode)}
          onDelete={onDelete}
          onAddChild={onAddChild}
          hasChildren={task.children.length > 0}
          canComplete={canCompleteTask(task, allTasks)}
          onStartTimer={onStartTimer}
          onPauseTimer={onPauseTimer}
          getElapsedTime={getElapsedTime}
          onTaskClick={onTaskClick}
          allTasks={allTasks}
        />
      ))}
    </div>
  );
};