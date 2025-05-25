import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, AlertCircle, CheckCircle, FileMusic, Music2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSongStoreProvider, testStorageConnection } from '../store/songStoreProvider';
import { formatFileSize } from '../utils/formatters';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Song } from '../types';

const Upload: React.FC = () => {
  const { user } = useAuthStore();
  const { uploadSong, loading, error, clearError, fetchUserSongs, addSong, clearTestSongs } = useSongStoreProvider();
  const navigate = useNavigate();
  
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<Record<string, { title: string; artist: string; album: string }>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [fileIds, setFileIds] = useState<Record<string, string>>({});
  const [storageConnectionStatus, setStorageConnectionStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [successfulUploads, setSuccessfulUploads] = useState<Song[]>([]);
  
  useEffect(() => {
    // Test Firebase storage connection on component mount
    const checkStorageConnection = async () => {
      try {
        const isConnected = await testStorageConnection();
        setStorageConnectionStatus(isConnected ? 'success' : 'failed');
      } catch (err) {
        console.error('Error checking storage connection:', err);
        setStorageConnectionStatus('failed');
      }
    };
    
    checkStorageConnection();
  }, []);
  
  useEffect(() => {
    // Effect to ensure successful uploads are reflected in the song store
    if (successfulUploads.length > 0) {
      console.log(`[Upload] Ensuring ${successfulUploads.length} successful uploads are in the song store`);
      successfulUploads.forEach(song => {
        addSong(song);
      });
    }
  }, [successfulUploads, addSong]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for audio files
    const audioFiles = acceptedFiles.filter(file => file.type.startsWith('audio/'));
    
    // Initialize metadata and status for each file
    const newMetadata: Record<string, { title: string; artist: string; album: string }> = {};
    const newStatus: Record<string, 'idle' | 'uploading' | 'success' | 'error'> = {};
    const newProgress: Record<string, number> = {};
    const newFileIds: Record<string, string> = {};
    
    audioFiles.forEach(file => {
      // Create a stable file identifier
      const fileKey = `${file.name}-${file.size}`;
      const fileId = `${fileKey}-${Date.now()}`;
      
      newFileIds[fileKey] = fileId;
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
    setFileIds(prev => ({ ...prev, ...newFileIds }));
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.aac']
    }
  });
  
  const handleRemoveFile = (file: File) => {
    setFiles(prev => prev.filter(f => f !== file));
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
  
  // Helper function to get a stable file ID
  const getFileId = (file: File): string => {
    const fileKey = `${file.name}-${file.size}`;
    return fileIds[fileKey] || '';
  };
  
  // Function to test Firebase storage and then upload a file
  const onUpload = async (file: File) => {
    if (!user) {
      console.error('[Upload] No user found for upload');
      return null;
    }
    
    // Get file ID
    const fileId = getFileId(file);
    if (!fileId) {
      console.error('[Upload] File ID not found for', file.name);
      return null;
    }
    
    // Start upload process
    setUploadStatus(prev => ({
      ...prev,
      [fileId]: 'uploading'
    }));
    
    try {
      console.log(`[Upload] Starting upload for file: ${file.name}`);
      
      // Try to check connection first
      try {
        await testStorageConnection();
      } catch (connErr) {
        console.warn('[Upload] Storage connection test failed, but will attempt upload anyway:', connErr);
      }
      
      // Get metadata for this file
      const meta = metadata[fileId] || {
        title: file.name.split('.')[0],
        artist: '',
        album: ''
      };
      
      // Upload using store
      const uploadedSong = await uploadSong(file, user?.uid || 'unknown-user', meta);
      console.log(`[Upload] Upload completed successfully for: ${file.name}`);
      
      // Update status
      setUploadStatus(prev => ({
        ...prev,
        [fileId]: 'success'
      }));
      
      // Add to successful uploads for tracking
      setSuccessfulUploads(prev => [...prev, uploadedSong]);
      
      // Update progress to 100%
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 100
      }));
      
      return uploadedSong;
    } catch (error) {
      console.error(`[Upload] Error uploading file ${file.name}:`, error);
      
      // Update status to error
      setUploadStatus(prev => ({
        ...prev,
        [fileId]: 'error'
      }));
      
      // Set progress to 0 to indicate failure
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));
      
      // Display error alert
      window.alert(`Upload failed for ${file.name}. The app will continue in test mode with sample audio files.`);
      
      // Return null to indicate failure
      return null;
    }
  };
  
  const handleUploadFile = async (file: File) => {
    if (!user) return;
    
    // Create a stable file key to retrieve the correct fileId
    const fileKey = `${file.name}-${file.size}`;
    const fileId = fileIds[fileKey];
    
    if (!fileId) {
      console.error(`[Upload] File ID not found`, fileKey);
      return;
    }
    
    console.log(`[Upload] Starting upload process for file: ${file.name}`);
    
    // Clear any existing test songs before uploading
    clearTestSongs();
    
    setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    
    let progressInterval: NodeJS.Timeout | null = null;
    let forceProgressTimeout: NodeJS.Timeout | null = null;
    
    try {
      // Use smaller intervals for smoother animation
      console.log(`[Upload] Starting progress simulation for ${file.name}`);
      let lastProgress = 0;
      
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          
          // Make progress increments smaller as we get closer to 100%
          let increment;
          if (currentProgress < 30) increment = 8;
          else if (currentProgress < 60) increment = 5;
          else if (currentProgress < 85) increment = 2;
          else increment = 0.5; // Slower near completion
          
          // Cap progress at 95% until we know the upload is complete
          const newProgress = Math.min(95, currentProgress + increment);
          
          if (newProgress !== lastProgress) {
            lastProgress = newProgress;
            console.log(`[Upload] Progress for ${file.name}: ${newProgress}%`);
          }
          
          return { ...prev, [fileId]: newProgress };
        });
      }, 150); // Smaller interval for smoother animation
      
      console.log(`[Upload] Calling uploadSong function for ${file.name}`);
      
      // Always force progress to 100% after a timeout
      forceProgressTimeout = setTimeout(() => {
        console.log(`[Upload] Force progress timeout triggered for ${file.name}`);
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        // Rather than forcing to 100%, we'll set an error state after timeout
        setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        console.log(`[Upload] Upload timeout for ${file.name}`);
        window.alert(`Upload timed out for ${file.name}. Please try again or refresh the page.`);
      }, 15000); // 15 seconds max wait
      
      // Upload the file - explicitly handle any errors from here
      try {
        // Start the upload process
        const uploadPromise = uploadSong(file, user.uid, metadata[fileId]);
        
        // Wait for the actual upload to complete
        const newSong = await uploadPromise;
        console.log(`[Upload] Upload completed successfully for ${file.name}`, newSong);
        
        // Clear timeouts and intervals
        if (forceProgressTimeout) {
          clearTimeout(forceProgressTimeout);
          forceProgressTimeout = null;
        }
        
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        
        // Explicitly set progress to 100% and status to success
        console.log(`[Upload] Setting final progress to 100% for ${file.name}`);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        setUploadStatus(prev => ({ ...prev, [fileId]: 'success' }));
        
        // Manually add the song to the song store and update successful uploads
        addSong(newSong);
        setSuccessfulUploads(prev => [...prev, newSong]);
        
        // Try to refresh the library
        try {
          await fetchUserSongs(user.uid);
        } catch (refreshErr) {
          console.error(`[Upload] Failed to refresh songs for ${file.name}, but upload was successful:`, refreshErr);
        }
        
        // Remove the file from the list after a short delay
        setTimeout(() => {
          setFiles(prev => prev.filter(f => f !== file));
          console.log(`[Upload] Removed ${file.name} from file list`);
          
          // Navigate to library to see the uploaded song
          window.alert(`Upload complete! Click OK to view your song in the library.`);
          navigate('/library');
        }, 1500);
      } catch (uploadErr) {
        // Handle specific upload error
        console.error(`[Upload] Upload operation failed for ${file.name}:`, uploadErr);
        
        // Clear any pending timeouts/intervals
        if (forceProgressTimeout) {
          clearTimeout(forceProgressTimeout);
          forceProgressTimeout = null;
        }
        
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
        window.alert(`Upload failed for ${file.name}. The app will continue in test mode with sample audio files.`);
      }
    } catch (err) {
      // Handle any other unexpected errors
      console.error(`[Upload] Unexpected error during upload process for ${file.name}:`, err);
      
      if (forceProgressTimeout) {
        clearTimeout(forceProgressTimeout);
      }
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      window.alert(`An unexpected error occurred during upload. Please try again.`);
    }
  };
  
  const handleUploadAll = async () => {
    if (!user) return;
    
    for (const file of files) {
      const fileKey = `${file.name}-${file.size}`;
      const fileId = fileIds[fileKey];
      
      if (fileId && uploadStatus[fileId] !== 'success') {
        await handleUploadFile(file);
      }
    }
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
        
        {/* Firebase Storage connection status */}
        {storageConnectionStatus === 'checking' && (
          <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            Checking storage connection...
          </div>
        )}
        {storageConnectionStatus === 'success' && (
          <div className="mt-2 text-sm text-success-600 dark:text-success-400">
            Storage connection successful
          </div>
        )}
        {storageConnectionStatus === 'failed' && (
          <div className="mt-2 text-sm text-error-600 dark:text-error-400">
            Storage connection failed - uploads may not work
          </div>
        )}
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
              const fileKey = `${file.name}-${file.size}`;
              const fileId = fileIds[fileKey];
              if (!fileId) return null;
              
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
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-success-500 mr-1" />
                            <span className="text-xs text-success-600 dark:text-success-400">Upload complete</span>
                          </div>
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