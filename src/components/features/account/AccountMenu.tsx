import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Upload, 
  UserCircle,
  ChevronDown,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserProfile } from '../../../hooks/useUserProfile';

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
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();

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
        title="My Account"
      >
        <UserCircle size={compact ? 16 : 18} />
        {!compact && (
          <>
            <span className="hidden sm:inline">My Account</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className={`
            absolute ${compact ? 'right-0 sm:left-0' : 'right-0'} mt-2 w-48 rounded-md shadow-lg z-50
            ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
          `}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            {/* User info section - only show when authenticated */}
            {isAuthenticated && profile && (
              <>
                <div className={`px-4 py-3 border-b ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <User size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        @{profile.username}
                      </p>
                      {profile.display_name && (
                        <p className={`text-xs truncate ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {profile.display_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
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
                <span>Logout</span>
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
                <span>Login</span>
              </button>
            )}
            
            {/* Divider */}
            <div className={`my-1 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
            
            {/* Export option */}
            <button
              onClick={() => {
                onExport();
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
              <span>Export Tasks</span>
            </button>
            
            {/* Import option */}
            <label 
              className={`
                w-full text-left px-4 py-2 flex items-center gap-2 cursor-pointer
                ${theme === 'dark' 
                  ? 'text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              role="menuitem"
            >
              <Upload size={16} />
              <span>Import Tasks</span>
              <input
                type="file"
                id="import-csv"
                accept=".csv"
                onChange={(e) => {
                  onImport(e);
                  setIsOpen(false);
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
