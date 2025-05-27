import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useSongStoreProvider as useSongStore } from '../store/songStoreProvider';
import { formatDuration } from '../utils/formatters';
import WaveSurfer from 'wavesurfer.js';

const Player: React.FC = () => {
  const { currentlyPlaying, isPlaying, togglePlayState } = useSongStore();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  useEffect(() => {
    let wavesurfer: WaveSurfer | null = null;

    if (waveformRef.current && currentlyPlaying) {
      // Destroy previous global instance if it exists and is different
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      
      wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#9CA3AF',
        progressColor: '#7C3AED',
        cursorColor: 'transparent',
        barWidth: 2,
        barGap: 3,
        barRadius: 3,
        height: 50,
      });
      
      wavesurfer.load(currentlyPlaying.file_url);
      
      const onReady = () => {
        wavesurferRef.current = wavesurfer;
        if (wavesurfer) {
          wavesurfer.setVolume(volume);
          setDuration(wavesurfer.getDuration());
          if (isPlaying && audioRef.current) {
            audioRef.current.play();
            wavesurfer.play();
          }
        }
      };

      const onAudioProcess = () => {
        if (wavesurfer) setCurrentTime(wavesurfer.getCurrentTime());
      };

      const onFinish = () => {
        togglePlayState(false);
      };

      wavesurfer.on('ready', onReady);
      wavesurfer.on('audioprocess', onAudioProcess);
      wavesurfer.on('finish', onFinish);
      
      // Cleanup function for this specific effect run
      return () => {
        if (wavesurfer) {
          const wasThisInstanceInRef = wavesurferRef.current === wavesurfer;
          wavesurfer.unAll();
          wavesurfer.stop();
          wavesurfer.destroy();
          if (wasThisInstanceInRef) {
            wavesurferRef.current = null;
          }
        }
      };
    } else {
      // If no song is currently playing, or waveformRef is not available,
      // ensure any existing global WaveSurfer instance is destroyed.
      if (wavesurferRef.current) {
        wavesurferRef.current.stop();
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      // Also clear duration and current time
      setDuration(0);
      setCurrentTime(0);
    }
  }, [currentlyPlaying]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);
  
  useEffect(() => {
    if (audioRef.current && wavesurferRef.current) {
      if (isPlaying) {
        audioRef.current.play();
        wavesurferRef.current.play();
      } else {
        audioRef.current.pause();
        wavesurferRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  const handlePlayPause = () => {
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
            
            <div className="flex-1" ref={waveformRef}></div>
            
            <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
              {formatDuration(duration)}
            </span>
          </div>
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
      
      <audio
        ref={audioRef}
        src={currentlyPlaying.file_url}
        onEnded={() => togglePlayState(false)}
        hidden
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