import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { X, AlertCircle } from 'lucide-react';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    showDoNotShowAgain?: boolean;
    onDoNotShowAgainChange?: (checked: boolean) => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    showDoNotShowAgain = false,
    onDoNotShowAgainChange
}) => {
    const { theme } = useTheme();
    const [isAnimating, setIsAnimating] = useState(false);
    const [doNotShowAgain, setDoNotShowAgain] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (showDoNotShowAgain && onDoNotShowAgainChange) {
            onDoNotShowAgainChange(doNotShowAgain);
        }
        setIsAnimating(false);
        setTimeout(onClose, 300);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDoNotShowAgain(e.target.checked);
    };

    return (
        <div
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
            data-testid="error-modal-overlay"
        >
            <div
                className={`relative w-full max-w-sm rounded-2xl shadow-2xl transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    } ${theme === 'dark'
                        ? 'bg-gray-900 border border-gray-800 text-gray-100'
                        : 'bg-white text-gray-900'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="error-modal-title"
                data-testid="error-modal"
            >
                {/* Decorative top bar - Red/Orange for errors */}
                <div className={`h-1.5 w-full rounded-t-2xl ${theme === 'dark' ? 'bg-red-500' : 'bg-red-600'}`} />

                <div className="p-8">
                    <button
                        onClick={handleClose}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors duration-200 ${theme === 'dark'
                            ? 'hover:bg-gray-800 text-gray-500 hover:text-gray-300'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                            }`}
                        aria-label="Close modal"
                        data-testid="error-modal-close-button"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600'
                            }`}>
                            <AlertCircle size={32} className="animate-pulse" data-testid="error-modal-icon" />
                        </div>

                        <div className="space-y-2">
                            <h2
                                id="error-modal-title"
                                className="text-2xl font-extrabold tracking-tight"
                                data-testid="error-modal-title"
                            >
                                {title}
                            </h2>
                            <p
                                className={`text-base font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                data-testid="error-modal-message"
                            >
                                {message}
                            </p>
                        </div>
                    </div>

                    {showDoNotShowAgain && (
                        <div className="mt-6 flex items-center justify-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={doNotShowAgain}
                                    onChange={handleCheckboxChange}
                                    className={`w-4 h-4 rounded border-2 ${theme === 'dark'
                                            ? 'border-gray-600 bg-gray-800 checked:bg-red-500 checked:border-red-500'
                                            : 'border-gray-300 bg-white checked:bg-red-600 checked:border-red-600'
                                        } focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors`}
                                    data-testid="error-modal-checkbox"
                                />
                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Do not show this message again
                                </span>
                            </label>
                        </div>
                    )}

                    <div className="mt-8">
                        <button
                            onClick={handleClose}
                            className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold transition-all duration-200 active:scale-95 ${theme === 'dark'
                                ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                }`}
                            data-testid="error-modal-ok-button"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
