import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Download, Upload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface BurgerMenuProps {
  onExportTasks: () => void;
  onImportTasks: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BurgerMenu: React.FC<BurgerMenuProps> = ({
  onExportTasks,
  onImportTasks
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Burger Menu Button */}
      <button
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition-colors duration-200 ${
          theme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
        aria-label="Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="py-2">
            {/* Export Option */}
            <button
              onClick={() => {
                onExportTasks();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                theme === 'dark'
                  ? 'text-gray-100 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download size={16} />
              <span>Export Tasks</span>
            </button>

            {/* Import Option */}
            <label
              className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-200 ${
                theme === 'dark'
                  ? 'text-gray-100 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Upload size={16} />
              <span>Import Tasks</span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  onImportTasks(e);
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
