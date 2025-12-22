import React from 'react';
import { Attachment } from '../utils/attachmentUtils';
import { FileText, Image, Film, Download, Trash2, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AttachmentListProps {
    attachments: Attachment[];
    readonly?: boolean;
    onDelete?: (index: number) => void;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
    attachments,
    readonly = false,
    onDelete
}) => {
    const { theme } = useTheme();

    if (attachments.length === 0) return null;

    const getIcon = (type: Attachment['type']) => {
        switch (type) {
            case 'image': return <Image size={20} className="text-purple-500" />;
            case 'video': return <Film size={20} className="text-pink-500" />;
            default: return <FileText size={20} className="text-blue-500" />;
        }
    };

    return (
        <div className="space-y-3">
            {attachments.map((att, index) => (
                <div
                    key={`${att.name}-${index}`}
                    data-testid="attachment-item"
                    className={`group flex items-center p-3 rounded-lg border transition-all duration-200 ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-indigo-200'
                        }`}
                >
                    {/* Icon / Preview */}
                    <div className={`p-2 rounded-lg mr-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                        {att.type === 'image' ? (
                            <img
                                src={att.url}
                                alt={att.name}
                                className="w-10 h-10 object-cover rounded"
                                onError={(e) => {
                                    // Fallback to icon if load fails
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.querySelector('svg')?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        {/* Fallback Icon (hidden if image loads successfully) */}
                        <div className={`${att.type === 'image' ? 'hidden' : 'block'}`}>
                            {getIcon(att.type)}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 mr-3">
                        <h4 className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                            {att.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                {att.type}
                            </span>
                            <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="attachment-view-link"
                                className={`text-xs flex items-center gap-1 hover:underline ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                                    }`}
                            >
                                View <ExternalLink size={10} />
                            </a>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <a
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="attachment-download-btn"
                            className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}
                            title="Download"
                        >
                            <Download size={16} />
                        </a>

                        {!readonly && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(index)}
                                data-testid="attachment-delete-btn"
                                className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                                    }`}
                                title="Remove attachment"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
