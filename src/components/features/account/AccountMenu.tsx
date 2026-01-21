import React, { useState, useRef, useEffect } from 'react';
import { getAvatarColor } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Upload,
  ChevronDown,
  LogIn,
  LogOut,
  User,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/Avatar';
import { AuthRequiredModal } from './AuthRequiredModal';
import { MyProfileModal } from './MyProfileModal';

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
  const { profile } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionType, setAuthActionType] = useState<'export' | 'import'>('export');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsOpen(false);
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
          <Avatar className={`h-8 w-8 ${isOpen ? (theme === 'dark' ? 'ring-2 ring-yellow-500' : 'ring-2 ring-indigo-500') : ''}`}>
            <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name || profile.username} />
            <AvatarFallback className={`${getAvatarColor(profile.username || 'U')} text-white border-white`}>
              {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
            {/* User info section - Header (non-clickable now, just display) */}
            {isAuthenticated && profile && (
              <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="cursor-pointer" onClick={handleProfileClick} data-testid="user-profile-trigger">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name || profile.username} />
                      <AvatarFallback className={`${getAvatarColor(profile.username || 'U')} text-white`}>
                        {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      {profile.display_name || `@${profile.username}`}
                    </p>
                    <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      @{profile.username}
                    </p>
                  </div >
                </div >
              </div >
            )}

            {/* My Profile option */}
            {
              isAuthenticated && profile && (
                <button
                  onClick={handleProfileClick}
                  className={`
                  w-full text-left px-4 py-2 flex items-center gap-2
                  ${theme === 'dark'
                      ? 'text-gray-200 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                `}
                  role="menuitem"
                  data-testid="my-profile-menu-item"
                >
                  <User size={16} />
                  <div className="flex items-center justify-between w-full">
                    <span>{t('account.my_profile')}</span>
                  </div>
                </button>
              )
            }

            {/* Divider */}
            {isAuthenticated && <div className={`my-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>}

            {/* Upgrade Plan option */}
            <button
              onClick={() => {
                navigate('/pricing');
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
              data-testid="upgrade-plan-menu-item"
            >
              <Sparkles size={16} className="text-amber-500" />
              <span>{t('account.upgrade_plan', 'Upgrade Plan')}</span>
            </button>

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

            {/* Divider */}
            <div className={`my-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>

            {/* Login/Logout depending on auth state */}
            {
              isAuthenticated ? (
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
              )
            }
          </div >
        </div >
      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionType={authActionType}
      />

      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div >
  );
};
