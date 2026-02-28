import { render, screen, fireEvent } from '@testing-library/react';
import { Pricing, Plan, CreditsPurchase } from './pricing';
import { vi, describe, it, expect } from 'vitest';

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  LazyMotion: ({ children }: any) => <>{children}</>,
  domAnimation: {},
  m: {
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
  observe() { }
  unobserve() { }
  disconnect() { }
};

// ... existing IntersectionObserver mock ...
// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  observe() { }
  unobserve() { }
  disconnect() { }
  takeRecords() { return []; }
  root = null;
  rootMargin = '';
  thresholds = [];
};

// Mock matchMedia
global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

const mockPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 10, yearly: 96 },
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

  it('renders Current Plan button when currentPlanId is provided', () => {
    render(<Pricing plans={mockPlans} currentPlanId="starter" />);

    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('Current Plan')).toBeDisabled();
    expect(screen.queryByText('Start Free Trial')).not.toBeInTheDocument();
  });

  it('renders correct prices', () => {
    render(<Pricing plans={mockPlans} />);

    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$99.00')).toBeInTheDocument();

    // Toggle to yearly
    const toggle = screen.getByLabelText(/annual billing/i);
    fireEvent.click(toggle);

    expect(screen.getByText('$96.00')).toBeInTheDocument();
  });

  it('renders CreditsPurchase elements correctly', () => {
    const mockOnCreditSelect = vi.fn();
    render(<CreditsPurchase onCreditSelect={mockOnCreditSelect} />);

    // Check for specific headings to avoid multiple match error
    expect(screen.getByRole('heading', { level: 2, name: /Credits/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Buy Credits/i })).toBeInTheDocument();

    // Check for other elements
    expect(screen.getByText(/Use crypto/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom/i)).toBeInTheDocument();

    // In mock setup, we might have keys like pricing.price_amount
    // Let's check for the button text specifically
    const buttons = screen.getAllByRole('button');
    const creditButtons = buttons.filter(b => b.textContent?.includes('pricing.price_amount') || b.textContent?.includes('$'));
    expect(creditButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(creditButtons[0]);
    expect(mockOnCreditSelect).toHaveBeenCalled();
  });
});
