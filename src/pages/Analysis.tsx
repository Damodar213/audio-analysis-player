import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Music2, Disc, BarChart2, Clock, File, Tag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSongStoreProvider as useSongStore } from '../store/songStoreProvider';
import { formatFileSize, formatDate, getGenreColor } from '../utils/formatters';
import { getSimilarSongsByGenre } from '../utils/genreAnalysis';
import { motion } from 'framer-motion';

const Analysis: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const { user } = useAuthStore();
  const { songs, fetchUserSongs, analyzeSong, setCurrentlyPlaying, togglePlayState } = useSongStore();
  
  const [song, setSong] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [similarSongs, setSimilarSongs] = useState<string[]>([]);
  
  useEffect(() => {
    if (user && songId) {
      fetchUserSongs(user.uid).then(() => {
        // Find the song in the store
        const foundSong = songs.find(s => s.id === songId);
        setSong(foundSong || null);
      });
    }
  }, [user, songId, fetchUserSongs, songs]);
  
  useEffect(() => {
    const loadSimilarSongs = async () => {
      if (song?.analyzed && song.genres.length > 0) {
        // Get similar songs based on the primary genre
        const primaryGenre = song.genres[0];
        const similar = await getSimilarSongsByGenre(primaryGenre.name);
        setSimilarSongs(similar);
      }
    };
    
    loadSimilarSongs();
  }, [song]);
  
  const handleAnalyze = async () => {
    if (!song) return;
    
    setAnalyzing(true);
    try {
      await analyzeSong(song.id);
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handlePlay = () => {
    if (song) {
      setCurrentlyPlaying(song);
      togglePlayState(true);
    }
  };
  
  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading song details...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <Link to="/library" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 w-full md:w-64">
              <div 
                onClick={handlePlay}
                className="bg-gray-100 dark:bg-gray-700 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden cursor-pointer group"
              >
                {song.coverArt ? (
                  <img src={song.coverArt} alt={song.title} className="w-full h-full object-cover" />
                ) : (
                  <Music2 className="h-32 w-32 text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-full">
                    <Play className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePlay}
                className="mt-4 btn-primary w-full flex items-center justify-center"
              >
                <Play className="mr-2 h-5 w-5" />
                Play
              </button>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {song.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Disc className="h-4 w-4 mr-1" />
                  <span>{song.artist || 'Unknown Artist'}</span>
                </div>
                
                {song.album && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <File className="h-4 w-4 mr-1" />
                    <span>{song.album}</span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Uploaded on {formatDate(song.uploadedAt)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Tag className="mr-2 h-5 w-5" />
                    Genre Analysis
                  </h2>
                  
                  {song.analyzed ? (
                    song.genres.length > 0 ? (
                      <div className="space-y-4">
                        {song.genres.map((genre: any, index: number) => (
                          <motion.div 
                            key={genre.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${getGenreColor(genre.name)}`}></div>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                  {genre.name}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {Math.round(genre.confidence * 100)}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  confidence
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-2 ${getGenreColor(genre.name)}`}
                                style={{ width: `${genre.confidence * 100}%` }}
                              ></div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        No genres detected for this song.
                      </p>
                    )
                  ) : (
                    <div className="text-center py-6">
                      <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        This song hasn't been analyzed yet
                      </p>
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="btn-primary text-sm"
                      >
                        {analyzing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Analyzing...
                          </>
                        ) : (
                          'Analyze Now'
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    File Information
                  </h2>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">File Name:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{song.fileName}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Size:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{formatFileSize(song.fileSize)}</span>
                      </div>
                      
                      {song.duration && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {song.analyzed && similarSongs.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Similar Songs
                      </h2>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <ul className="space-y-2">
                          {similarSongs.map((songName, index) => (
                            <motion.li 
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="flex items-center"
                            >
                              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs text-primary-600 dark:text-primary-400 mr-2">
                                {index + 1}
                              </div>
                              <span className="text-gray-900 dark:text-white">{songName}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Play: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export default Analysis;