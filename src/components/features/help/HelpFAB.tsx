import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { track } from '@vercel/analytics';
import HelpPanel from './HelpPanel';

const HelpFAB: React.FC = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                id="help-fab"
                onClick={() => {
                    const nextState = !isOpen;
                    setIsOpen(nextState);
                    track('fab_clicked');
                    if (nextState) {
                        track('help_opened');
                    }
                }}
                className={`fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[60] focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 ${isOpen ? 'rotate-[360deg] scale-110' : ''
                    }`}
                aria-label={t('help.fab_label')}
                title={t('help.fab_label')}
            >
                <HelpCircle className="w-7 h-7" />
                {!isOpen && (
                    <span className="absolute right-16 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block pointer-events-none shadow-lg">
                        {t('help.title')}
                    </span>
                )}
            </button>

            {isOpen && <HelpPanel onClose={() => setIsOpen(false)} />}
        </>
    );
};

export default HelpFAB;
