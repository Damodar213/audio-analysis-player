import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, Music } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import MobileMenu from './MobileMenu';

const TopBar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, toggleTheme } = useThemeStore();
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/library':
        return 'Music Library';
      case '/upload':
        return 'Upload Music';
      case '/profile':
        return 'Profile';
      default:
        if (location.pathname.startsWith('/analysis')) {
          return 'Genre Analysis';
        }
        return 'AutoGenre';
    }
  };
  
  return (
    <>
      <div className="relative z-10 flex-shrink-0 h-16 bg-white dark:bg-gray-800 shadow">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden -ml-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="md:hidden flex items-center ml-4">
              <Music className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <span className="ml-2 text-xl font-bold text-primary-600 dark:text-primary-400">
                AutoGenre
              </span>
            </div>
            
            <h1 className="hidden md:block text-2xl font-semibold text-gray-900 dark:text-white ml-4">
              {getPageTitle()}
            </h1>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {mode === 'dark' ? (
                <Sun className="h-6 w-6" />
              ) : (
                <Moon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <MobileMenu isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
    </>
  );
};

export default TopBar;