import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { X, LogIn, UserPlus, Sparkles } from 'lucide-react';

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionType: 'export' | 'import' | 'ai';
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
    isOpen,
    onClose,
    actionType
}) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLogin = () => {
        navigate('/login');
        onClose();
    };

    const handleRegister = () => {
        navigate('/register');
        onClose();
    };

    const getMessage = () => {
        if (actionType === 'ai') {
            return "Unlock the power of AI to supercharge your productivity. Please sign in to use AI features.";
        }
        return `Please sign in to ${actionType} your tasks and keep everything in sync.`;
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
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
                <div className={`h-1.5 w-full rounded-t-2xl ${theme === 'dark' ? 'bg-yellow-500' : 'bg-indigo-600'}`} />

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
                        <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            <Sparkles size={32} className="animate-pulse" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-extrabold tracking-tight">
                                {actionType === 'ai' ? 'Unlock AI Power' : 'Unlock Full Potential'}
                            </h2>
                            <p className={`text-base font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {getMessage()}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleLogin}
                            className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold transition-all duration-200 active:scale-95 ${theme === 'dark'
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                }`}
                        >
                            <LogIn size={20} />
                            Log In
                        </button>
                        <button
                            onClick={handleRegister}
                            className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold transition-all duration-200 active:scale-95 ${theme === 'dark'
                                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                        >
                            <UserPlus size={20} />
                            Create Account
                        </button>
                        <button
                            onClick={() => {
                                setIsAnimating(false);
                                setTimeout(onClose, 300);
                            }}
                            className={`w-full py-3 text-sm font-semibold transition-colors duration-200 ${theme === 'dark'
                                ? 'text-gray-500 hover:text-gray-400'
                                : 'text-gray-400 hover:text-gray-500'
                                }`}
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
