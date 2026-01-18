import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

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
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/Avatar';
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

    // Mock Image to invoke onload immediately
    const originalImage = window.Image;
    beforeAll(() => {
        // @ts-ignore
        window.Image = class {
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;

            constructor() { }

            addEventListener(type: string, listener: () => void) {
                if (type === 'load') {
                    this.onload = listener;
                }
                if (type === 'error') {
                    this.onerror = listener;
                }
            }

            removeEventListener(_type: string, _listener: () => void) { }

            set src(_: string) {
                // Simulate async load
                setTimeout(() => {
                    if (this.onload) {
                        this.onload();
                    }
                }, 50);
            }
        };
    });

    afterAll(() => {
        window.Image = originalImage;
    });

    it('renders fallback when no image source is provided', () => {
        renderWithTheme(
            <Avatar>
                <AvatarFallback>K</AvatarFallback>
            </Avatar>
        );
        expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('renders image when source is provided', async () => {
        const url = 'http://example.com/avatar.png';
        renderWithTheme(
            <Avatar>
                <AvatarImage src={url} alt="Kelvin" />
                <AvatarFallback>K</AvatarFallback>
            </Avatar>
        );
        const img = await screen.findByRole('img');
        expect(img).toHaveAttribute('src', url);
        expect(img).toHaveAttribute('alt', 'Kelvin');
    });

    it('passes className correctly', () => {
        const { container } = renderWithTheme(
            <Avatar className="h-12 w-12" />
        );
        expect(container.firstChild).toHaveClass('h-12 w-12');
    });
});
