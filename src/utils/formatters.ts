import { format } from 'date-fns';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMM d, yyyy');
};

export const getGenreColor = (genreName: string): string => {
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
  
  return genreColors[genreName] || 'bg-gray-500';
};

export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};