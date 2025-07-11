import React from 'react';

interface AIIconProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export const AIIcon: React.FC<AIIconProps> = ({ 
  size = 24, 
  className = '',
  animated = false 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={`${className} ${animated ? 'animate-pulse' : ''}`}
      fill="none"
    >
      {/* Large central 4-pointed star with vibrant gradient */}
      <path 
        d="M12 1C12.3 1 12.6 1.2 12.7 1.5L14 6.8L19.3 8.1C19.6 8.2 19.8 8.5 19.8 8.8C19.8 9.1 19.6 9.4 19.3 9.5L14 10.8L12.7 16.1C12.6 16.4 12.3 16.6 12 16.6C11.7 16.6 11.4 16.4 11.3 16.1L10 10.8L4.7 9.5C4.4 9.4 4.2 9.1 4.2 8.8C4.2 8.5 4.4 8.2 4.7 8.1L10 6.8L11.3 1.5C11.4 1.2 11.7 1 12 1Z"
        fill="url(#smallStarGradient1)"
        className="drop-shadow-md"
      /	>
      
      {/* Small top-right 4-pointed star */}
      <path 
        d="M18.5 2.8C18.7 2.8 18.9 3 18.9 3.2L19.5 5.2L21.5 5.8C21.7 5.8 21.9 6 21.9 6.2C21.9 6.4 21.7 6.6 21.5 6.6L19.5 7.2L18.9 9.2C18.9 9.4 18.7 9.6 18.5 9.6C18.3 9.6 18.1 9.4 18.1 9.2L17.5 7.2L15.5 6.6C15.3 6.6 15.1 6.4 15.1 6.2C15.1 6 15.3 5.8 15.5 5.8L17.5 5.2L18.1 3.2C18.1 3 18.3 2.8 18.5 2.8Z"
        fill="url(#mainStarGradient)"
        className="drop-shadow-sm"
      /	>
      
      {/* Small bottom-right 4-pointed star */}
      <path 
        d="M19 14.8C19.2 14.8 19.4 15 19.4 15.2L19.8 16.8L21.4 17.2C21.6 17.2 21.8 17.4 21.8 17.6C21.8 17.8 21.6 18 21.4 18L19.8 18.4L19.4 20C19.4 20.2 19.2 20.4 19 20.4C18.8 20.4 18.6 20.2 18.6 20L18.2 18.4L16.6 18C16.4 18 16.2 17.8 16.2 17.6C16.2 17.4 16.4 17.2 16.6 17.2L18.2 16.8L18.6 15.2C18.6 15 18.8 14.8 19 14.8Z"
        fill="url(#smallStarGradient2)"
        className="drop-shadow-sm"
      />
      
      
      {/* Gradient definitions */}
      <defs>
        {/* Main star gradient - Purple to Pink to Blue */}
        <linearGradient id="mainStarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        
        {/* Small star gradients - Cyan to Purple */}
        <linearGradient id="smallStarGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        
        {/* Small star gradients - Blue to Pink */}
        <linearGradient id="smallStarGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        
        {/* Plus gradient - Yellow to Orange */}
        <linearGradient id="plusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
};
