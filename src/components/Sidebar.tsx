import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Music2, 
  Upload, 
  LineChart, 
  User,
  LogOut,
  Music
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-primary-800 dark:bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center">
                <Music className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">AutoGenre</span>
              </div>
            </div>
            
            <nav className="mt-8 flex-1 px-2 space-y-1">
              <NavLink 
                to="/" 
                end 
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive 
                      ? 'bg-primary-700 dark:bg-gray-700 text-white' 
                      : 'text-primary-100 dark:text-gray-300 hover:bg-primary-700 dark:hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </NavLink>
              
              <NavLink 
                to="/library" 
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive 
                      ? 'bg-primary-700 dark:bg-gray-700 text-white' 
                      : 'text-primary-100 dark:text-gray-300 hover:bg-primary-700 dark:hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Music2 className="mr-3 h-5 w-5" />
                Music Library
              </NavLink>
              
              <NavLink 
                to="/upload" 
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive 
                      ? 'bg-primary-700 dark:bg-gray-700 text-white' 
                      : 'text-primary-100 dark:text-gray-300 hover:bg-primary-700 dark:hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Upload className="mr-3 h-5 w-5" />
                Upload Music
              </NavLink>
              
              <NavLink 
                to="/profile" 
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive 
                      ? 'bg-primary-700 dark:bg-gray-700 text-white' 
                      : 'text-primary-100 dark:text-gray-300 hover:bg-primary-700 dark:hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <User className="mr-3 h-5 w-5" />
                Profile
              </NavLink>
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-primary-700 dark:border-gray-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-primary-600 dark:bg-gray-600 flex items-center justify-center text-white">
                  {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.displayName || user?.email?.split('@')[0] || 'User'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex p-4">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-700 dark:bg-gray-700 rounded-md hover:bg-primary-600 dark:hover:bg-gray-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;