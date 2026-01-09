import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Bug, Rocket, X, Send, ChevronRight, Search } from 'lucide-react';
import { helpService } from '../../../services/helpService';
import { toast } from 'sonner';
import { track } from '@vercel/analytics';
import { useAuth } from '../../../contexts/AuthContext';

interface HelpPanelProps {
    onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<'faq' | 'bug' | 'feature'>('faq');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsSubmitting(true);
        try {
            await helpService.submitRequest({
                description,
                type: activeTab as 'bug' | 'help' | 'feature',
                priority,
            }, session?.access_token);
            track('feature_requested', {
                type: activeTab,
                priority: priority,
                length: description.length
            });
            setShowSuccess(true);
            toast.success(t('help.success_msg'));
            setDescription('');
            // onClose(); // User requested to keep panel open
        } catch (error) {
            console.error(error);
            toast.error(t('help.error_msg'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset success message when typing new description or changing tabs
    React.useEffect(() => {
        if (description) setShowSuccess(false);
    }, [description]);

    React.useEffect(() => {
        setShowSuccess(false);
        setDescription('');
    }, [activeTab]);

    return (
        <div data-testid="help-panel" className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-primary-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold">
                    <HelpCircle className="w-5 h-5" />
                    <span>{t('help.title')}</span>
                </div>
                <button onClick={onClose} aria-label="Close help panel" className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('faq')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'faq' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Search className="w-4 h-4" />
                    {t('help.tab_faq')}
                </button>
                <button
                    onClick={() => setActiveTab('bug')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'bug' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Bug className="w-4 h-4" />
                    {t('help.tab_bug')}
                </button>
                <button
                    onClick={() => setActiveTab('feature')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'feature' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Rocket className="w-4 h-4" />
                    {t('help.tab_feature')}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'faq' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800/50">
                            <h3 className="font-semibold text-primary-800 dark:text-primary-300 mb-2">{t('help.faq_1_q')}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('help.faq_1_a')}</p>
                        </div>
                        <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800/50">
                            <h3 className="font-semibold text-primary-800 dark:text-primary-300 mb-2">{t('help.faq_2_q')}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('help.faq_2_a')}</p>
                        </div>
                    </div>
                )}

                {(activeTab === 'bug' || activeTab === 'feature') && (
                    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('help.description_label')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all h-32 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder={activeTab === 'bug' ? t('help.placeholder_bug') : t('help.placeholder_feature')}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('help.priority_label')}
                            </label>
                            <div className="flex gap-2">
                                {(['Low', 'Medium', 'High'] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${priority === p
                                            ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-500'
                                            }`}
                                    >
                                        {t(`help.priority_${p.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !description.trim()}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
                        >
                            {isSubmitting ? t('common.loading') : t('help.submit')}
                            {!isSubmitting && <Send className="w-4 h-4" />}
                        </button>

                        {showSuccess && (
                            <div data-testid="success-message" className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl animate-in fade-in slide-in-from-top-2">
                                <p className="text-sm text-green-700 dark:text-green-300 text-center font-medium">
                                    {t('help.submit_success')}
                                </p>
                            </div>
                        )}
                    </form>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-center">
                <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Kolium Help Center</p>
            </div>
        </div>
    );
};

export default HelpPanel;
