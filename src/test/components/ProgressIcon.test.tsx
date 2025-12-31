import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressIcon } from '../../components/ProgressIcon';

describe('ProgressIcon', () => {
  it('should render with default props', () => {
    const { container } = render(<ProgressIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('should apply custom size', () => {
    const { container } = render(<ProgressIcon size={48} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('should apply custom className', () => {
    const { container } = render(<ProgressIcon className="text-blue-500" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-blue-500');
  });

  it('should use default progress of 75%', () => {
    const { container } = render(<ProgressIcon />);
    
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('should accept custom progress value', () => {
    const { container } = render(<ProgressIcon progress={50} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // The circle with strokeDasharray should exist
    const progressCircle = Array.from(container.querySelectorAll('circle')).find(
      circle => circle.hasAttribute('stroke-dasharray')
    );
    expect(progressCircle).toBeInTheDocument();
  });

  it('should contain background circle', () => {
    const { container } = render(<ProgressIcon />);
    
    const backgroundCircle = Array.from(container.querySelectorAll('circle')).find(
      circle => circle.getAttribute('r') === '11'
    );
    expect(backgroundCircle).toBeInTheDocument();
  });

  it('should contain progress circle with transform', () => {
    const { container } = render(<ProgressIcon />);
    
    const progressCircle = Array.from(container.querySelectorAll('circle')).find(
      circle => circle.hasAttribute('transform')
    );
    expect(progressCircle).toBeInTheDocument();
    expect(progressCircle).toHaveAttribute('transform', 'rotate(-90 12 12)');
  });

  it('should contain checkmark path', () => {
    const { container } = render(<ProgressIcon />);
    
    const checkmark = container.querySelector('path[stroke="white"]');
    expect(checkmark).toBeInTheDocument();
  });
});
