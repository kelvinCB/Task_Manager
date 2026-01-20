import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTasks } from './hooks/useTasks';
import { TaskTree } from './components/TaskTree';
import { TaskBoard } from './components/TaskBoard';
import { TaskForm } from './components/TaskForm';
import { TimeStatsView } from './components/TimeStatsView';
import { taskService } from './services/taskService';
import { ProgressIcon } from './components/ProgressIcon';
import { Task, TaskNode } from './types/Task';
import './i18n'; // Initialize i18n
import { LanguageToggle } from './components/ui/LanguageToggle';
import {
  TreePine,
  LayoutGrid,
  Plus,
  Search,
  Filter,
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import Papa from 'papaparse';

import { useTheme } from './contexts/ThemeContext';
import { AccountMenu } from './components/features/account/AccountMenu';

import { canCompleteTask } from './utils/taskUtils';
import './styles/logoAnimation.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallback from './pages/AuthCallback';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ErrorModal } from './components/features/ErrorModal';
import { useAuth } from './contexts/AuthContext';
import HelpFAB from './components/features/help/HelpFAB';
import { Toaster } from 'sonner';
import PricingPage from './pages/PricingPage';

const MainApp = () => {
  const {
    tasks,
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
    getTimeStatistics,
    isLoading
  } = useTasks();

  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = t('app.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('app.description'));
  }, [t]);


  // Load view from localStorage or default to 'board'
  const [view, setView] = useState<'tree' | 'board' | 'stats'>(() => {
    const savedView = localStorage.getItem('taskflow_view');
    return (savedView === 'tree' || savedView === 'board' || savedView === 'stats') ? savedView : 'board';
  });

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskflow_view', view);
  }, [view]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [parentId, setParentId] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Task Detail Modal State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTaskId(null);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setIsErrorModalOpen(true);
  };


  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'childIds' | 'depth'>) => {
    let targetTask: Task | undefined;

    if (editingTask) {
      await updateTask(editingTask.id, taskData);
      // Construct optimistic update correctly for startTaskTimer
      targetTask = { ...editingTask, ...taskData } as Task;
    } else {
      const newTask = await createTask(taskData);
      if (newTask) {
        targetTask = newTask;
      }
    }

    // Auto-start timer if status is 'In Progress'
    if (targetTask && taskData.status === 'In Progress') {
      startTaskTimer(targetTask.id, targetTask);
    }

    setEditingTask(undefined);
    setParentId(undefined);
    setIsFormOpen(false);

    // Scroll to top on mobile after creating or editing a task
    if (window.innerWidth < 768) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleAddChild = (parentTaskId: string) => {
    // Check if the parent task is completed
    const parentTask = getTaskById(parentTaskId);
    if (parentTask && parentTask.status === 'Done') {
      showError(t('errors.cannot_add_subtask_to_done'));
      return;
    }

    setParentId(parentTaskId);
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    const updatedTask = await moveTask(id, status);
    if (!updatedTask) {
      showError(t('tasks.cannot_complete_subtasks'));
      return;
    }

    // Auto-start timer if status is changed to 'In Progress'
    if (status === 'In Progress') {
      startTaskTimer(id, updatedTask);
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
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const importedTasks: Omit<Task, 'id' | 'childIds' | 'depth'>[] = results.data.map((row: Record<string, string>) => {
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
        alert(t('common.success')); // Or improved alert
      },
      error: (error: unknown) => {
        console.error('Error parsing CSV:', error);
        alert(t('common.error'));
      }
    });
  };

  const handleExportTasks = () => {
    const tasksToExport = filteredTasks;

    const csv = Papa.unparse(tasksToExport.map(task => {
      // Calculate total time including active sessions
      let totalTimeForExport = task.timeTracking.totalTimeSpent;
      const timeEntriesForExport = [...task.timeTracking.timeEntries];

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
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}
      data-loading={isLoading}
    >
      {/* Mobile Header - Three Level Design */}
      <header className={`bg-white border-b border-gray-200 shadow-sm ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-white dark:border-gray-700' : ''}`}>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Desktop Header - Original Design */}
          <div className="hidden lg:flex items-center justify-between h-16">
            <div className="flex shrink-0 items-center gap-3 mr-4">
              <div className={`shrink-0 mobile-icon-animation`}>
                <img
                  src="/favicon.png"
                  alt="Kolium Logo"
                  className="w-10 h-10 rounded-lg object-contain"
                />
              </div>
              <div className="whitespace-nowrap">
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mobile-logo-animation ${theme}`}>
                  {'Kolium'.split('').map((letter, index) => (
                    <span key={index}>{letter}</span>
                  ))}
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t('app.subtitle')}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-1 gap-3 sm:gap-3">
              {/* Search area */}
              <div className="flex-1 flex justify-end items-center">
                <div className="relative w-60 sm:w-80 lg:w-60 min-[1330px]:w-80">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'} w-4 h-4`} />
                  <input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className={`pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:focus:ring-yellow-500' : ''}`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  data-testid="add-task-button"
                  onClick={openCreateForm}
                  className={`flex items-center gap-2 px-5 py-2.5 ${theme === 'dark' ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} rounded-lg transition-colors duration-200 text-base font-medium shadow-sm`}
                >
                  <Plus size={18} />
                  <span className="hidden min-[1330px]:inline">{t('tasks.new_task')}</span>
                </button>
                {/* View Toggle */}
                <div className={`flex items-center space-x-2 p-1 rounded-lg ${theme === 'dark' ? 'bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100'} shadow-sm`}>
                  <button
                    onClick={() => setView('tree')}
                    data-testid="tree-view-toggle"
                    title={t('nav.tree_view')}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                      ${view === 'tree'
                        ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700')
                        : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200')}
                    `}
                  >
                    <TreePine size={18} />
                    <span className="hidden min-[1330px]:inline">{t('nav.tree_view')}</span>
                  </button>
                  <button
                    onClick={() => setView('board')}
                    data-testid="board-view-toggle"
                    title={t('nav.board_view')}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                      ${view === 'board'
                        ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700')
                        : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200')}
                    `}
                  >
                    <LayoutGrid size={18} />
                    <span className="hidden min-[1330px]:inline">{t('nav.board_view')}</span>
                  </button>
                  <button
                    onClick={() => setView('stats')}
                    data-testid="stats-view-toggle"
                    title={t('nav.stats_view')}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
                      ${view === 'stats'
                        ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700')
                        : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200')}
                    `}
                  >
                    <Clock size={18} />
                    <span className="hidden min-[1330px]:inline">{t('nav.stats_view')}</span>
                  </button>
                </div>
              </div>

              {/* Account Menu - At the far right */}
              <div className="flex items-center ml-3">
                <AccountMenu
                  onExport={handleExportTasks}
                  onImport={handleImportTasks}
                />
              </div>
            </div>
          </div>

          {/* Mobile Header - Three Level Design */}
          <div data-testid="mobile-header" className="lg:hidden">
            {/* Level 1: Logo and App Name */}
            <div className="flex items-center justify-center py-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-indigo-100'} rounded-lg mobile-icon-animation`}>
                  <ProgressIcon
                    size={20}
                    className={`${theme === 'dark' ? 'text-yellow-400' : 'text-indigo-600'}`}
                    progress={75}
                  />
                </div>
                <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mobile-logo-animation ${theme}`}>
                  {'Kolium'.split('').map((letter, index) => (
                    <span key={index}>{letter}</span>
                  ))}
                </h1>
              </div>
            </div>

            {/* Level 2: Search, Add Task, and View Buttons */}
            <div className="flex items-center gap-2 py-3 border-b border-gray-200 dark:border-gray-700">
              {/* Search */}
              <div className="flex-1 min-w-0 max-w-[140px] sm:max-w-none relative">
                <Search className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'} w-3.5 h-3.5`} />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`pl-8 pr-2 py-1.5 w-full text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:focus:ring-yellow-500' : ''}`}
                />
              </div>

              {/* Account Menu removed from here - moved to burger menu area */}

              {/* Add Task Button */}
              <button
                onClick={openCreateForm}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 ${theme === 'dark' ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm min-w-[40px] whitespace-nowrap`}
                data-testid="add-task-mobile-button"
              >
                <Plus size={18} />
                <span className="hidden min-[400px]:inline">{t('common.create')}</span>
              </button>

              {/* View Toggle Buttons with Background */}
              <div className={`flex items-center gap-0.5 p-1 rounded-lg ${theme === 'dark' ? 'bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100'} shadow-sm`}>
                <button
                  onClick={() => setView('tree')}
                  data-testid="tree-view-toggle-mobile"
                  title={t('nav.tree_view')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${view === 'tree'
                    ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700')
                    : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200')
                    }`}
                >
                  <TreePine size={16} />
                </button>
                <button
                  onClick={() => setView('board')}
                  data-testid="board-view-toggle-mobile"
                  title={t('nav.board_view')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${view === 'board'
                    ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700')
                    : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200')
                    }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setView('stats')}
                  data-testid="stats-view-toggle-mobile"
                  title={t('nav.stats_view')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${view === 'stats'
                    ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700')
                    : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200')
                    }`}
                >
                  <Clock size={16} />
                </button>
              </div>
            </div>

            {/* Level 3: Theme Toggle, Filters, Account Menu and Burger Menu */}
            <div className="py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {/* Language Toggle */}
                  <LanguageToggle />

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    title="Toggle Dark Mode"
                  >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  </button>

                  {/* Filters Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${showFilters
                      ? (theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-indigo-100 text-indigo-700')
                      : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-200')
                      }`}
                    title={t('common.filter')}
                    aria-label={t('common.filter')}
                  >
                    <Filter size={16} />
                  </button>

                  {/* Account Menu removed from here - moved to replace burger menu */}

                  {/* Inline Filters when active */}
                  {showFilters && (
                    <>
                      <div className="flex items-center gap-1">
                        <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          {t('tasks.status')}:
                        </label>
                        <select
                          value={filter.status || ''}
                          onChange={(e) => setFilter({ ...filter, status: e.target.value as Task['status'] || undefined })}
                          className={`px-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 text-center ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:focus:ring-yellow-500' : ''}`}
                          style={{ minWidth: '90px' }}
                        >
                          <option value="" className="text-center">{t('tasks.all_status')}</option>
                          <option value="Open" className="text-center">{t('tasks.status_open')}</option>
                          <option value="In Progress" className="text-center">{t('tasks.status_in_progress')}</option>
                          <option value="Done" className="text-center">{t('tasks.status_done')}</option>
                        </select>
                      </div>

                      {/* Clear Filters */}
                      {(filter.status || filter.searchTerm) && (
                        <button
                          onClick={() => {
                            setFilter({});
                            setSearchTerm('');
                          }}
                          className={`px-2 py-1 text-xs ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} hover:bg-gray-100 rounded transition-colors duration-200 ${theme === 'dark' ? 'dark:hover:bg-gray-700' : ''}`}
                        >
                          {t('common.filter')}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Account Menu - Replaced Burger Menu */}
                <AccountMenu
                  onExport={handleExportTasks}
                  onImport={handleImportTasks}
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Filters Section - Desktop Only */}
        <div className={`hidden lg:block bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h3 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{t('common.filter')}</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} hover:bg-gray-100 rounded transition-colors duration-200 ${theme === 'dark' ? 'dark:hover:bg-gray-700' : ''}`}
                  title={t('common.filter')}
                  aria-label={t('common.filter')}
                >
                  <Filter size={16} />
                </button>
              </div>

              {showFilters && (
                <>
                  <div className="flex items-center gap-2">
                    <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      {t('tasks.status')}:
                    </label>
                    <select
                      value={filter.status || ''}
                      onChange={(e) => setFilter({ ...filter, status: e.target.value as Task['status'] || undefined })}
                      className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${theme === 'dark' ? 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:focus:ring-yellow-500' : ''}`}
                    >
                      <option value="">{t('tasks.all_status')}</option>
                      <option value="Open">{t('tasks.status_open')}</option>
                      <option value="In Progress">{t('tasks.status_in_progress')}</option>
                      <option value="Done">{t('tasks.status_done')}</option>
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
                      {t('common.filter')}
                    </button>
                  )}
                </>
              )}
            </div>
            {/* Theme Toggle & Language */}
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-3 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg transition-colors duration-200`}
                title="Toggle Dark Mode"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                <span className="hidden sm:inline">{theme === 'light' ? t('theme.dark') : t('theme.light')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
          {view === 'tree' ? (
            <div data-testid="tree-view-container" className="h-full overflow-auto p-6">
              <TaskTree
                nodes={filteredTaskTree as unknown as TaskNode[]}
                expandedNodes={expandedNodes}
                allTasks={tasks as unknown as TaskNode[]}
                onToggleExpand={toggleNodeExpansion}
                onStatusChange={handleStatusChange}
                onEdit={(task: TaskNode) => handleEditTask(task as unknown as Task)}
                onDelete={deleteTask}
                onAddChild={handleAddChild}
                onStartTimer={startTaskTimer}
                onPauseTimer={pauseTaskTimer}
                getElapsedTime={getElapsedTime}
                onTaskClick={handleTaskClick}
                showError={showError}
              />
            </div>
          ) : view === 'board' ? (
            <div data-testid="board-view-container" className="h-full overflow-auto">
              <TaskBoard
                tasks={filteredTasks}
                allTasks={tasks}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onDelete={deleteTask}
                onCreateTask={openCreateForm}
                onStartTimer={startTaskTimer}
                onPauseTimer={pauseTaskTimer}
                getElapsedTime={getElapsedTime}
                onTaskClick={handleTaskClick}
                showError={showError}
              />
            </div>
          ) : (
            <div data-testid="stats-view-container" className="h-full overflow-auto p-6">
              <TimeStatsView
                getTimeStatistics={async (period, startDate, endDate) => {
                  // Compute date range
                  const now = new Date();
                  let start: Date;
                  let end: Date = now;

                  if (period === 'custom' && startDate && endDate) {
                    start = startDate;
                    end = endDate;
                  } else if (period === 'day') {
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                  } else if (period === 'week') {
                    const dayOfWeek = now.getDay();
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
                  } else if (period === 'month') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                  } else {
                    // year
                    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                  }

                  // Try backend summary first
                  const resp = await taskService.getTimeSummary(start, end);
                  if (resp.data && Array.isArray(resp.data)) {
                    return resp.data.map((item) => ({
                      id: item.id,
                      title: item.title,
                      timeSpent: item.timeSpent,
                      status: item.status,
                      startDate: start.getTime(),
                      endDate: end.getTime()
                    }));
                  }

                  // Fallback to local computation from useTasks (offline or error)
                  const local = period === 'custom' && startDate && endDate
                    ? getTimeStatistics('custom', startDate, endDate)
                    : getTimeStatistics(period as 'day' | 'week' | 'month' | 'year');

                  return local.taskStats.map(item => ({
                    id: item.taskId,
                    title: item.title,
                    timeSpent: item.timeSpent,
                    status: 'Open', // Not relevant for charting here
                    startDate: (period === 'custom' && startDate) ? startDate.getTime() : start.getTime(),
                    endDate: (period === 'custom' && endDate) ? endDate.getTime() : end.getTime()
                  }));
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask}
        canComplete={editingTask ? canCompleteTask(editingTask, tasks) : true}
        parentId={parentId}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(undefined);
          setParentId(undefined);
        }}
        onSubmit={handleCreateTask}
        showError={showError}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTaskId ? getTaskById(selectedTaskId) || null : null}
        allTasks={tasks}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={(task) => {
          handleCloseDetailModal();
          handleEditTask(task);
        }}
        getElapsedTime={getElapsedTime}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title={t('errors.error_title')}
        message={errorMessage}
      />

      {/* Floating Help Button */}
      {isAuthenticated && <HelpFAB />}
    </div>
  );
}

const App = () => {
  const { isAuthenticated } = useAuth();

  // Handle unhandled promise rejections from Vercel Analytics
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress Vercel Analytics MessageChannel errors silently
      if (event.reason?.message?.includes('message channel closed')) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/" element={
            isAuthenticated ? (
              <MainApp />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
