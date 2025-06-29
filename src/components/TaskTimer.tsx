import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

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

// Utilidad para reproducir un sonido corto de notificación
const playNotificationSound = () => {
  try {
    // Crear un contexto de audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Crear un oscilador para generar un tono
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configurar el oscilador
    oscillator.type = 'sine'; // Tipo de onda sinusoidal (suave)
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime); // Frecuencia en Hz
    
    // Configurar el volumen y la duración
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime); // Volumen más alto (0.4 en lugar de 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.0); // Fade out durante 2 segundos
    
    // Conectar los nodos
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Reproducir el sonido
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2.0); // Duración de 2 segundos
  } catch (error) {
    console.error('Error al reproducir el sonido:', error);
  }
};

export const TaskTimer: React.FC<TaskTimerProps> = ({ 
  taskId, 
  isActive, 
  elapsedTime, 
  onStart, 
  onPause 
}) => {
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(elapsedTime);
  const lastNotificationTimeRef = useRef(0);

  // Actualizar el tiempo transcurrido si el temporizador está activo
  useEffect(() => {
    let interval: number | null = null;
    
    if (isActive) {
      interval = window.setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 1000; // Actualizar cada segundo
          
          // Verificar si debemos reproducir un sonido (cada 10 minutos)
          const tenMinutesInMs = 10 * 60 * 1000;
          const previousMinutes = Math.floor(prevTime / tenMinutesInMs);
          const currentMinutes = Math.floor(newTime / tenMinutesInMs);
          
          if (currentMinutes > previousMinutes) {
            // Solo reproducir si ha pasado al menos 9 minutos desde la última notificación
            // Esto previene notificaciones múltiples si hay varios temporizadores activos
            const now = Date.now();
            if (now - lastNotificationTimeRef.current > 9 * 60 * 1000) {
              playNotificationSound();
              lastNotificationTimeRef.current = now;
            }
          }
          
          return newTime;
        });
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
      <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
      <span className={`font-mono ${isActive 
        ? (theme === 'dark' ? 'text-green-400 font-bold' : 'text-green-600 font-bold')
        : (theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}`}>
        {formatTime(currentTime)}
      </span>
      {isActive ? (
        <button 
          onClick={() => onPause(taskId)}
          className={`p-1 ${theme === 'dark' 
            ? 'text-orange-400 hover:text-orange-300 hover:bg-gray-700' 
            : 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'} rounded transition-all`}
          title="Pausar cronómetro"
        >
          <Pause className="w-4 h-4" />
        </button>
      ) : (
        <button 
          onClick={() => onStart(taskId)}
          className={`p-1 ${theme === 'dark' 
            ? 'text-green-400 hover:text-green-300 hover:bg-gray-700' 
            : 'text-green-500 hover:text-green-700 hover:bg-green-50'} rounded transition-all`}
          title="Iniciar cronómetro"
        >
          <Play className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
