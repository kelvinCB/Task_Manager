import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { USFlag, ESFlag } from '../../../components/ui/FlagIcons';

describe('FlagIcons', () => {
  describe('USFlag', () => {
    it('should render US flag SVG', () => {
      const { container } = render(<USFlag />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 640 480');
    });

    it('should have correct accessibility attributes', () => {
      const { container } = render(<USFlag />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('aria-label', 'United States Flag');
    });

    it('should apply custom className', () => {
      const { container } = render(<USFlag className="w-8 h-6" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-8', 'h-6');
    });

    it('should contain flag elements', () => {
      const { container } = render(<USFlag />);
      
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('ESFlag', () => {
    it('should render Spanish flag SVG', () => {
      const { container } = render(<ESFlag />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 640 480');
    });

    it('should have correct accessibility attributes', () => {
      const { container } = render(<ESFlag />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('aria-label', 'Spain Flag');
    });

    it('should apply custom className', () => {
      const { container } = render(<ESFlag className="w-8 h-6" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-8', 'h-6');
    });

    it('should contain flag colors and elements', () => {
      const { container } = render(<ESFlag />);
      
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
      
      // Check for red and yellow colors
      const redPath = Array.from(paths).find(path => 
        path.getAttribute('fill')?.includes('#aa151b')
      );
      const yellowPath = Array.from(paths).find(path => 
        path.getAttribute('fill')?.includes('#f1bf00')
      );
      
      expect(redPath).toBeInTheDocument();
      expect(yellowPath).toBeInTheDocument();
    });
  });
});
