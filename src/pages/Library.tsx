import React, { useEffect, useState } from 'react';
import { Search, Music, Filter, X, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSongStoreProvider } from '../store/songStoreProvider';
import SongCard from '../components/SongCard';
import { Link } from 'react-router-dom';

const Library: React.FC = () => {
  const { user } = useAuthStore();
  const { songs, loading, error, fetchUserSongs } = useSongStoreProvider();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    if (user) {
      console.log('[Library] Fetching songs for user:', user.uid);
      fetchUserSongs(user.uid);
    }
  }, [user, fetchUserSongs]);
  
  // Log songs whenever they change
  useEffect(() => {
    console.log('[Library] Songs in library:', songs.length);
    // Check for duplicate IDs
    const ids = songs.map(song => song.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.warn('[Library] Duplicate song IDs detected:', 
        ids.filter((id, index) => ids.indexOf(id) !== index));
    }
  }, [songs]);
  
  // Check if we need to refresh on mount or when returning to this page
  useEffect(() => {
    // When the component mounts, check if we have songs and if not, fetch them
    if (user && (!songs || songs.length === 0)) {
      console.log('[Library] No songs found on mount, fetching...');
      fetchUserSongs(user.uid);
    }
  }, []);
  
  // Collect all genres from analyzed songs
  const allGenres = songs.reduce<string[]>((acc, song) => {
    if (song.analyzed) {
      song.genres.forEach(genre => {
        if (!acc.includes(genre.name)) {
          acc.push(genre.name);
        }
      });
    }
    return acc;
  }, []).sort();
  
  // Filter songs based on search term and selected genre
  const filteredSongs = songs.filter(song => {
    const matchesSearch = searchTerm === '' || 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (song.album && song.album.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGenre = selectedGenre === null || 
      (song.analyzed && song.genres.some(g => g.name === selectedGenre));
    
    return matchesSearch && matchesGenre;
  });
  
  // Deduplicate songs to ensure no rendering issues
  const dedupedSongs = filteredSongs.reduce<typeof filteredSongs>((acc, song) => {
    // Only add song if we don't already have one with this ID
    if (!acc.some(s => s.id === song.id)) {
      acc.push(song);
    } else {
      // If a duplicate exists, keep the one with the most recent uploadedAt timestamp
      const index = acc.findIndex(s => s.id === song.id);
      if (index !== -1 && song.uploadedAt > acc[index].uploadedAt) {
        // Replace with the newer version
        acc[index] = song;
      }
    }
    return acc;
  }, []);
  
  // Sort by upload date - newest first
  const sortedSongs = [...dedupedSongs].sort((a, b) => b.uploadedAt - a.uploadedAt);
  
  // Log filtered songs
  useEffect(() => {
    console.log('[Library] Filtered songs:', dedupedSongs.length);
  }, [dedupedSongs]);
  
  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGenre(null);
  };
  
  // Function to manually trigger a refresh
  const refreshLibrary = () => {
    if (user) {
      console.log('[Library] Manually refreshing library...');
      fetchUserSongs(user.uid);
    }
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Music Library
        </h1>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={refreshLibrary}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mr-4"
          >
            Refresh Library
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-md ${view === 'grid' 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md ${view === 'list' 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Debug info - for development only */}
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 text-xs rounded">
        <p>Total songs in store: {songs.length}</p>
        <p>Filtered songs: {dedupedSongs.length}</p>
        <p>Loading state: {loading ? 'Loading' : 'Not loading'}</p>
      </div>
      
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by title, artist or album"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        {allGenres.length > 0 && (
          <div className="relative">
            <button
              type="button"
              className="btn-outline inline-flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              {selectedGenre || 'Filter by Genre'}
            </button>
            
            {/* Genre filter dropdown */}
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => handleGenreSelect(null)}
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    selectedGenre === null
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Genres
                </button>
                
                {allGenres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreSelect(genre)}
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      selectedGenre === genre
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {(searchTerm || selectedGenre) && (
          <button
            onClick={clearFilters}
            className="btn-secondary inline-flex items-center"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your music library...</p>
        </div>
      ) : dedupedSongs.length > 0 ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {sortedSongs.map(song => (
            <SongCard 
              key={`song-${song.id}`} 
              song={song} 
              compact={view === 'list'} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-12 text-center">
          <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No songs found</h2>
          
          {songs.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              Your music library is empty. Upload some songs to get started.
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No songs match your current filters. Try adjusting your search or filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;