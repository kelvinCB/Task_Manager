import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskIdBadge } from '../../../components/ui/TaskIdBadge';
import { ThemeProvider } from '../../../contexts/ThemeContext';

describe('TaskIdBadge', () => {
  it('renders the task id with a # prefix', () => {
    render(
      <ThemeProvider>
        <TaskIdBadge id="123" />
      </ThemeProvider>
    );
    expect(screen.getByText('#123')).toBeDefined();
  });

  it('renders nothing if id is undefined', () => {
    const { container } = render(
      <ThemeProvider>
        <TaskIdBadge id={undefined} />
      </ThemeProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('applies correct size classes', () => {
    const { container: xsContainer } = render(
      <ThemeProvider>
        <TaskIdBadge id="1" size="xs" />
      </ThemeProvider>
    );
    expect(xsContainer.querySelector('.text-\\[10px\\]')).toBeDefined();

    const { container: lgContainer } = render(
      <ThemeProvider>
        <TaskIdBadge id="1" size="lg" />
      </ThemeProvider>
    );
    expect(lgContainer.querySelector('.text-lg')).toBeDefined();
  });
});
