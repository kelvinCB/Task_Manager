import { describe, it, expect, vi } from 'vitest';

// Polyfill for crypto.getRandomValues if needed (for node environments in vitest)
if (typeof window !== 'undefined' && !window.crypto) {
    // @ts-ignore
    window.crypto = {
        getRandomValues: (arr: any) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
    };
}
import { render, screen } from '@testing-library/react';
import { Avatar } from '../../components/ui/Avatar';
import { ThemeContext } from '../../contexts/ThemeContext';

describe('Avatar Component', () => {
    const mockTheme = {
        theme: 'light' as const,
        toggleTheme: vi.fn()
    };

    const renderWithTheme = (ui: React.ReactElement) => {
        return render(
            <ThemeContext.Provider value={mockTheme}>
                {ui}
            </ThemeContext.Provider>
        );
    };

    it('renders initials when no avatarUrl is provided', () => {
        renderWithTheme(<Avatar username="Kelvin" />);
        expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('renders image when avatarUrl is provided', () => {
        const url = 'http://example.com/avatar.png';
        renderWithTheme(<Avatar username="Kelvin" avatarUrl={url} />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', url);
        expect(img).toHaveAttribute('alt', 'Kelvin');
    });

    it('applies a background color based on username when no image', () => {
        const { container } = renderWithTheme(<Avatar username="Kelvin" />);
        const avatarDiv = container.firstChild as HTMLElement;
        // We check if it has A background class (regex for bg-*-500)
        expect(avatarDiv.className).toMatch(/bg-[a-z]+-500/);
    });

    it('renders uppercase first letter of username', () => {
        renderWithTheme(<Avatar username="kelvinr02" />);
        expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('applies correct size classes', () => {
        const { container: containerSm } = renderWithTheme(<Avatar username="K" size="sm" />);
        expect(containerSm.firstChild).toHaveClass('w-8 h-8');

        const { container: containerXl } = renderWithTheme(<Avatar username="K" size="xl" />);
        expect(containerXl.firstChild).toHaveClass('w-24 h-24');
    });
});
