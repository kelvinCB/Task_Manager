import { render, screen, fireEvent } from '@testing-library/react';
import { HoverBorderGradient } from '../../../components/ui/hover-border-gradient';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('HoverBorderGradient', () => {
  it('renders children correctly', () => {
    render(
      <HoverBorderGradient>
        <span>Test Button</span>
      </HoverBorderGradient>
    );
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('handles mouse enter and leave events', () => {
    render(
      <HoverBorderGradient>
        <span>Hover Me</span>
      </HoverBorderGradient>
    );
    
    const container = screen.getByRole('button', { name: /hover me/i });
    
    // Initial state (indirectly testing event handlers)
    fireEvent.mouseEnter(container);
    fireEvent.mouseLeave(container);
    
    // The test passes if no errors are thrown during these interactions
    expect(container).toBeInTheDocument();
  });

  it('renders as a custom tag', () => {
    const { container } = render(
      <HoverBorderGradient as="div">
        <span>Not a button</span>
      </HoverBorderGradient>
    );
    
    // Check if the outer tag is a div (excluding the internal divs)
    const outerElement = container.firstChild;
    expect(outerElement?.nodeName).toBe('DIV');
  });

  it('applies custom className and containerClassName', () => {
    render(
      <HoverBorderGradient 
        containerClassName="custom-container" 
        className="custom-inner"
      >
        <span>Styled</span>
      </HoverBorderGradient>
    );
    
    const innerDiv = screen.getByText('Styled').parentElement;
    expect(innerDiv).toHaveClass('custom-inner');
    
    const container = screen.getByRole('button');
    expect(container).toHaveClass('custom-container');
  });
});
