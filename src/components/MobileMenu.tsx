import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Music2, 
  Upload, 
  User,
  LogOut,
  Music,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex z-40 md:hidden">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)} />
      
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary-800 dark:bg-gray-800">
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button
            type="button"
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={() => setIsOpen(false)}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
        
        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div className="flex-shrink-0 flex items-center px-4">
            <Music className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">AutoGenre</span>
          </div>
          
          <nav className="mt-5 px-2 space-y-1">
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  isActive 
                    ? 'bg-primary-700 dark:bg-gray-700 text-white' 
                    : 'text-primary-100 dark:text-gray-300 hover:bg-primary-700 dark:hover:bg-gray-700 hover:text-white'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <Home className="mr-4 h-6 w-6" />
              Dashboard
            </NavLink>
            
            <NavLink 
              to="/library" 
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  isActive 
                    ? 'bg-primary-700 dark:bg-gray-700 text-white' 
                    : 'text-primary-100 dark:text-gray-300 hover:bg-primary-700 dark:hover:bg-gray-700 hover:text-white'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <Music2 className="mr-4 h-6 w-6" />
              Music Library
            </NavLink>
            
            <NavLink 
              to="/upload" 
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  isActive 
                    ? 'bg-primary-700 dark:bg-gray-700 text-white' 
                    : 'text-primary-100 dark:text-gray-300 hover:bg-primary-700 dark:hover:bg-gray-700 hover:text-white'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <Upload className="mr-4 h-6 w-6" />
              Upload Music
            </NavLink>
            
            <NavLink 
              to="/profile" 
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  isActive 
                    ? 'bg-primary-700 dark:bg-gray-700 text-white' 
                    : 'text-primary-100 dark:text-gray-300 hover:bg-primary-700 dark:hover:bg-gray-700 hover:text-white'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <User className="mr-4 h-6 w-6" />
              Profile
            </NavLink>
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-primary-700 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary-600 dark:bg-gray-600 flex items-center justify-center text-white">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-base font-medium text-white">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-sm font-medium text-primary-200 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex p-4">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-base font-medium text-white bg-primary-700 dark:bg-gray-700 rounded-md hover:bg-primary-600 dark:hover:bg-gray-600"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
      
      <div className="flex-shrink-0 w-14" aria-hidden="true">
        {/* Dummy element to force sidebar to shrink to fit close icon */}
      </div>
    </div>
  );
};

export default MobileMenu;