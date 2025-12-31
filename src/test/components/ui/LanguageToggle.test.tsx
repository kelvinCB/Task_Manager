import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageToggle } from '../../../components/ui/LanguageToggle';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock react-i18next
const changeLanguageMock = vi.fn();
const tMock = vi.fn((key) => key);

const useTranslationMock = vi.fn().mockReturnValue({
    t: tMock,
    i18n: {
        language: 'en',
        changeLanguage: changeLanguageMock
    }
});

vi.mock('react-i18next', () => ({
    useTranslation: () => useTranslationMock()
}));

describe('LanguageToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly in English mode', () => {
        useTranslationMock.mockReturnValue({
            t: tMock,
            i18n: {
                language: 'en',
                changeLanguage: changeLanguageMock
            }
        });

        render(
            <ThemeProvider>
                <LanguageToggle />
            </ThemeProvider>
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: "United States Flag" })).toBeInTheDocument();
        expect(screen.getByText('EN')).toBeInTheDocument();
        expect(screen.getByTitle('Switch to Spanish')).toBeInTheDocument();
    });

    it('renders correctly in Spanish mode', () => {
        useTranslationMock.mockReturnValue({
            t: tMock,
            i18n: {
                language: 'es',
                changeLanguage: changeLanguageMock
            }
        });

        render(
            <ThemeProvider>
                <LanguageToggle />
            </ThemeProvider>
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: "Spain Flag" })).toBeInTheDocument();
        expect(screen.getByText('ES')).toBeInTheDocument();
        expect(screen.getByTitle('Switch to English')).toBeInTheDocument();
    });

    it('toggles language from English to Spanish when clicked', () => {
        useTranslationMock.mockReturnValue({
            t: tMock,
            i18n: {
                language: 'en',
                changeLanguage: changeLanguageMock
            }
        });

        render(
            <ThemeProvider>
                <LanguageToggle />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByRole('button'));
        expect(changeLanguageMock).toHaveBeenCalledWith('es');
    });

    it('toggles language from Spanish to English when clicked', () => {
        useTranslationMock.mockReturnValue({
            t: tMock,
            i18n: {
                language: 'es',
                changeLanguage: changeLanguageMock
            }
        });

        render(
            <ThemeProvider>
                <LanguageToggle />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByRole('button'));
        expect(changeLanguageMock).toHaveBeenCalledWith('en');
    });
});
