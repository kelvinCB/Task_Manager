import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { X, Lock, LogIn } from 'lucide-react';

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
    };

    const handleLogin = () => {
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
            navigate('/login');
        }, 300);
    };

    return (
        <div
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
            data-testid="auth-required-modal-overlay"
        >
            <div
                className={`relative w-full max-w-sm rounded-2xl shadow-2xl transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    } ${theme === 'dark'
                        ? 'bg-gray-900 border border-gray-800 text-gray-100'
                        : 'bg-white text-gray-900'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
                data-testid="auth-required-modal"
            >
                {/* Decorative top bar */}
                <div className={`h-1.5 w-full rounded-t-2xl ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}`} />

                <div className="p-8">
                    <button
                        onClick={handleClose}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors duration-200 ${theme === 'dark'
                            ? 'hover:bg-gray-800 text-gray-500 hover:text-gray-300'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                            }`}
                        aria-label="Close modal"
                        data-testid="auth-modal-close-button"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            <Lock size={32} className="animate-pulse" data-testid="auth-modal-icon" />
                        </div>

                        <div className="space-y-2">
                            <h2
                                id="auth-modal-title"
                                className="text-2xl font-extrabold tracking-tight"
                                data-testid="auth-modal-title"
                            >
                                {t('auth.auth_required_title')}
                            </h2>
                            <p
                                className={`text-base font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                data-testid="auth-modal-message"
                            >
                                {t('auth.auth_required_message')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleLogin}
                            className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold transition-all duration-200 active:scale-95 ${theme === 'dark'
                                ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                }`}
                            data-testid="auth-modal-login-button"
                        >
                            <LogIn size={18} />
                            {t('auth.login')}
                        </button>

                        <button
                            onClick={handleClose}
                            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${theme === 'dark'
                                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                            data-testid="auth-modal-cancel-button"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
