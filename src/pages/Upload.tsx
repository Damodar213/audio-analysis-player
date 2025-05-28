import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, AlertCircle, CheckCircle, FileMusic, Music2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSongStoreProvider as useSongStore } from '../store/songStoreProvider';
import { formatFileSize } from '../utils/formatters';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Song } from '../types';

const Upload: React.FC = () => {
  const { user } = useAuthStore();
  const { uploadSong, loading, error, clearError, fetchUserSongs } = useSongStore();
  const navigate = useNavigate();
  
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<Record<string, { title: string; artist: string; album: string }>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  // Utility to generate a stable fileId
  const getFileId = (file: File) => `${file.name}-${file.size}`;
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for audio files
    const audioFiles = acceptedFiles.filter(file => file.type.startsWith('audio/'));
    
    // Initialize metadata and status for each file
    const newMetadata: Record<string, { title: string; artist: string; album: string }> = {};
    const newStatus: Record<string, 'idle' | 'uploading' | 'success' | 'error'> = {};
    const newProgress: Record<string, number> = {};
    
    audioFiles.forEach(file => {
      const fileId = getFileId(file);
      newMetadata[fileId] = { 
        title: file.name.split('.')[0],
        artist: '',
        album: ''
      };
      newStatus[fileId] = 'idle';
      newProgress[fileId] = 0;
    });
    
    setFiles(prev => [...prev, ...audioFiles]);
    setMetadata(prev => ({ ...prev, ...newMetadata }));
    setUploadStatus(prev => ({ ...prev, ...newStatus }));
    setUploadProgress(prev => ({ ...prev, ...newProgress }));
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.aac']
    }
  });
  
  const handleRemoveFile = (file: File) => {
    const fileId = getFileId(file);
    setFiles(prev => prev.filter(f => f !== file));
    setMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata[fileId];
      return newMetadata;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };
  
  const handleMetadataChange = (fileId: string, field: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value
      }
    }));
  };
  
  const handleUploadFile = async (file: File) => {
    if (!user) return;
    
    const fileId = getFileId(file);
    setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress < 90) {
            return { ...prev, [fileId]: currentProgress + 10 };
          }
          return prev;
        });
      }, 300);
      
      // Upload the file
      await uploadSong(file, user.uid, metadata[fileId]);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      setUploadStatus(prev => ({ ...prev, [fileId]: 'success' }));
      
      // Refresh the music library after upload
      await fetchUserSongs(user.uid);
      
      // Remove the file from the list after a short delay
      setTimeout(() => {
        handleRemoveFile(file);
      }, 1500);
      
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      console.error('Upload failed:', err);
    }
  };
  
  const handleUploadAll = async () => {
    if (!user) return;
    
    for (const file of files) {
      const fileId = getFileId(file);
      if (uploadStatus[fileId] !== 'success') {
        await handleUploadFile(file);
      }
    }
    
    // Refresh the music library after all uploads
    await fetchUserSongs(user.uid);
  };
  
  // Add a function to navigate to the library
  const goToLibrary = () => {
    navigate('/library');
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Music</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add music files to your library for genre analysis
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 rounded-md border border-error-200 dark:border-error-800">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400" />
            <div className="ml-3">
              <p className="text-sm text-error-700 dark:text-error-200">{error}</p>
              <button 
                onClick={clearError}
                className="mt-1 text-sm font-medium text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
            : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <input {...getInputProps()} />
        
        <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {isDragActive ? 'Drop your audio files here' : 'Drag and drop audio files'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          or click to browse your computer
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Supported formats: MP3, WAV, OGG, FLAC, AAC
        </p>
      </div>
      
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Selected Files ({files.length})
            </h3>
            
            <button
              onClick={handleUploadAll}
              disabled={loading}
              className="btn-primary text-sm"
            >
              {loading ? 'Uploading...' : 'Upload All'}
            </button>
          </div>
          
          <div className="space-y-4">
            {files.map((file, index) => {
              const fileId = getFileId(file);
              const status = uploadStatus[fileId] || 'idle';
              const progress = uploadProgress[fileId] || 0;
              
              return (
                <motion.div 
                  key={`${file.name}-${file.size}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <FileMusic className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="ml-3 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {status === 'idle' && (
                          <>
                            <button
                              onClick={() => handleUploadFile(file)}
                              className="mr-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                            >
                              Upload
                            </button>
                            
                            <button
                              onClick={() => handleRemoveFile(file)}
                              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        
                        {status === 'uploading' && (
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-primary-600 h-2.5 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {progress}%
                            </span>
                          </div>
                        )}
                        
                        {status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-success-500" />
                        )}
                        
                        {status === 'error' && (
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-error-500 mr-1" />
                            <span className="text-xs text-error-500">Failed</span>
                            <button
                              onClick={() => handleRemoveFile(file)}
                              className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {status === 'idle' && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={metadata[fileId]?.title || ''}
                            onChange={(e) => handleMetadataChange(fileId, 'title', e.target.value)}
                            className="input text-sm py-1.5"
                            placeholder="Song title"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Artist
                          </label>
                          <input
                            type="text"
                            value={metadata[fileId]?.artist || ''}
                            onChange={(e) => handleMetadataChange(fileId, 'artist', e.target.value)}
                            className="input text-sm py-1.5"
                            placeholder="Artist name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Album
                          </label>
                          <input
                            type="text"
                            value={metadata[fileId]?.album || ''}
                            onChange={(e) => handleMetadataChange(fileId, 'album', e.target.value)}
                            className="input text-sm py-1.5"
                            placeholder="Album name"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Add link to Music Library */}
          <div className="mt-6 text-center">
            <button 
              onClick={goToLibrary}
              className="btn-primary inline-flex items-center"
            >
              <Music2 className="mr-2 h-5 w-5" />
              View Uploaded Songs in Library
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Go to the Music Library to see all your uploaded songs
            </p>
          </div>
        </div>
      )}
      
      {files.length === 0 && (
        <div className="mt-12 text-center">
          <Music2 className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No files selected</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Upload audio files to analyze their genres
          </p>
        </div>
      )}
    </div>
  );
};

export default Upload;