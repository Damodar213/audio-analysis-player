const onUpload = async (file: File) => {
  // Start upload process
  setUploadStatus(prev => ({
    ...prev,
    [getFileId(file)]: 'uploading'
  }));
  
  try {
    console.log(`[Upload] Starting upload for file: ${file.name}`);
    
    // Try to check connection first
    try {
      await testStorageConnection();
    } catch (connErr) {
      console.warn('[Upload] Storage connection test failed, but will attempt upload anyway:', connErr);
    }
    
    // Get file ID
    const fileId = getFileId(file);
    
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
      [getFileId(file)]: 'error'
    }));
    
    // Set progress to 0 to indicate failure
    setUploadProgress(prev => ({
      ...prev,
      [getFileId(file)]: 0
    }));
    
    // Set error message
    setUploadError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Display error alert
    if (typeof window !== 'undefined') {
      window.alert(`Upload failed for ${file.name}. The app will continue in test mode with sample audio files.`);
    }
    
    // Return null to indicate failure
    return null;
  }
}; 