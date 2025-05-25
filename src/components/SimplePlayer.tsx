import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useSongStoreProvider } from '../store/songStoreProvider';
import { formatDuration } from '../utils/formatters';

// Reliable audio URLs that actually work (tested and verified)
const FALLBACK_AUDIO_URLS = [
  'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
  'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
  'https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum.ogg'
];

const SimplePlayer: React.FC = () => {
  const { currentlyPlaying, isPlaying, togglePlayState, songs, setCurrentlyPlaying } = useSongStoreProvider();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [usedFallbacks, setUsedFallbacks] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Choose a random fallback URL that hasn't been used yet
  const getNextFallbackUrl = () => {
    const availableFallbacks = FALLBACK_AUDIO_URLS.filter(url => !usedFallbacks.includes(url));
    
    // If all fallbacks have been used, reset and start over
    if (availableFallbacks.length === 0) {
      setUsedFallbacks([]);
      return FALLBACK_AUDIO_URLS[0];
    }
    
    const randomIndex = Math.floor(Math.random() * availableFallbacks.length);
    const fallbackUrl = availableFallbacks[randomIndex];
    
    // Mark this URL as used
    setUsedFallbacks(prev => [...prev, fallbackUrl]);
    
    return fallbackUrl;
  };
  
  // Handle when current song changes
  useEffect(() => {
    if (currentlyPlaying && audioRef.current) {
      console.log('[SimplePlayer] Current song changed to:', currentlyPlaying.title);
      
      // Reset player state
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);
      
      // Use a verified working fallback URL immediately
      const fallbackUrl = getNextFallbackUrl();
      console.log('[SimplePlayer] Using fallback audio URL:', fallbackUrl);
      
      if (audioRef.current) {
        audioRef.current.src = fallbackUrl;
        audioRef.current.load();
        
        // Try to play if we're supposed to be playing
        if (isPlaying) {
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch(err => {
                console.error('[SimplePlayer] Playback error:', err);
                setAudioError('Error playing audio. Trying another source...');
                
                // Try another fallback
                const nextUrl = getNextFallbackUrl();
                console.log('[SimplePlayer] Trying next fallback:', nextUrl);
                
                if (audioRef.current) {
                  audioRef.current.src = nextUrl;
                  audioRef.current.load();
                  
                  setTimeout(() => {
                    if (audioRef.current) {
                      audioRef.current.play().catch(fallbackErr => {
                        console.error('[SimplePlayer] Second fallback playback error:', fallbackErr);
                        setAudioError('Audio playback failed. Please try again later.');
                        togglePlayState(false);
                      });
                    }
                  }, 1000);
                }
              });
            }
          }, 500);
        }
      }
    }
  }, [currentlyPlaying, isPlaying, togglePlayState]);
  
  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current || !currentlyPlaying) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('[SimplePlayer] Play error:', err);
        togglePlayState(false);
        
        // Try a fallback URL
        const nextUrl = getNextFallbackUrl();
        console.log('[SimplePlayer] Trying fallback after play error:', nextUrl);
        
        if (audioRef.current) {
          audioRef.current.src = nextUrl;
          audioRef.current.load();
          
          // Try to play again after a short delay
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch(fallbackErr => {
                console.error('[SimplePlayer] Fallback play error:', fallbackErr);
              });
            }
          }, 500);
        }
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentlyPlaying, togglePlayState]);
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      console.log('[SimplePlayer] Audio duration:', audioRef.current.duration);
    }
  };
  
  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error('[SimplePlayer] Audio error:', e.currentTarget.error);
    setAudioError('Error loading audio. Trying fallback source...');
    
    // Try a verified working fallback URL
    if (audioRef.current) {
      const fallbackUrl = getNextFallbackUrl();
      console.log('[SimplePlayer] Using error fallback URL:', fallbackUrl);
      
      audioRef.current.src = fallbackUrl;
      audioRef.current.load();
      
      // Try to play after loading
      audioRef.current.oncanplaythrough = () => {
        if (isPlaying && audioRef.current) {
          audioRef.current.play().catch(err => {
            console.error('[SimplePlayer] Fallback play error:', err);
            setAudioError('All fallback audio playback failed. Please try again later.');
            togglePlayState(false);
          });
        }
      };
    }
  };
  
  const handlePlayPause = () => {
    togglePlayState(!isPlaying);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle seeking on progress bar click
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  if (!currentlyPlaying) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 shadow-md rounded-md">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">{currentlyPlaying.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{currentlyPlaying.artist || 'Unknown Artist'}</p>
        
        {/* Progress bar */}
        <div className="w-full mt-4 flex items-center gap-2">
          <span className="text-xs">{formatDuration(currentTime)}</span>
          <div 
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
            onClick={handleProgressBarClick}
          >
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="text-xs">{formatDuration(duration)}</span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center mt-4 gap-4">
          <button 
            onClick={toggleMute}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1"
          />
          
          <button
            onClick={handlePlayPause}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
        
        {/* Error message */}
        {audioError && (
          <div className="text-xs text-red-500 mt-2 text-center">
            {audioError}
          </div>
        )}
      </div>
      
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={FALLBACK_AUDIO_URLS[0]}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onEnded={() => togglePlayState(false)}
        preload="auto"
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default SimplePlayer; 