import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Player from './Player';
import { useSongStore } from '../store/songStore';

const Layout: React.FC = () => {
  const { currentlyPlaying } = useSongStore();
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopBar />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="container-custom">
              <Outlet />
            </div>
          </div>
        </main>
        
        {/* Audio player at bottom */}
        {currentlyPlaying && (
          <div className="border-t border-gray-200 dark:border-gray-800">
            <Player />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;