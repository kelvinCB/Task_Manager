import React, { useState } from 'react';
import { TaskTimeStats } from '../types/Task';

interface TimeStatsViewProps {
  getTimeStatistics: (period: 'day' | 'week' | 'month' | 'year' | 'custom', startDate?: Date, endDate?: Date) => TaskTimeStats[];
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export const TimeStatsView: React.FC<TimeStatsViewProps> = ({ getTimeStatistics }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('day');
  const [stats, setStats] = useState<TaskTimeStats[]>([]);
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Cargar estadísticas al montar el componente y cuando cambia el periodo
  React.useEffect(() => {
    if (selectedPeriod === 'custom') {
      // Para el efecto inicial, no hacemos nada con custom hasta que el usuario haga clic en Apply
      // Solo inicializamos stats si no estamos en custom
    } else {
      const timeStats = getTimeStatistics(selectedPeriod as 'day' | 'week' | 'month' | 'year');
      setStats(timeStats);
    }
  }, [getTimeStatistics, selectedPeriod]);

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value as PeriodType);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStartDate(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndDate(event.target.value);
  };

  // Formato para la duración en horas:minutos:segundos (hh:mm:ss)
  const formatDuration = (ms: number) => {
    // Para los tests necesitamos formatear en hh:mm:ss
    const hours = Math.floor(ms / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Calcular tiempo total
  const totalTimeSpent = stats.reduce((acc, curr) => acc + curr.timeSpent, 0);

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">Time Statistics</h2>
      
      <div className="mb-4">
        <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">Period</label>
        <select 
          id="period"
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={selectedPeriod}
          onChange={handlePeriodChange}
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {selectedPeriod === 'custom' && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                id="start-date"
                type="date"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={customStartDate}
                onChange={handleStartDateChange}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                id="end-date"
                type="date"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={customEndDate}
                onChange={handleEndDateChange}
              />
            </div>
          </div>
          <button
            className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => {
              const start = new Date(customStartDate);
              const end = new Date(customEndDate);
              end.setHours(23, 59, 59, 999);
              const timeStats = getTimeStatistics('custom', start, end);
              setStats(timeStats);
            }}
          >
            Apply
          </button>
        </div>
      )}

      {stats.length === 0 ? (
        <>
          <p className="text-gray-500">No time tracking data</p>
          <div className="mb-4 mt-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Total time:</span>
              <span className="font-medium">00:00:00</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Total time:</span>
              <span className="font-medium">{formatDuration(totalTimeSpent)}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Tasks</h3>
            <ul className="space-y-2">
              {stats.map((task) => (
                <li key={task.id} className="flex justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{task.title}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      task.status === 'Done' ? 'bg-green-100 text-green-800' : 
                      task.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <span>{formatDuration(task.timeSpent)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
