import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Player from './Player';
import SimplePlayer from './SimplePlayer';
import { useSongStoreProvider } from '../store/songStoreProvider';

const Layout: React.FC = () => {
  const { currentlyPlaying } = useSongStoreProvider();
  // State to determine which player to use
  const [useSimplePlayer, setUseSimplePlayer] = useState(true); // Default to SimplePlayer
  
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
        
        {/* Audio player controls */}
        {currentlyPlaying && (
          <div className="border-t border-gray-200 dark:border-gray-800">
            {/* Player selector */}
            <div className="flex justify-center items-center py-1 text-xs">
              <button 
                className={`mx-1 px-2 py-1 rounded ${!useSimplePlayer ? 'bg-primary-500 text-white' : 'text-gray-600'}`}
                onClick={() => setUseSimplePlayer(false)}
              >
                WaveSurfer Player
              </button>
              <button 
                className={`mx-1 px-2 py-1 rounded ${useSimplePlayer ? 'bg-primary-500 text-white' : 'text-gray-600'}`}
                onClick={() => setUseSimplePlayer(true)}
              >
                Simple Player
              </button>
            </div>
            
            {/* Render the selected player */}
            {useSimplePlayer ? <SimplePlayer /> : <Player />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;