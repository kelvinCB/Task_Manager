import React, { useState, useEffect } from 'react';
import { TaskTimeStats } from '../types/Task';
import { BarChart } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TimeStatsViewProps {
  getTimeStatistics: (period: 'day' | 'week' | 'month' | 'year' | 'custom', startDate?: Date, endDate?: Date) => TaskTimeStats[];
}

export const TimeStatsView: React.FC<TimeStatsViewProps> = ({ getTimeStatistics }) => {
  const { theme } = useTheme();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [stats, setStats] = useState<TaskTimeStats[]>([]);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (isCustom && customStart && customEnd) {
      const timeStats = getTimeStatistics('custom', new Date(customStart), new Date(customEnd));
      setStats(timeStats);
    } else {
      const timeStats = getTimeStatistics(period);
      setStats(timeStats);
    }
  }, [period, customStart, customEnd, isCustom, getTimeStatistics]);

  // Format time from milliseconds to readable format
  const formatTime = (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Calculate percentage for chart
  const calculatePercentage = (timeSpent: number) => {
    const totalTimeSpent = stats.reduce((acc, curr) => acc + curr.timeSpent, 0);
    if (totalTimeSpent === 0) return 0;
    return (timeSpent / totalTimeSpent) * 100;
  };

  return (
    <div className={`h-full overflow-auto ${theme === 'dark' ? 'bg-gray-800' : ''}`}>
      <div className={`rounded-lg shadow-sm p-6 m-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Time Tracking Statistics</h2>

          <div className="flex items-center gap-4">
            <div className="flex">
              <button
                onClick={() => { setPeriod('day'); setIsCustom(false); }}
                className={`px-3 py-1 text-sm border-t border-b border-l rounded-l-lg ${period === 'day' && !isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
              >
                Today
              </button>
              <button
                onClick={() => { setPeriod('week'); setIsCustom(false); }}
                className={`px-3 py-1 text-sm border-t border-b ${period === 'week' && !isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
              >
                This Week
              </button>
              <button
                onClick={() => { setPeriod('month'); setIsCustom(false); }}
                className={`px-3 py-1 text-sm border-t border-b ${period === 'month' && !isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
              >
                This Month
              </button>
              <button
                onClick={() => { setPeriod('year'); setIsCustom(false); }}
                className={`px-3 py-1 text-sm border-t border-b border-r rounded-r-lg ${period === 'year' && !isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
              >
                This Year
              </button>
            </div>

            <button
              onClick={() => setIsCustom(!isCustom)}
              className={`px-3 py-1 text-sm rounded-lg border ${isCustom ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
            >
              Custom
            </button>
          </div>
        </div>

        {isCustom && (
          <div className="flex gap-4 mb-6">
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-600 text-gray-100 border-gray-500' : 'bg-white text-gray-900 border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-1`}>End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-600 text-gray-100 border-gray-500' : 'bg-white text-gray-900 border-gray-300'}`}
              />
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Total Time Spent</h3>
            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{formatTime(stats.reduce((acc, curr) => acc + curr.timeSpent, 0))}</span>
          </div>
        </div>

        {stats.length > 0 ? (
          <div>
            <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Time by Task</h3>
            <div className="space-y-4">
              {stats.map(task => (
                <div key={task.id} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-50'}`}>
                  <div className="flex justify-between mb-1">
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{task.title}</h4>
                    <span className={theme === 'dark' ? 'text-gray-200' : ''}>{formatTime(task.timeSpent)}</span>
                  </div>
                  <div className={`w-full rounded-full h-2.5 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
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
            <BarChart size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-300'}`} />
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>No time tracking data available for this period.</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>Start tracking time on your tasks to see statistics here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
