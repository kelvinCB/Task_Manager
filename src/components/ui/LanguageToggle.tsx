import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

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
            <span className="text-lg leading-none" role="img" aria-label={isEnglish ? "USA Flag" : "Spain Flag"}>
                {isEnglish ? '🇺🇸' : '🇪🇸'}
            </span>
            <span className="text-sm font-medium">
                {isEnglish ? 'EN' : 'ES'}
            </span>
        </button>
    );
};
