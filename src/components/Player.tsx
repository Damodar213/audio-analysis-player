import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useSongStoreProvider } from '../store/songStoreProvider';
import { formatDuration } from '../utils/formatters';
import WaveSurfer from 'wavesurfer.js';

// Array of fallback audio URLs that are known to work with CORS - from NASA (public domain)
const FALLBACK_AUDIO_URLS = [
  'https://www.nasa.gov/wp-content/uploads/2023/02/Ep139_City_Landscape_FirstChristmasInSpace.mp3',
  'https://www.nasa.gov/wp-content/uploads/2022/06/Apollo13_HoustonWeHaveAProblem.mp3',
  'https://www.nasa.gov/wp-content/uploads/2023/05/Apollo_11_FirstStepOnTheMoon.mp3'
];

// Utility function to handle audio URLs - this will proxy problematic URLs
const getProxiedUrl = (url: string) => {
  // If URL is from Firebase Storage
  if (url.includes('firebasestorage.googleapis.com')) {
    // In development, use local CORS proxy if available
    if (window.location.hostname === 'localhost') {
      try {
        // First try our local proxy if running
        return `http://localhost:3001/proxy?url=${encodeURIComponent(url)}`;
      } catch (err) {
        console.error('[Player] Error using proxy:', err);
      }
    }
  }
  
  // For CodePen assets or any external URLs that may have CORS issues
  if (url.includes('assets.codepen.io') || url.includes('soundhelix.com') || url.includes('mixkit.co')) {
    // Return a fallback URL that is known to work
    const randomIndex = Math.floor(Math.random() * FALLBACK_AUDIO_URLS.length);
    console.log('[Player] Using fallback audio URL due to potential CORS issues');
    return FALLBACK_AUDIO_URLS[randomIndex];
  }
  
  return url;
};

const Player: React.FC = () => {
  const { currentlyPlaying, isPlaying, togglePlayState } = useSongStoreProvider();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [useFallbackPlayer, setUseFallbackPlayer] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const cleanupInProgressRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get proxied URL for current song
  const currentSongUrl = currentlyPlaying ? getProxiedUrl(currentlyPlaying.fileUrl) : '';
  
  // Log when current song changes
  useEffect(() => {
    if (currentlyPlaying) {
      console.log('[Player] Current song changed:', currentlyPlaying.title);
      console.log('[Player] File URL:', currentlyPlaying.fileUrl);
      console.log('[Player] Proxied URL:', currentSongUrl);
      setAudioError(null);
      setUseFallbackPlayer(false);
      
      // Reset time tracking
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentlyPlaying, currentSongUrl]);
  
  // Cleanup function for wavesurfer
  const cleanupWavesurfer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (wavesurferRef.current && !cleanupInProgressRef.current) {
      try {
        cleanupInProgressRef.current = true;
        wavesurferRef.current.pause();
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
        cleanupInProgressRef.current = false;
        console.log('[Player] WaveSurfer instance destroyed cleanly');
      } catch (err) {
        console.warn('[Player] Non-critical error during cleanup:', err);
        cleanupInProgressRef.current = false;
      }
    }
  };
  
  // Main WaveSurfer instance effect
  useEffect(() => {
    // Skip if no waveform container, no song, or using fallback player
    if (!waveformRef.current || !currentlyPlaying || useFallbackPlayer) {
      return cleanupWavesurfer;
    }
    
    // Clean up previous instance
    cleanupWavesurfer();
    
    // Create a flag to track if this effect instance is still current
    let isEffectActive = true;
    
    // Wrap in a try/catch to handle any initialization errors
    try {
      console.log('[Player] Creating WaveSurfer instance');
      
      // Create WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#9CA3AF',
        progressColor: '#7C3AED',
        cursorColor: 'transparent',
        barWidth: 2,
        barGap: 3,
        barRadius: 3,
        height: 50,
        backend: 'MediaElement' // More stable than WebAudio for streaming
      });
      
      // Set the reference early
      wavesurferRef.current = wavesurfer;
      
      // Handle loading with a timeout for fallback
      console.log('[Player] Loading audio file:', currentSongUrl);
      
      // Set a timeout to fallback to audio element if WaveSurfer takes too long
      timeoutRef.current = setTimeout(() => {
        if (!isEffectActive) return;
        
        console.log('[Player] WaveSurfer load timeout - switching to fallback player');
        setUseFallbackPlayer(true);
        setAudioError('Visualizer timed out. Using fallback player.');
        
        if (audioRef.current && isPlaying) {
          // Try to play with the audio element directly
          audioRef.current.play().catch(err => {
            console.warn('[Player] Fallback audio play error:', err);
          });
        }
      }, 5000);
      
      // Load the audio file
      wavesurfer.load(currentSongUrl);
      
      // Set up event handlers
      wavesurfer.on('ready', () => {
        // Check if this is still the current effect
        if (!isEffectActive) return;
        
        // Clear the timeout since WaveSurfer loaded successfully
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.log('[Player] WaveSurfer ready event fired');
        wavesurfer.setVolume(isMuted ? 0 : volume);
        setDuration(wavesurfer.getDuration());
        
        // Sync with audio element
        if (isPlaying) {
          // Small delay to avoid race conditions
          setTimeout(() => {
            if (wavesurferRef.current && isEffectActive) {
              wavesurferRef.current.play();
            }
          }, 100);
        }
      });
      
      wavesurfer.on('error', (err) => {
        // Check if this is still the current effect and not during cleanup
        if (!isEffectActive || cleanupInProgressRef.current) return;
        
        // Clear the timeout since we got an error response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.error('[Player] WaveSurfer error:', err);
        setAudioError(`Error loading audio: ${err}`);
        setUseFallbackPlayer(true);
        
        // Try to play with the audio element
        if (audioRef.current && isPlaying) {
          audioRef.current.play().catch(playErr => {
            console.warn('[Player] Fallback audio play error:', playErr);
          });
        }
      });
      
      wavesurfer.on('audioprocess', () => {
        // Check if this is still the current effect
        if (!isEffectActive || !wavesurferRef.current) return;
        
        try {
          setCurrentTime(wavesurferRef.current.getCurrentTime());
        } catch (err) {
          console.warn('[Player] Error getting current time:', err);
        }
      });
      
      wavesurfer.on('finish', () => {
        // Check if this is still the current effect
        if (!isEffectActive) return;
        
        togglePlayState(false);
      });
      
      // Cleanup function
      return () => {
        // Mark this effect as no longer current
        isEffectActive = false;
        cleanupWavesurfer();
      };
    } catch (err) {
      console.error('[Player] Error creating WaveSurfer:', err);
      setAudioError(`Error initializing audio player: ${err}`);
      setUseFallbackPlayer(true);
      
      return () => {
        isEffectActive = false;
        cleanupWavesurfer();
      };
    }
  }, [currentlyPlaying, currentSongUrl, isPlaying, togglePlayState, useFallbackPlayer]);
  
  // Volume effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    
    if (wavesurferRef.current && !cleanupInProgressRef.current) {
      try {
        wavesurferRef.current.setVolume(isMuted ? 0 : volume);
      } catch (err) {
        console.warn('[Player] Error setting volume:', err);
      }
    }
  }, [volume, isMuted]);
  
  // Play state effect - controls play/pause
  useEffect(() => {
    console.log('[Player] isPlaying changed:', isPlaying);
    
    // Always update the audio element
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('[Player] Error playing audio element:', err);
            togglePlayState(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
    
    // Only control wavesurfer if it exists and we're not using fallback
    if (wavesurferRef.current && !useFallbackPlayer && !cleanupInProgressRef.current) {
      try {
        if (isPlaying) {
          wavesurferRef.current.play();
        } else {
          wavesurferRef.current.pause();
        }
      } catch (err) {
        console.warn('[Player] Error controlling WaveSurfer playback:', err);
        setUseFallbackPlayer(true);
      }
    }
  }, [isPlaying, togglePlayState, useFallbackPlayer]);
  
  // Handle audio element events
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const target = e.currentTarget;
    console.error('[Player] Audio element error:', target.error);
    setAudioError(`Audio error: ${target.error?.message || 'Unknown error'}`);
    togglePlayState(false);
    
    // Try another fallback URL
    if (audioRef.current) {
      const randomIndex = Math.floor(Math.random() * FALLBACK_AUDIO_URLS.length);
      const fallbackUrl = FALLBACK_AUDIO_URLS[randomIndex];
      console.log('[Player] Trying fallback audio URL:', fallbackUrl);
      audioRef.current.src = fallbackUrl;
      audioRef.current.load();
      
      // Try to play after a short delay
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(err => {
            console.error('[Player] Even fallback playback failed:', err);
          });
        }
      }, 500);
    }
  };
  
  // Handle audio loading
  const handleCanPlayThrough = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(err => {
        console.warn('[Player] Auto-play after load failed:', err);
      });
    }
  };
  
  // Simple progress display for fallback player
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };
  
  const handlePlayPause = () => {
    console.log('[Player] Play/Pause button clicked, current state:', isPlaying);
    togglePlayState(!isPlaying);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  if (!currentlyPlaying) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 w-1/3">
          {currentlyPlaying.coverArt ? (
            <img 
              src={currentlyPlaying.coverArt} 
              alt={currentlyPlaying.title} 
              className="h-14 w-14 object-cover rounded-md"
            />
          ) : (
            <div className="h-14 w-14 bg-primary-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
              <Music2 className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentlyPlaying.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentlyPlaying.artist || 'Unknown Artist'}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center w-1/3">
          <div className="flex items-center space-x-4">
            <button 
              className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button 
              onClick={handlePlayPause}
              className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            
            <button 
              className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center w-full mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-12">
              {formatDuration(currentTime)}
            </span>
            
            {useFallbackPlayer ? (
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary-600 h-full rounded-full"
                  style={{ 
                    width: `${duration ? (currentTime / duration) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            ) : (
              <div className="flex-1" ref={waveformRef}></div>
            )}
            
            <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
              {formatDuration(duration)}
            </span>
          </div>
          
          {audioError && (
            <div className="mt-1 text-xs text-red-500 dark:text-red-400 w-full text-center">
              Using fallback player - WaveSurfer unavailable
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3 w-1/3 justify-end">
          <button
            onClick={toggleMute}
            className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      
      {/* Always include the audio element even when using WaveSurfer for backup playback */}
      <audio
        ref={audioRef}
        src={currentSongUrl}
        onEnded={() => togglePlayState(false)}
        onError={handleAudioError}
        onTimeUpdate={handleTimeUpdate}
        onCanPlayThrough={handleCanPlayThrough}
        preload="auto"
        crossOrigin="anonymous"
      />
    </div>
  );
};

const Music2: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export default Player;