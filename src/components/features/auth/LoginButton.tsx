import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';

interface LoginButtonProps {
  compact?: boolean;
  className?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ 
  compact = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  
  const handleAuth = () => {
    if (isAuthenticated) {
      // Si hay un usuario activo, mostrar perfil o menú desplegable en el futuro
      // Por ahora solo es un botón visual
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Estilos basados en el tema
  const buttonClasses = `
    flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
    ${theme === 'dark' 
      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-amber-700/20 hover:shadow-amber-700/30' 
      : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:from-indigo-500 hover:to-blue-400 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
    }
    font-medium ${className}
  `;

  // Versión para móvil (solo icono)
  const mobileButtonClasses = `
    flex items-center justify-center p-2 rounded-lg transition-all duration-200
    ${theme === 'dark' 
      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-amber-700/20 hover:shadow-amber-700/30' 
      : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:from-indigo-500 hover:to-blue-400 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
    }
  `;

  if (compact) {
    return (
      <button 
        onClick={handleAuth}
        className={mobileButtonClasses}
        aria-label="Login"
      >
        {isAuthenticated ? (
          <UserIcon size={18} />
        ) : (
          <LogIn size={18} />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleAuth}
        className={buttonClasses}
        aria-label={isAuthenticated ? "View profile" : "Login"}
      >
        {isAuthenticated ? (
          <>
            <UserIcon size={18} />
            <span className="hidden sm:inline">Mi Perfil</span>
          </>
        ) : (
          <>
            <LogIn size={18} />
            <span className="hidden sm:inline">Iniciar Sesión</span>
          </>
        )}
      </button>
      
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200
            ${theme === 'dark' 
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          aria-label="Logout"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      )}
    </div>
  );
};
