import React from 'react';
import { TaskNode, TaskStatus, Task } from '../types/Task';
import { TaskItem } from './TaskItem';
import { canCompleteTask } from '../utils/taskUtils';

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
  getElapsedTime
}) => {
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
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-500 max-w-sm">
          Create your first task to get started with organizing your work hierarchically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
        />
      ))}
    </div>
  );
};