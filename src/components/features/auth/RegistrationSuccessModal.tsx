import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { X, MailCheck } from 'lucide-react';
import BalloonBackground from '../../ui/BalloonBackground';

interface RegistrationSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
    isOpen,
    onClose,
    email
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
            <BalloonBackground />
            <div
                className={`relative w-full max-w-sm rounded-2xl shadow-2xl transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    } ${theme === 'dark'
                        ? 'bg-gray-900 border border-gray-800 text-gray-100'
                        : 'bg-white text-gray-900'
                    }`}
                role="dialog"
                aria-modal="true"
            >
                {/* Decorative top bar */}
                <div className={`h-1.5 w-full rounded-t-2xl ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}`} />

                <div className="p-8">
                    <button
                        onClick={() => {
                            setIsAnimating(false);
                            setTimeout(onClose, 300);
                        }}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors duration-200 ${theme === 'dark'
                            ? 'hover:bg-gray-800 text-gray-500 hover:text-gray-300'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                            }`}
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            <MailCheck size={32} className="animate-bounce" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-extrabold tracking-tight dark:text-white text-gray-900">
                                {t('auth.registration_success_title')}
                            </h2>
                            <p className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {t('auth.registration_success_desc')}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                {email}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={() => {
                                setIsAnimating(false);
                                setTimeout(onClose, 300);
                            }}
                            className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold transition-all duration-200 active:scale-95 ${theme === 'dark'
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                }`}
                        >
                            {t('auth.go_to_login')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
