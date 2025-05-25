import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Music, FileAudio, BarChart2, Trash2 } from 'lucide-react';
import { useSongStoreProvider } from '../store/songStoreProvider';
import { Song } from '../types';
import { formatFileSize, formatDate, getGenreColor, truncateString } from '../utils/formatters';

interface SongCardProps {
  song: Song;
  compact?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({ song, compact = false }) => {
  const { 
    currentlyPlaying, 
    isPlaying, 
    setCurrentlyPlaying, 
    togglePlayState, 
    deleteSong, 
    analyzeSong 
  } = useSongStoreProvider();
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentlyPlaying?.id === song.id) {
      togglePlayState(!isPlaying);
    } else {
      setCurrentlyPlaying(song);
      togglePlayState(true);
    }
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this song?')) {
      await deleteSong(song.id);
    }
  };
  
  const handleAnalyze = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!song.analyzed) {
      await analyzeSong(song.id);
    }
  };
  
  if (compact) {
    return (
      <div className="group card hover:border-l-4 hover:border-l-primary-600 transition-all duration-200">
        <div className="flex items-center p-3">
          <div 
            className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden"
            onClick={handlePlay}
          >
            {song.coverArt ? (
              <img src={song.coverArt} alt={song.title} className="w-full h-full object-cover" />
            ) : (
              <FileAudio className="h-5 w-5 text-gray-400" />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Play className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div className="ml-3 flex-1 min-w-0">
            <Link 
              to={`/analysis/${song.id}`}
              className="block text-sm font-medium text-gray-900 dark:text-white truncate hover:text-primary-600 dark:hover:text-primary-400"
            >
              {song.title}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {song.artist || 'Unknown Artist'}
            </p>
          </div>
          
          <div className="flex-shrink-0 flex space-x-1">
            {song.analyzed ? (
              <div className="flex space-x-1">
                {song.genres.slice(0, 1).map((genre) => (
                  <span 
                    key={genre.name}
                    className={`inline-block px-2 py-0.5 text-xs text-white rounded-full ${getGenreColor(genre.name)}`}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            ) : (
              <button
                onClick={handleAnalyze}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors duration-200"
              >
                Analyze
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="group card hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col h-full">
        <div 
          className="relative h-40 bg-gray-100 dark:bg-gray-700 rounded-t-xl overflow-hidden cursor-pointer"
          onClick={handlePlay}
        >
          {song.coverArt ? (
            <img 
              src={song.coverArt} 
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-full">
              <Play className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-start justify-between">
            <div>
              <Link 
                to={`/analysis/${song.id}`}
                className="block text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                {truncateString(song.title, 25)}
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {song.artist || 'Unknown Artist'}
              </p>
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-error-600 dark:hover:text-error-400 transition-colors duration-200"
                title="Delete song"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              
              {!song.analyzed && (
                <button
                  onClick={handleAnalyze}
                  className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  title="Analyze genres"
                >
                  <BarChart2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <p>Uploaded: {formatDate(song.uploadedAt)}</p>
            <p>Size: {formatFileSize(song.fileSize)}</p>
          </div>
          
          {song.analyzed && song.genres.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Genres:</p>
              <div className="flex flex-wrap gap-1">
                {song.genres.map((genre) => (
                  <span 
                    key={genre.name}
                    className={`inline-block px-2 py-1 text-xs text-white rounded-full ${getGenreColor(genre.name)}`}
                  >
                    {genre.name} ({Math.round(genre.confidence * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {!song.analyzed && (
            <div className="mt-4 text-center">
              <Link
                to={`/analysis/${song.id}`}
                className="inline-block text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
              >
                Analyze this song
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongCard;