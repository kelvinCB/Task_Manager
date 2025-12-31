import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { USFlag, ESFlag } from './FlagIcons';

export const LanguageToggle: React.FC = () => {
    const { i18n } = useTranslation();
    const { theme } = useTheme();

    const toggleLanguage = () => {
        // Check if current language starts with 'en' (e.g. 'en', 'en-US', 'en-GB')
        const isEnglish = i18n.language?.startsWith('en');
        const newLang = isEnglish ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    const isEnglish = i18n.language?.startsWith('en');

    return (
        <button
            onClick={toggleLanguage}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200
        ${theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                }
      `}
            aria-label="Toggle language"
            title={isEnglish ? "Switch to Spanish" : "Switch to English"}
        >
            <span className="w-6 h-4 flex items-center justify-center overflow-hidden rounded shadow-sm">
                {isEnglish ? <USFlag className="w-full h-full object-cover" /> : <ESFlag className="w-full h-full object-cover" />}
            </span>
            <span className="text-sm font-medium">
                {isEnglish ? 'EN' : 'ES'}
            </span>
        </button>
    );
};
