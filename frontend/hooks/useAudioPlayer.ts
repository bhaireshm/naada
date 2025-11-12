import { useState, useRef, useEffect, useCallback } from 'react';
import { Song, getSongStreamUrl } from '@/lib/api';
import { getIdToken } from '@/lib/firebase';

interface AudioPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
  error: string | null;
}

interface AudioPlayerActions {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  loadSong: (song: Song) => void;
}

export type UseAudioPlayerReturn = AudioPlayerState & AudioPlayerActions;

/**
 * Persisted player state stored in localStorage
 */
interface PersistedPlayerState {
  currentSong: Song | null;
  currentTime: number;
  volume: number;
}

const STORAGE_KEY = 'audioPlayerState';

/**
 * Load persisted player state from localStorage
 */
function loadPersistedState(): PersistedPlayerState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.error('Failed to load persisted player state:', error);
    return null;
  }
}

/**
 * Save player state to localStorage
 */
function savePersistedState(state: PersistedPlayerState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save player state:', error);
  }
}

/**
 * Custom hook to manage audio player state and operations
 * Handles playback, seeking, volume control, and song loading
 * 
 * @returns {UseAudioPlayerReturn} Audio player state and action functions
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  // Initialize audio element and restore persisted state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      
      // Load persisted state
      const persistedState = loadPersistedState();
      if (persistedState) {
        setVolumeState(persistedState.volume);
        audioRef.current.volume = persistedState.volume;
        
        // Restore song and position if available
        if (persistedState.currentSong) {
          setCurrentSong(persistedState.currentSong);
          // Load the song asynchronously
          (async () => {
            try {
              const token = await getIdToken();
              const streamUrl = getSongStreamUrl(persistedState.currentSong!.id);
              const authenticatedUrl = token 
                ? `${streamUrl}?token=${token}` 
                : streamUrl;
              
              audioRef.current!.src = authenticatedUrl;
              audioRef.current!.load();
              
              // Wait for metadata to load before seeking
              audioRef.current!.addEventListener('loadedmetadata', () => {
                if (persistedState.currentTime > 0) {
                  audioRef.current!.currentTime = persistedState.currentTime;
                  setCurrentTime(persistedState.currentTime);
                }
                setIsRestored(true);
              }, { once: true });
            } catch (err) {
              console.error('Failed to restore song:', err);
              setIsRestored(true);
            }
          })();
        } else {
          setIsRestored(true);
        }
      } else {
        audioRef.current.volume = 1;
        setIsRestored(true);
      }

      // Set up event listeners
      const audio = audioRef.current;

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleDurationChange = () => {
        setDuration(audio.duration);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handlePlay = () => {
        setIsPlaying(true);
        setLoading(false);
      };

      const handlePause = () => {
        setIsPlaying(false);
      };

      const handleLoadStart = () => {
        setLoading(true);
        setError(null);
      };

      const handleCanPlay = () => {
        setLoading(false);
      };

      const handleError = () => {
        setError('Failed to load audio');
        setLoading(false);
        setIsPlaying(false);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);

      // Cleanup
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audio.src = '';
      };
    }
  }, []);

  /**
   * Load a song into the audio player
   * 
   * @param {Song} song - The song to load
   */
  const loadSong = useCallback(async (song: Song) => {
    if (!audioRef.current) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentSong(song);

      // Get the streaming URL with authentication token
      const token = await getIdToken();
      const streamUrl = getSongStreamUrl(song.id);
      
      // Add token as query parameter for authentication
      const authenticatedUrl = token 
        ? `${streamUrl}?token=${token}` 
        : streamUrl;

      // Load the new song
      audioRef.current.src = authenticatedUrl;
      audioRef.current.load();
      
      // Reset playback state
      setCurrentTime(0);
      setIsPlaying(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load song';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  /**
   * Play the current song
   */
  const play = useCallback(() => {
    if (!audioRef.current || !currentSong) return;

    audioRef.current.play().catch((err) => {
      console.error('Playback error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    });
  }, [currentSong]);

  /**
   * Pause the current song
   */
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  /**
   * Seek to a specific time in the song
   * 
   * @param {number} time - Time in seconds to seek to
   */
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  /**
   * Set the volume level
   * 
   * @param {number} newVolume - Volume level between 0 and 1
   */
  const setVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audioRef.current.volume = clampedVolume;
    setVolumeState(clampedVolume);
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    if (!isRestored) return; // Don't save until initial restore is complete
    
    savePersistedState({
      currentSong,
      currentTime,
      volume,
    });
  }, [currentSong, currentTime, volume, isRestored]);

  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    loading,
    error,
    play,
    pause,
    seek,
    setVolume,
    loadSong,
  };
}
