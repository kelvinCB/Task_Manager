import React, { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskTree } from './components/TaskTree';
import { TaskBoard } from './components/TaskBoard';
import { TaskForm } from './components/TaskForm';
import { TimeStatsView } from './components/TimeStatsView';
import { ProgressIcon } from './components/ProgressIcon';
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
  Sun,
  Moon
} from 'lucide-react';
import Papa from 'papaparse';
import { useTheme } from './contexts/ThemeContext';

function App() {
  const {
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
    // Time tracking functions
    startTaskTimer,
    pauseTaskTimer,
    getElapsedTime,
    getTimeStatistics
  } = useTasks();

  const { theme, toggleTheme } = useTheme();

  const [view, setView] = useState<'tree' | 'board' | 'stats'>('board');
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
    // Check if the parent task is completed
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
        const importedTasks: Omit<Task, 'id' | 'childIds' | 'depth'>[] = results.data.map((row: any) => {
          // Parse time tracking data if available
          let timeEntries = [];
          let totalTimeSpent = 0;
          
          if (row.timeEntries) {
            try {
              // Handle escaped quotes from CSV export
              const cleanedTimeEntries = row.timeEntries.replace(/""/g, '"');
              timeEntries = JSON.parse(cleanedTimeEntries);
              
              // Ensure timeEntries is an array and has valid structure
              if (Array.isArray(timeEntries)) {
                timeEntries = timeEntries.map(entry => {
                  // If an entry doesn't have endTime (was active), close it
                  if (entry.startTime && !entry.endTime) {
                    // For active entries, we'll assume they were stopped when exported
                    // Use a reasonable duration or calculate from startTime to now
                    const estimatedDuration = entry.duration || 0;
                    return {
                      ...entry,
                      endTime: entry.startTime + estimatedDuration,
                      duration: estimatedDuration
                    };
                  }
                  // Ensure all entries have proper numeric values
                  return {
                    ...entry,
                    startTime: Number(entry.startTime),
                    endTime: entry.endTime ? Number(entry.endTime) : undefined,
                    duration: entry.duration ? Number(entry.duration) : undefined
                  };
                });
              } else {
                timeEntries = [];
              }
            } catch (e) {
              console.warn('Could not parse time entries for task:', row.title, 'Error:', e);
              timeEntries = [];
            }
          }
          
          if (row.totalTimeSpent && !isNaN(Number(row.totalTimeSpent))) {
            totalTimeSpent = Number(row.totalTimeSpent);
          }
          
          return {
            title: row.title || 'Untitled Task',
            description: row.description || '',
            status: row.status as Task['status'] || 'Open',
            createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
            dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
            parentId: row.parentId || undefined,
            timeTracking: {
              totalTimeSpent,
              isActive: false,
              timeEntries
            }
          };
        });

        importedTasks.forEach(taskData => {
          createTaskWithTimeTracking(taskData);
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

    const csv = Papa.unparse(tasksToExport.map(task => {
      // Calculate total time including active sessions
      let totalTimeForExport = task.timeTracking.totalTimeSpent;
      let timeEntriesForExport = [...task.timeTracking.timeEntries];
      
      // If task is currently active, calculate the current session time
      if (task.timeTracking.isActive && task.timeTracking.lastStarted) {
        const currentSessionTime = Date.now() - task.timeTracking.lastStarted;
        totalTimeForExport += currentSessionTime;
        
        // Update the last entry to include the endTime and duration
        const lastEntryIndex = timeEntriesForExport.length - 1;
        if (lastEntryIndex >= 0 && !timeEntriesForExport[lastEntryIndex].endTime) {
          timeEntriesForExport[lastEntryIndex] = {
            ...timeEntriesForExport[lastEntryIndex],
            endTime: Date.now(),
            duration: currentSessionTime
          };
        }
      }
      
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        dueDate: task.dueDate ? task.dueDate.toISOString() : '',
        parentId: task.parentId || '',
        childIds: task.childIds.join(';'),
        // Time tracking data with current session included
        totalTimeSpent: totalTimeForExport,
        timeEntries: JSON.stringify(timeEntriesForExport)
      };
    }));

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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      {/* Header */}
      <header className={`bg-white border-b border-gray-200 shadow-sm ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-white dark:border-gray-700' : ''}`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-indigo-100'} rounded-lg`}>
                <ProgressIcon 
                  size={24} 
                  className={`${theme === 'dark' ? 'text-yellow-400' : 'text-indigo-600'}`} 
                  progress={75}
                />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>TasksFun</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Hierarchical Task Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'} w-4 h-4`} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:focus:ring-yellow-500' : ''}`}
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setView('tree')}
                  title="Tree View"
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                    ${view === 'tree' ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700') : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}
                  `}
                >
                  <TreePine size={18} />
                  <span className="hidden sm:inline">Tree View</span>
                </button>
                <button
                  onClick={() => setView('board')}
                  title="Board View"
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                    ${view === 'board' ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700') : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}
                  `}
                >
                  <LayoutGrid size={18} />
                  <span className="hidden sm:inline">Board View</span>
                </button>
                <button
                  onClick={() => setView('stats')}
                  title="Time Stats"
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                    ${view === 'stats' ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700') : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}
                  `}
                >
                  <Clock size={18} />
                  <span className="hidden sm:inline">Time Stats</span>
                </button>
              </div>

              {/* Add Task Button */}
              <button
                onClick={openCreateForm}
                className={`flex items-center gap-2 px-4 py-2 ${theme === 'dark' ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} rounded-lg transition-colors duration-200`}
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Task</span>
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportTasks}
                title="Export"
                className={`flex items-center gap-2 px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg transition-colors duration-200`}
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Import Button */}
              <label htmlFor="import-csv" title="Import" className={`flex items-center gap-2 px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg transition-colors duration-200 cursor-pointer`}>
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
        <div className={`bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h3 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} hover:bg-gray-100 rounded transition-colors duration-200 ${theme === 'dark' ? 'dark:hover:bg-gray-700' : ''}`}
                >
                  <Filter size={16} />
                </button>
              </div>

              {showFilters && (
                <>
                  <div className="flex items-center gap-2">
                    <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Status:
                    </label>
                    <select
                      value={filter.status || ''}
                      onChange={(e) => setFilter({ ...filter, status: e.target.value as Task['status'] || undefined })}
                      className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:focus:ring-yellow-500' : ''}`}
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
                      className={`px-3 py-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} hover:bg-gray-100 rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'dark:hover:bg-gray-700' : ''}`}
                    >
                      Clear Filters
                    </button>
                  )}
                </>
              )}
            </div>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg transition-colors duration-200`}
              title="Toggle Dark Mode"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span className="hidden sm:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="h-[calc(100vh-8rem)]">
          {view === 'tree' ? (
            <div data-testid="tree-view-container" className="h-full overflow-auto p-6">
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
            <TimeStatsView getTimeStatistics={(period, startDate, endDate) => {
              let stats;
              
              if (period === 'custom' && startDate && endDate) {
                stats = getTimeStatistics({start: startDate, end: endDate});
              } else {
                stats = getTimeStatistics(period as 'day' | 'week' | 'month' | 'year');
              }
              
              // Convert from format returned by useTasks to format expected by TimeStatsView
              return stats.taskStats.map(item => ({
                id: item.taskId,
                title: item.title,
                timeSpent: item.timeSpent,
                status: 'Open', // Required field but not used for statistics
                startDate: Date.now(),
                endDate: Date.now()
              }));
            }} />
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

export default App;