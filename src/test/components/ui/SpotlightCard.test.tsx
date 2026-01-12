import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpotlightCard } from '../../../components/ui/SpotlightCard';
import { ThemeProvider } from '../../../contexts/ThemeContext';

describe('SpotlightCard', () => {
  const renderWithTheme = (component: React.ReactNode) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  it('renders children correctly', () => {
    renderWithTheme(
      <SpotlightCard>
        <div data-testid="child-content">Child Content</div>
      </SpotlightCard>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('applies custom class names', () => {
    renderWithTheme(
      <SpotlightCard className="custom-class">
        <div>Content</div>
      </SpotlightCard>
    );
    // Find the outer div which should have the custom class
    // We look for text 'Content' and get its parent's parent (since we have wrapper divs inside)
    // Or better, just inspect the container.
    const content = screen.getByText('Content');
    // The structure is outer div > inner spotlight divs > content wrapper > children
    // So we search for the custom class in the rendered hierarchy
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('updates CSS variables on mouse move', () => {
    renderWithTheme(
      <SpotlightCard data-testid="spotlight-card">
        <div>Content</div>
      </SpotlightCard>
    );

    const card = screen.getByTestId('spotlight-card');
    
    // Simulate mouse move
    fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
    
    // Check if style attribute contains the updated variables
    // Note: detailed bounding client rect mocking might be needed for exact values,
    // but we can check if the event handler fired and updated state/style.
    expect(card).toHaveStyle({
      '--spotlight-opacity': '1'
    });
  });

  it('resets opacity on mouse leave', () => {
    renderWithTheme(
      <SpotlightCard data-testid="spotlight-card">
        <div>Content</div>
      </SpotlightCard>
    );

    const card = screen.getByTestId('spotlight-card');
    
    // Move in then out
    fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
    fireEvent.mouseLeave(card);

    expect(card).toHaveStyle({
      '--spotlight-opacity': '0'
    });
  });

  it('uses custom spotlight color if provided', () => {
    const customColor = '100, 50%, 50%';
    renderWithTheme(
      <SpotlightCard data-testid="spotlight-card" spotlightColor={customColor}>
        <div>Content</div>
      </SpotlightCard>
    );

    const card = screen.getByTestId('spotlight-card');
    expect(card).toHaveStyle({
      '--spotlight-color': customColor
    });
  });
});
