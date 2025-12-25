import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface AvatarProps {
    username: string;
    avatarUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onClick?: () => void;
}

const sizeConfig = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
};

// Generate a consistent color based on username
const getBackgroundColor = (username: string) => {
    const colors = [
        'bg-blue-500',
        'bg-indigo-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-green-500',
        'bg-teal-500',
        'bg-cyan-500',
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export const Avatar: React.FC<AvatarProps> = ({
    username,
    avatarUrl,
    size = 'md',
    className = '',
    onClick,
}) => {
    const { theme } = useTheme();
    const [imgError, setImgError] = React.useState(false);

    React.useEffect(() => {
        setImgError(false);
    }, [avatarUrl]);

    // Extract the first alphanumeric character as initial
    const getInitial = (name: string) => {
        const match = name.match(/[a-zA-Z0-9]/);
        return match ? match[0].toUpperCase() : name.charAt(0).toUpperCase();
    };

    const initials = getInitial(username);
    const bgColor = getBackgroundColor(username);
    const sizeClasses = sizeConfig[size];

    const showOriginalAvatar = avatarUrl && !imgError;

    const content = showOriginalAvatar ? (
        <img
            src={avatarUrl}
            alt={username}
            className="w-full h-full object-cover"
            onError={() => {
                const msg = 'No se pudo cargar la imagen de perfil';
                const desc = 'La imagen subida no es accesible. Verifique que el bucket "Avatars" sea PÚBLICO en Supabase.';
                console.error(`[Avatar Error] Failed to load for ${username}: ${avatarUrl}`);
                setImgError(true);

                // Show toast with high duration
                toast.error(msg, {
                    description: desc,
                    duration: 6000,
                    icon: <AlertCircle size={18} className="text-red-500" />
                });
            }}
        />
    ) : (
        <span className="font-bold text-white select-none">{initials}</span>
    );

    return (
        <div
            onClick={onClick}
            className={`
        relative flex items-center justify-center rounded-full overflow-hidden shrink-0
        ${showOriginalAvatar ? (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200') : bgColor}
        ${sizeClasses}
        ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
        ${className}
      `}
            title={username}
        >
            {content}
        </div>
    );
};
