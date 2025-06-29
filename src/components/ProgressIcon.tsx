import React from 'react';

interface ProgressIconProps {
  size?: number;
  className?: string;
  progress?: number; // 0-100, defaults to 75
}

export const ProgressIcon: React.FC<ProgressIconProps> = ({ 
  size = 24, 
  className = '',
  progress = 75 
}) => {
  // Calculate stroke-dasharray for the progress circle
  const radius = 7; // Radius of the progress circle
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={className}
      fill="none"
    >
      {/* Background circle */}
      <circle 
        cx="12" 
        cy="12" 
        r="11" 
        fill="currentColor" 
        opacity="0.1"
      />
      
      {/* Progress track (background) */}
      <circle 
        cx="12" 
        cy="12" 
        r="7" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        opacity="0.3"
      />
      
      {/* Progress circle (completed portion) */}
      <circle 
        cx="12" 
        cy="12" 
        r="7" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        strokeDasharray={strokeDasharray}
        strokeDashoffset="0" 
        strokeLinecap="round" 
        transform="rotate(-90 12 12)"
      />
      
      {/* Central checkmark */}
      <circle 
        cx="12" 
        cy="12" 
        r="4.5" 
        fill="currentColor" 
        opacity="0.9"
      />
      
      <path 
        d="M9.5 12 L11 13.5 L14.5 10" 
        stroke="white" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};
