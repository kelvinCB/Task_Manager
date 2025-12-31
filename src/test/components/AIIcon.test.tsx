import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AIIcon } from '../../components/AIIcon';

describe('AIIcon', () => {
  it('should render with default props', () => {
    const { container } = render(<AIIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('should apply custom size', () => {
    const { container } = render(<AIIcon size={32} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('should apply custom className', () => {
    const { container } = render(<AIIcon className="custom-class" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should add pulse animation when animated is true', () => {
    const { container } = render(<AIIcon animated={true} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-pulse');
  });

  it('should not have animation class by default', () => {
    const { container } = render(<AIIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveClass('animate-pulse');
  });

  it('should contain gradient definitions', () => {
    const { container } = render(<AIIcon />);
    
    const gradients = container.querySelectorAll('linearGradient');
    expect(gradients.length).toBeGreaterThan(0);
    
    // Check for specific gradient IDs
    expect(container.querySelector('#mainStarGradient')).toBeInTheDocument();
    expect(container.querySelector('#smallStarGradient1')).toBeInTheDocument();
    expect(container.querySelector('#smallStarGradient2')).toBeInTheDocument();
  });

  it('should contain star paths', () => {
    const { container } = render(<AIIcon />);
    
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });
});
