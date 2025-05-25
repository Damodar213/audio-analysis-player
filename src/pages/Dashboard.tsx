import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileAudio, Upload, BarChart2, Music } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSongStore } from '../store/songStore';
import SongCard from '../components/SongCard';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { songs, fetchUserSongs, loading } = useSongStore();
  const [stats, setStats] = useState({
    totalSongs: 0,
    analyzedSongs: 0,
    topGenres: [] as { name: string; count: number }[]
  });
  
  useEffect(() => {
    if (user) {
      fetchUserSongs(user.uid);
    }
  }, [user, fetchUserSongs]);
  
  useEffect(() => {
    if (songs.length > 0) {
      // Calculate stats
      const analyzedSongs = songs.filter(song => song.analyzed);
      
      // Count genre occurrences
      const genreCounts: Record<string, number> = {};
      
      analyzedSongs.forEach(song => {
        song.genres.forEach(genre => {
          if (genreCounts[genre.name]) {
            genreCounts[genre.name]++;
          } else {
            genreCounts[genre.name] = 1;
          }
        });
      });
      
      // Convert to array and sort
      const topGenres = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setStats({
        totalSongs: songs.length,
        analyzedSongs: analyzedSongs.length,
        topGenres
      });
    }
  }, [songs]);
  
  const recentSongs = [...songs].slice(0, 5);
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {user?.displayName || 'Music Lover'}!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Discover the genres of your music with our AI-powered analysis.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-6"
        >
          <div className="flex items-center mb-4">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
              <FileAudio className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">Your Music</h2>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalSongs}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Songs</span>
            </div>
            <Link to="/library" className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
              View your library →
            </Link>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center mb-4">
            <div className="bg-secondary-100 dark:bg-secondary-900/30 p-3 rounded-lg">
              <BarChart2 className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">Analyzed</h2>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.analyzedSongs}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {stats.totalSongs > 0 
                  ? `${Math.round((stats.analyzedSongs / stats.totalSongs) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-2 bg-secondary-500 rounded-full"
                style={{ 
                  width: stats.totalSongs > 0 
                    ? `${(stats.analyzedSongs / stats.totalSongs) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center mb-4">
            <div className="bg-accent-100 dark:bg-accent-900/30 p-3 rounded-lg">
              <Upload className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">Upload</h2>
          </div>
          <div className="flex flex-col">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add more music to your library for analysis
            </p>
            <Link 
              to="/upload" 
              className="mt-4 btn-primary text-center text-sm"
            >
              Upload Music
            </Link>
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Music</h2>
            <Link to="/library" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your music...</p>
            </div>
          ) : recentSongs.length > 0 ? (
            <div className="space-y-3">
              {recentSongs.map(song => (
                <SongCard key={song.id} song={song} compact />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center">
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No songs yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload your first song to get started with genre analysis
              </p>
              <Link to="/upload" className="btn-primary inline-block">
                Upload Music
              </Link>
            </div>
          )}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top Genres</h2>
          </div>
          
          {stats.topGenres.length > 0 ? (
            <div className="card p-6">
              <div className="space-y-4">
                {stats.topGenres.map((genre, index) => (
                  <div key={genre.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getGenreColor(genre.name)}`}></div>
                      <span className="ml-2 text-gray-800 dark:text-gray-200">{genre.name}</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{genre.count} songs</span>
                  </div>
                ))}
              </div>
              
              {stats.topGenres.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Based on {stats.analyzedSongs} analyzed songs
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No genres yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Analyze your songs to see genre statistics
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Helper function to get genre color
const getGenreColor = (genre: string): string => {
  const genreColors: Record<string, string> = {
    'Pop': 'bg-pink-500',
    'Rock': 'bg-red-600',
    'Hip Hop': 'bg-purple-600',
    'R&B': 'bg-blue-500',
    'Jazz': 'bg-yellow-500',
    'Classical': 'bg-emerald-600',
    'Electronic': 'bg-cyan-600',
    'Dance': 'bg-indigo-500',
    'Indie': 'bg-violet-500',
    'Country': 'bg-amber-600',
    'Metal': 'bg-stone-700',
    'Folk': 'bg-lime-600',
  };
  
  return genreColors[genre] || 'bg-gray-500';
};

export default Dashboard;