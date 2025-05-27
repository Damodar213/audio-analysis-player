import React, { useEffect, useState, useMemo } from 'react';
import { Search, Music, Filter, X, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSongStoreProvider as useSongStore } from '../store/songStoreProvider';
import SongCard from '../components/SongCard';
import { Link } from 'react-router-dom';

const Library: React.FC = () => {
  const { user } = useAuthStore();
  const { songs, fetchUserSongs, loading } = useSongStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    if (user) {
      console.log('[Library] Fetching songs for user:', user.uid);
      fetchUserSongs(user.uid);
    }
  }, [user, fetchUserSongs]);
  
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
  
  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGenre(null);
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Music Library
        </h1>
        
        <div className="flex items-center space-x-3">
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
            
            <div className="absolute z-10 right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-focus-within:block">
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
      
      {/* Active filters */}
      {(searchTerm || selectedGenre) && (
        <div className="flex items-center mb-6">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Filters:</span>
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                "{searchTerm}"
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-1 p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {selectedGenre && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                Genre: {selectedGenre}
                <button 
                  onClick={() => setSelectedGenre(null)}
                  className="ml-1 p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            <button
              onClick={clearFilters}
              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your music library...</p>
        </div>
      ) : filteredSongs.length > 0 ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredSongs.map(song => (
            <SongCard key={song.id} song={song} compact={view === 'list'} />
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