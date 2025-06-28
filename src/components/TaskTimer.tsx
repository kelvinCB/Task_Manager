import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock } from 'lucide-react';

interface TaskTimerProps {
  taskId: string;
  isActive: boolean;
  elapsedTime: number; // en milisegundos
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
}

// Utilidad para formatear el tiempo en formato hh:mm:ss
const formatTime = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
};

export const TaskTimer: React.FC<TaskTimerProps> = ({ 
  taskId, 
  isActive, 
  elapsedTime, 
  onStart, 
  onPause 
}) => {
  const [currentTime, setCurrentTime] = useState(elapsedTime);

  // Actualizar el tiempo transcurrido si el temporizador está activo
  useEffect(() => {
    let interval: number | null = null;
    
    if (isActive) {
      interval = window.setInterval(() => {
        setCurrentTime(prevTime => prevTime + 1000); // Actualizar cada segundo
      }, 1000);
    } else {
      setCurrentTime(elapsedTime); // Sincronizar con el tiempo externo cuando se pausa
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, elapsedTime]);

  return (
    <div className="flex items-center space-x-2 text-sm">
      <Clock className="w-4 h-4 text-gray-500" />
      <span className={`font-mono ${isActive ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
        {formatTime(currentTime)}
      </span>
      {isActive ? (
        <button 
          onClick={() => onPause(taskId)}
          className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition-all"
          title="Pausar cronómetro"
        >
          <Pause className="w-4 h-4" />
        </button>
      ) : (
        <button 
          onClick={() => onStart(taskId)}
          className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-all"
          title="Iniciar cronómetro"
        >
          <Play className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
