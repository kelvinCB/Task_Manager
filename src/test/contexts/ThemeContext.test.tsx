import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset html classes
    document.documentElement.classList.remove('light', 'dark');
  });

  describe('ThemeProvider', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with light theme by default', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should initialize with theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should toggle theme from light to dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should toggle theme from dark to light', () => {
      localStorage.setItem('theme', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem('theme')).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });
});
