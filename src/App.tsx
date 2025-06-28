import React, { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskTree } from './components/TaskTree';
import { TaskBoard } from './components/TaskBoard';
import { TaskForm } from './components/TaskForm';
import { Task, ImportedTaskRow, TaskNode } from './types/Task';
import { 
  TreePine, 
  LayoutGrid, 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  Clock,
  BarChart
} from 'lucide-react';
// @ts-ignore
import Papa from 'papaparse';

function App() {
  const {
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
    // Time tracking functions
    startTaskTimer,
    pauseTaskTimer,
    getElapsedTime,
    getTimeStatistics
  } = useTasks();

  const [view, setView] = useState<'tree' | 'board' | 'stats'>('tree');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [parentId, setParentId] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'childIds' | 'depth'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      createTask(taskData);
    }
    setEditingTask(undefined);
    setParentId(undefined);
    setIsFormOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleAddChild = (parentTaskId: string) => {
    // Verificar si la tarea padre está completada
    const parentTask = getTaskById(parentTaskId);
    if (parentTask && parentTask.status === 'Done') {
      alert('Cannot add a subtask because the parent task is already completed and marked as "Done"');
      return;
    }
    
    setParentId(parentTaskId);
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  const handleStatusChange = (id: string, status: Task['status']) => {
    const success = moveTask(id, status);
    if (!success) {
      alert('Cannot complete a task that has incomplete subtasks');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilter({ ...filter, searchTerm: value });
  };

  const openCreateForm = () => {
    setEditingTask(undefined);
    setParentId(undefined);
    setIsFormOpen(true);
  };

  const handleImportTasks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const importedTasks: Omit<Task, 'id' | 'childIds' | 'depth'>[] = results.data.map((row: ImportedTaskRow) => ({
          title: row.title || 'Untitled Task',
          description: row.description || '',
          status: row.status as Task['status'] || 'Open',
          createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
          dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
          parentId: row.parentId || undefined,
        }));

        importedTasks.forEach(taskData => {
          createTask(taskData);
        });
        alert('Tasks imported successfully!');
      },
      error: (error: any) => {
        console.error('Error parsing CSV:', error);
        alert('Error importing tasks. Please check the CSV file format.');
      }
    });
  };

  const handleExportTasks = () => {
    const tasksToExport = filteredTasks;

    const csv = Papa.unparse(tasksToExport.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
      dueDate: task.dueDate ? task.dueDate.toISOString() : '',
      parentId: task.parentId || '',
      childIds: task.childIds.join(';')
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    link.setAttribute('download', `tasks-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TreePine className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
                <p className="text-sm text-gray-600">Hierarchical Task Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setView('tree')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                    ${view === 'tree' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <TreePine size={18} />
                  <span className="hidden sm:inline">Tree View</span>
                </button>
                <button
                  onClick={() => setView('board')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                    ${view === 'board' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <LayoutGrid size={18} />
                  <span className="hidden sm:inline">Board View</span>
                </button>
                <button
                  onClick={() => setView('stats')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                    ${view === 'stats' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <Clock size={18} />
                  <span className="hidden sm:inline">Time Stats</span>
                </button>
              </div>

              {/* Add Task Button */}
              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Task</span>
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportTasks}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Import Button */}
              <label htmlFor="import-csv" className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200 cursor-pointer">
                <Upload size={16} />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  id="import-csv"
                  accept=".csv"
                  onChange={handleImportTasks}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Filters Section */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <Filter size={16} />
              </button>
            </div>

            {showFilters && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status:
                  </label>
                  <select
                    value={filter.status || ''}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value as Task['status'] || undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(filter.status || filter.searchTerm) && (
                  <button
                    onClick={() => {
                      setFilter({});
                      setSearchTerm('');
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="h-[calc(100vh-8rem)]">
          {view === 'tree' ? (
            <div className="h-full overflow-auto p-6">
              <TaskTree
                nodes={filteredTaskTree as unknown as TaskNode[]}
                expandedNodes={expandedNodes}
                allTasks={filteredTasks as unknown as TaskNode[]}
                onToggleExpand={toggleNodeExpansion}
                onStatusChange={handleStatusChange}
                onEdit={(task: TaskNode) => handleEditTask(task as unknown as Task)}
                onDelete={deleteTask}
                onAddChild={handleAddChild}
                onStartTimer={startTaskTimer}
                onPauseTimer={pauseTaskTimer}
                getElapsedTime={getElapsedTime}
              />
            </div>
          ) : view === 'board' ? (
            <TaskBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onEdit={handleEditTask}
              onDelete={deleteTask}
              onCreateTask={openCreateForm}
              onStartTimer={startTaskTimer}
              onPauseTimer={pauseTaskTimer}
              getElapsedTime={getElapsedTime}
            />
          ) : (
            <TimeStatsView timeStatistics={getTimeStatistics} />
          )}
        </div>
      </main>

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask}
        parentId={parentId}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(undefined);
          setParentId(undefined);
        }}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}

// Time Statistics Component
interface TimeStatsViewProps {
  timeStatistics: (period: 'day' | 'week' | 'month' | 'year' | {start: Date, end: Date}) => {
    totalTime: number;
    taskStats: { taskId: string; title: string; timeSpent: number }[];
  };
}

const TimeStatsView: React.FC<TimeStatsViewProps> = ({ timeStatistics }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [stats, setStats] = useState<{ totalTime: number; taskStats: { taskId: string; title: string; timeSpent: number }[] }>({ totalTime: 0, taskStats: [] });
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (isCustom && customStart && customEnd) {
      const stats = timeStatistics({
        start: new Date(customStart),
        end: new Date(customEnd)
      });
      setStats(stats);
    } else {
      const stats = timeStatistics(period);
      setStats(stats);
    }
  }, [period, customStart, customEnd, isCustom, timeStatistics]);

  // Format time from milliseconds to readable format
  const formatTime = (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Calculate percentage for chart
  const calculatePercentage = (timeSpent: number) => {
    if (stats.totalTime === 0) return 0;
    return (timeSpent / stats.totalTime) * 100;
  };

  return (
    <div className="h-full p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Time Tracking Statistics</h2>
          
          <div className="flex items-center gap-4">
            <div className="flex">
              <button 
                onClick={() => { setPeriod('day'); setIsCustom(false); }}
                className={`px-3 py-1 text-sm border-t border-b border-l rounded-l-lg ${period === 'day' && !isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'border-gray-300'}`}
              >
                Today
              </button>
              <button 
                onClick={() => { setPeriod('week'); setIsCustom(false); }}
                className={`px-3 py-1 text-sm border-t border-b ${period === 'week' && !isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'border-gray-300'}`}
              >
                This Week
              </button>
              <button 
                onClick={() => { setPeriod('month'); setIsCustom(false); }}
                className={`px-3 py-1 text-sm border-t border-b ${period === 'month' && !isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'border-gray-300'}`}
              >
                This Month
              </button>
              <button 
                onClick={() => { setPeriod('year'); setIsCustom(false); }}
                className={`px-3 py-1 text-sm border-t border-b border-r rounded-r-lg ${period === 'year' && !isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'border-gray-300'}`}
              >
                This Year
              </button>
            </div>

            <button 
              onClick={() => setIsCustom(!isCustom)}
              className={`px-3 py-1 text-sm rounded-lg border ${isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'border-gray-300'}`}
            >
              Custom
            </button>
          </div>
        </div>

        {isCustom && (
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Total Time Spent</h3>
            <span className="text-2xl font-bold">{formatTime(stats.totalTime)}</span>
          </div>
        </div>
        
        {stats.taskStats.length > 0 ? (
          <div>
            <h3 className="text-lg font-medium mb-4">Time by Task</h3>
            <div className="space-y-4">
              {stats.taskStats.map(task => (
                <div key={task.taskId} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <span>{formatTime(task.timeSpent)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${calculatePercentage(task.timeSpent)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <BarChart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No time tracking data available for this period.</p>
            <p className="text-gray-400 text-sm">Start tracking time on your tasks to see statistics here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;