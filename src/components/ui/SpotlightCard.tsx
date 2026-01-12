import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Color of the spotlight glow in HSL format (e.g., "150, 80%, 50%").
   * If not provided, defaults to theme-appropriate subtle colors.
   */
  spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ 
  children, 
  className = '', 
  spotlightColor,
  style,
  ...props 
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const { theme } = useTheme();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
    
    // Call original onMouseMove if provided
    props.onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setOpacity(0);
    // Call original onMouseLeave if provided
    props.onMouseLeave?.(e);
  };

  // Determine colors based on theme if not explicitly provided
  // We use CSS variables for masking, but here we can simulate the effect 
  // with a radial gradient background that sits on top or behind.
  // The CodePen example uses an overlay method. 
  // To keep it simple and contained in one component without global CSS:
  // We will add a 'before' pseudo-element equivalent via a nested div for the border glow
  // and an 'after' equivalent for the inner glow.
  
  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl border transition-colors duration-200 ${className}`}
      style={{
        ...style,
        // We use CSS variables to pass efficient dynamic values
        '--mouse-x': `${position.x}px`,
        '--mouse-y': `${position.y}px`,
        '--spotlight-opacity': opacity,
        '--spotlight-color': spotlightColor || (theme === 'dark' ? '255, 255, 255' : '0, 0, 0'),
      } as React.CSSProperties}
      {...props}
    >
      {/* 
        This internal div creates the "spotlight" effect using a radial gradient 
        that follows the mouse. 
      */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity: opacity,
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(var(--spotlight-color), ${theme === 'dark' ? '0.1' : '0.05'}), transparent 40%)`
        }}
        aria-hidden="true"
      />
      
      {/* 
         Optional: Border Highlight effect (subtle border glow)
         Using a separate overlay for the border integration
      */}
       <div 
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          opacity: opacity,
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(var(--spotlight-color), ${theme === 'dark' ? '0.15' : '0.1'}), transparent 40%)`
        }}
        aria-hidden="true"
      />

      <div className="relative h-full">
        {children}
      </div>
    </div>
  );
};
