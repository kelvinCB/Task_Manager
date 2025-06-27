import React, { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskTree } from './components/TaskTree';
import { TaskBoard } from './components/TaskBoard';
import { TaskForm } from './components/TaskForm';
import { Task } from './types/Task';
import { 
  TreePine, 
  LayoutGrid, 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload
} from 'lucide-react';
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
    getTaskById
  } = useTasks();

  const [view, setView] = useState<'tree' | 'board'>('tree');
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
      complete: (results) => {
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
      error: (error) => {
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
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('tree')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                    ${view === 'tree' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <TreePine size={16} />
                  Tree
                </button>
                <button
                  onClick={() => setView('board')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                    ${view === 'board' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <LayoutGrid size={16} />
                  Board
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
                nodes={filteredTaskTree}
                expandedNodes={expandedNodes}
                allTasks={filteredTasks}
                onToggleExpand={toggleNodeExpansion}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onDelete={deleteTask}
                onAddChild={handleAddChild}
              />
            </div>
          ) : (
            <TaskBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onEdit={handleEditTask}
              onDelete={deleteTask}
              onCreateTask={openCreateForm}
            />
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