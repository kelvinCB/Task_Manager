import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Upload,
  ChevronDown,
  LogIn,
  LogOut,
  Camera,
  User
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { Avatar } from '../../ui/Avatar';
import { AuthRequiredModal } from './AuthRequiredModal';
import ImageCropModal from './ImageCropModal';
import { toast } from 'sonner';

interface AccountMenuProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  compact?: boolean;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  onExport,
  onImport,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const { profile, uploadAvatar } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionType, setAuthActionType] = useState<'export' | 'import'>('export');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogin = () => {
    navigate('/login');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsOpen(false);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('account.image_too_large'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setUploadError(null);
        setSelectedImage(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);

      // Reset input
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setIsUploading(true);
      setUploadError(null);

      // Convert Blob to File
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      await uploadAvatar(file);

      setIsCropModalOpen(false);
      setSelectedImage(null);
      toast.success(t('account.upload_success'));
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      const errorMessage = err.message || t('account.upload_error');
      setUploadError(errorMessage);
      toast.error(t('common.error'), {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        data-testid="account-menu-button"
        className={`
          flex items-center ${compact ? 'p-2' : 'gap-2 px-4 py-2'} rounded-lg transition-all duration-200
          ${theme === 'dark'
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
          }
          ${isOpen ? (theme === 'dark' ? 'ring-2 ring-yellow-500' : 'ring-2 ring-indigo-500') : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={t('account.my_account')}
      >
        {isAuthenticated && profile ? (
          <Avatar
            username={profile.display_name || profile.username}
            avatarUrl={profile.avatar_url}
            size={compact ? 'sm' : 'sm'}
            className={isOpen ? (theme === 'dark' ? 'ring-2 ring-yellow-500' : 'ring-2 ring-indigo-500') : ''}
          />
        ) : (
          <div className={`
                flex items-center justify-center rounded-full shrink-0
                ${compact ? 'w-8 h-8' : 'w-8 h-8'}
                ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}
              `}>
            <User size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} />
          </div>
        )}
        {!compact && (
          <>
            <span className="hidden sm:inline">{t('account.my_account')}</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={`
          absolute right-0 top-full mt-2 w-64 rounded-xl shadow-2xl overflow-hidden py-1 z-50
          animate-in fade-in slide-in-from-top-2 duration-200
          max-h-[calc(100vh-100px)] overflow-y-auto
          ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
        `}>
          <div className="py-1" role="menu" aria-orientation="vertical">
            {/* User info section - only show when authenticated */}
            {isAuthenticated && profile && (
              <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                  <div
                    className="relative group cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <Avatar
                      username={profile.display_name || profile.username}
                      avatarUrl={profile.avatar_url}
                      size="md"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={14} className="text-white" />
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/png, image/jpeg, image/jpg"
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                      {profile.display_name || `@${profile.username}`}
                    </p>
                    {profile.display_name && (
                      <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        @{profile.username}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Login/Logout depending on auth state */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                data-testid="logout-button"
                className={`
                  w-full text-left px-4 py-2 flex items-center gap-2
                  ${theme === 'dark'
                    ? 'text-gray-200 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                role="menuitem"
              >
                <LogOut size={16} />
                <span>{t('auth.logout')}</span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                data-testid="login-button-menu"
                className={`
                  w-full text-left px-4 py-2 flex items-center gap-2
                  ${theme === 'dark'
                    ? 'text-gray-200 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                role="menuitem"
              >
                <LogIn size={16} />
                <span>{t('auth.login')}</span>
              </button>
            )}

            {/* Divider */}
            <div className={`my-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>

            {/* Export option */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setAuthActionType('export');
                  setIsAuthModalOpen(true);
                } else {
                  onExport();
                }
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-4 py-2 flex items-center gap-2
                ${theme === 'dark'
                  ? 'text-gray-200 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              role="menuitem"
            >
              <Download size={16} />
              <span>{t('account.export_tasks')}</span>
            </button>

            {/* Import option */}
            <div
              className={`
                w-full text-left px-4 py-2 flex items-center gap-2 cursor-pointer
                ${theme === 'dark'
                  ? 'text-gray-200 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              role="menuitem"
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  setAuthActionType('import');
                  setIsAuthModalOpen(true);
                  setIsOpen(false);
                } else {
                  // Programmatically trigger the file input
                  fileInputRef.current?.click();
                }
              }}
            >
              <Upload size={16} />
              <span>{t('account.import_tasks')}</span>
              <input
                type="file"
                id="import-csv"
                accept=".csv"
                disabled={!isAuthenticated}
                onChange={(e) => {
                  onImport(e);
                  setIsOpen(false);
                }}
                ref={fileInputRef}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionType={authActionType}
      />

      {isCropModalOpen && selectedImage && (
        <ImageCropModal
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setIsCropModalOpen(false);
            setSelectedImage(null);
          }}
          isUploading={isUploading}
          error={uploadError}
        />
      )}
    </div>
  );
};
