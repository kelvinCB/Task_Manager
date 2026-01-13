import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HelpFAB from '../../../../components/features/help/HelpFAB';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock HelpPanel to avoid complex dependencies in FAB test
vi.mock('../../../../components/features/help/HelpPanel', () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="mock-help-panel">
            <button onClick={onClose}>Close from Panel</button>
        </div>
    ),
}));

// Mock analytics
vi.mock('@vercel/analytics', () => ({
    track: vi.fn(),
}));

describe('HelpFAB', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the floating action button', () => {
        render(<HelpFAB />);
        expect(screen.getByRole('button', { name: 'help.fab_label' })).toBeInTheDocument();
    });

    it('opens the help panel and showing backdrop when clicked', () => {
        render(<HelpFAB />);
        const fab = screen.getByRole('button', { name: 'help.fab_label' });
        
        fireEvent.click(fab);
        
        expect(screen.getByTestId('mock-help-panel')).toBeInTheDocument();
        // The backdrop should be there (it's a div with no text, so we check by role or class if possible)
        // We can use a testid or just check for the element. Let's add a testid in the code if needed or check by attribute.
        // Actually, let's look for a div with the backdrop class.
        const backdrop = document.querySelector('.backdrop-blur-md');
        expect(backdrop).toBeInTheDocument();
    });

    it('closes the help panel when backdrop is clicked', () => {
        render(<HelpFAB />);
        const fab = screen.getByRole('button', { name: 'help.fab_label' });
        
        fireEvent.click(fab); // Open
        expect(screen.getByTestId('mock-help-panel')).toBeInTheDocument();
        
        const backdrop = document.querySelector('.backdrop-blur-md');
        if (backdrop) {
            fireEvent.click(backdrop);
        }
        
        expect(screen.queryByTestId('mock-help-panel')).not.toBeInTheDocument();
    });
});
