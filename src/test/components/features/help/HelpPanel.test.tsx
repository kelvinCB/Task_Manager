import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HelpPanel from '../../../../components/features/help/HelpPanel';
import { helpService } from '../../../../services/helpService';
import { toast } from 'sonner';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'help.title') return 'Help & Feedback';
            if (key === 'help.submit') return 'Submit';
            if (key === 'common.loading') return 'Loading...';
            if (key === 'help.tab_faq') return 'FAQ';
            if (key === 'help.tab_bug') return 'Bug';
            if (key === 'help.tab_feature') return 'Feature';
            if (key === 'help.submit_success') return 'Submission Successful Message';
            return key;
        },
    }),
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock helpService
vi.mock('../../../../services/helpService', () => ({
    helpService: {
        submitRequest: vi.fn(),
    },
}));

// Mock AuthContext
vi.mock('../../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        session: { access_token: 'mock-token' },
        user: { id: 'mock-user-id', email: 'test@example.com' },
        isAuthenticated: true,
    }),
}));

describe('HelpPanel', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders FAQ by default', () => {
        render(<HelpPanel onClose={mockOnClose} />);
        expect(screen.getByText('Help & Feedback')).toBeInTheDocument();
        expect(screen.getByText('FAQ')).toBeInTheDocument();
        expect(screen.getByText('help.faq_1_q')).toBeInTheDocument();
    });

    it('switches to Bug report tab', () => {
        render(<HelpPanel onClose={mockOnClose} />);
        fireEvent.click(screen.getByText('Bug'));
        expect(screen.getByText('help.description_label')).toBeInTheDocument();
    });

    it('submits a feature request successfully', async () => {
        (helpService.submitRequest as any).mockResolvedValue({ success: true });

        render(<HelpPanel onClose={mockOnClose} />);
        fireEvent.click(screen.getByText('Feature'));

        const textarea = screen.getByPlaceholderText('help.placeholder_feature');
        fireEvent.change(textarea, { target: { value: 'New awesome feature' } });

        const submitBtn = screen.getByText('Submit');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(helpService.submitRequest).toHaveBeenCalledWith({
                description: 'New awesome feature',
                type: 'feature',
                priority: 'Medium',
            }, 'mock-token');
            expect(toast.success).toHaveBeenCalledWith('help.success_msg');
            // Panel should NOT close
            expect(mockOnClose).not.toHaveBeenCalled();
            // Success text should be visible
            expect(screen.getByText('Submission Successful Message')).toBeInTheDocument();
            // Textarea should be cleared
            expect(textarea).toHaveValue('');
        });
    });

    it('shows error toast on failure', async () => {
        (helpService.submitRequest as any).mockRejectedValue(new Error('API Error'));

        render(<HelpPanel onClose={mockOnClose} />);
        fireEvent.click(screen.getByText('Bug'));

        const textarea = screen.getByPlaceholderText('help.placeholder_bug');
        fireEvent.change(textarea, { target: { value: 'Crash on login' } });

        const submitBtn = screen.getByText('Submit');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('help.error_msg');
        });
    });
});
