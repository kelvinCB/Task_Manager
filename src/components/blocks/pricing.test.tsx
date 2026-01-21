import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pricing, Plan } from './pricing';
import { vi } from 'vitest';

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick }: any) => (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    ),
  },
}));

// Mock NumberFlow
vi.mock('@number-flow/react', () => ({
  default: ({ value, format }: any) => <span>{new Intl.NumberFormat('en-US', format).format(value)}</span>,
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ... existing IntersectionObserver mock ...
// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = '';
  thresholds = [];
};

// Mock matchMedia
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

const mockPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 0, yearly: 0 },
    features: ['Unique Feature 1'],
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: { monthly: 99, yearly: 990 },
    features: ['Unique Feature 2', 'Unique Feature 3'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 299, yearly: 2990 },
    features: ['Enterprise Feature'],
    recommended: false,
  }
];

describe('Pricing Component', () => {
  it('renders plans correctly', () => {
    render(<Pricing plans={mockPlans} />);
    
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Unique Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Feature')).toBeInTheDocument();
  });

  it('renders correct buttons', () => {
    render(<Pricing plans={mockPlans} />);
    
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Contact Sales')).toBeInTheDocument();
  });

  it('renders Popular badge for recommended plan', () => {
    render(<Pricing plans={mockPlans} />);
    
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });
});
