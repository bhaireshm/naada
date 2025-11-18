import { useState, useRef, useEffect, useCallback } from 'react';
import { Song, getSongStreamUrl } from '@/lib/api';
import { getIdToken } from '@/lib/firebase';

interface AudioPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  loading: boolean;
  error: string | null;
  queue: Song[];
  currentIndex: number;
  shuffleMode: boolean;
  repeatMode: 'off' | 'all' | 'one';
  playbackSpeed: number;
}

interface AudioPlayerActions {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  increaseVolume: (amount?: number) => void;
  decreaseVolume: (amount?: number) => void;
  loadSong: (song: Song) => void;
  next: () => void;
  previous: () => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  cycleRepeatMode: () => void;
  setPlaybackSpeed: (speed: number) => void;
  increaseSpeed: () => void;
  decreaseSpeed: () => void;
  removeFromQueue: (index: number) => void;
  jumpToQueueIndex: (index: number) => void;
}

export type UseAudioPlayerReturn = AudioPlayerState & AudioPlayerActions;

/**
 * Persisted player state stored in localStorage
 */
interface PersistedPlayerState {
  currentSong: Song | null;
  currentTime: number;
  volume: number;
  queue: Song[];
  currentIndex: number;
  shuffleMode: boolean;
  repeatMode: 'off' | 'all' | 'one';
  playbackSpeed: number;
  originalQueue: Song[];
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

const VOLUME_STORAGE_KEY = 'musicPlayerVolume';
const MUTE_STORAGE_KEY = 'musicPlayerMuted';
const SHUFFLE_STORAGE_KEY = 'musicPlayerShuffle';
const REPEAT_STORAGE_KEY = 'musicPlayerRepeat';
const SPEED_STORAGE_KEY = 'musicPlayerSpeed';
const DEFAULT_VOLUME = 0.7; // 70%
const DEFAULT_SPEED = 1.0; // Normal speed

/**
 * Fisher-Yates shuffle algorithm for unbiased randomization
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const previousVolumeRef = useRef<number>(DEFAULT_VOLUME);
  
  // Initialize state with default values to prevent hydration mismatch
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [shuffleMode, setShuffleMode] = useState<boolean>(false);
  const [repeatMode, setRepeatModeState] = useState<'off' | 'all' | 'one'>('off');
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(DEFAULT_SPEED);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]); // Store unshuffled queue

  // Initialize audio element and restore persisted state after mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitializedRef.current) {
      isInitializedRef.current = true;
      audioRef.current = new Audio();
      
      // Load volume and mute state from localStorage
      try {
        const storedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
        const storedMuted = localStorage.getItem(MUTE_STORAGE_KEY);
        const storedShuffle = localStorage.getItem(SHUFFLE_STORAGE_KEY);
        const storedRepeat = localStorage.getItem(REPEAT_STORAGE_KEY);
        const storedSpeed = localStorage.getItem(SPEED_STORAGE_KEY);
        
        if (storedVolume) {
          const vol = parseFloat(storedVolume);
          setVolumeState(vol);
          previousVolumeRef.current = vol;
          audioRef.current.volume = vol;
        } else {
          audioRef.current.volume = DEFAULT_VOLUME;
        }
        
        if (storedMuted === 'true') {
          setIsMuted(true);
          audioRef.current.muted = true;
        }
        
        if (storedShuffle === 'true') {
          setShuffleMode(true);
        }
        
        if (storedRepeat && ['off', 'all', 'one'].includes(storedRepeat)) {
          setRepeatModeState(storedRepeat as 'off' | 'all' | 'one');
        }
        
        if (storedSpeed) {
          const speed = parseFloat(storedSpeed);
          if (speed >= 0.25 && speed <= 2.0) {
            setPlaybackSpeedState(speed);
            audioRef.current.playbackRate = speed;
          }
        }
      } catch (error) {
        console.error('Failed to load volume settings:', error);
      }
      
      // Load persisted state after mount to prevent hydration mismatch
      const persistedState = loadPersistedState();
      
      if (persistedState) {
        // Restore state from localStorage
        setCurrentSong(persistedState.currentSong);
        setQueue(persistedState.queue);
        setCurrentIndex(persistedState.currentIndex);
        setOriginalQueue(persistedState.originalQueue || persistedState.queue);
        
        if (persistedState.shuffleMode !== undefined) {
          setShuffleMode(persistedState.shuffleMode);
        }
        if (persistedState.repeatMode) {
          setRepeatModeState(persistedState.repeatMode);
        }
        if (persistedState.playbackSpeed) {
          setPlaybackSpeedState(persistedState.playbackSpeed);
          audioRef.current.playbackRate = persistedState.playbackSpeed;
        }
        
        // Restore song and position if available
        if (persistedState.currentSong) {
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
              }, { once: true });
            } catch (err) {
              console.error('Failed to restore song:', err);
            }
          })();
        }
      } else {
        audioRef.current.volume = 1;
      }

      // Set up event listeners
      const audio = audioRef.current;

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleDurationChange = () => {
        setDuration(audio.duration);
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

      const handleLoadedData = () => {
        setLoading(false);
      };

      const handleError = () => {
        setError('Failed to load audio');
        setLoading(false);
        setIsPlaying(false);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('error', handleError);

      // Cleanup
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('loadeddata', handleLoadedData);
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
      
      // Add error handler for loading issues
      const handleLoadError = (e: Event) => {
        console.error('Audio load error:', e);
        console.error('Attempted URL:', authenticatedUrl);
        console.error('Backend URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
        setError('Cannot load audio. Make sure the backend server is running on port 3001.');
        setIsPlaying(false);
        setLoading(false);
      };
      
      audioRef.current.addEventListener('error', handleLoadError, { once: true });
      audioRef.current.load();
      
      // Reset playback state
      setCurrentTime(0);
      
      // Auto-play the song once it's ready
      const handleCanPlayAutoPlay = () => {
        setLoading(false);
        audioRef.current?.play().catch((err) => {
          console.error('Auto-play error:', err);
          setError('Failed to play audio');
          setIsPlaying(false);
          setLoading(false);
        });
      };
      
      audioRef.current.addEventListener('canplay', handleCanPlayAutoPlay, { once: true });
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

    // If the audio source is not set, load the song first
    if (!audioRef.current.src || audioRef.current.src === '') {
      loadSong(currentSong);
      return;
    }

    audioRef.current.play().catch((err) => {
      console.error('Playback error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    });
  }, [currentSong, loadSong]);

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
    previousVolumeRef.current = clampedVolume;
    
    // Persist to localStorage
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, clampedVolume.toString());
    } catch (error) {
      console.error('Failed to save volume:', error);
    }
    
    // Unmute if volume is increased from 0
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, 'false');
      } catch (error) {
        console.error('Failed to save mute state:', error);
      }
    }
  }, [isMuted]);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioRef.current.muted = newMutedState;
    
    if (newMutedState) {
      // Muting: save current volume
      previousVolumeRef.current = volume;
    } else {
      // Unmuting: restore previous volume
      if (previousVolumeRef.current > 0) {
        setVolumeState(previousVolumeRef.current);
        audioRef.current.volume = previousVolumeRef.current;
      }
    }
    
    // Persist mute state
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, newMutedState.toString());
    } catch (error) {
      console.error('Failed to save mute state:', error);
    }
  }, [isMuted, volume]);

  /**
   * Increase volume by specified amount
   */
  const increaseVolume = useCallback((amount: number = 0.05) => {
    const newVolume = Math.min(1, volume + amount);
    setVolume(newVolume);
  }, [volume, setVolume]);

  /**
   * Decrease volume by specified amount
   */
  const decreaseVolume = useCallback((amount: number = 0.05) => {
    const newVolume = Math.max(0, volume - amount);
    setVolume(newVolume);
  }, [volume, setVolume]);

  /**
   * Set the playback queue
   * 
   * @param {Song[]} songs - Array of songs to set as the queue
   * @param {number} startIndex - Index of the song to start playing (default: 0)
   */
  const setQueueFunc = useCallback((songs: Song[], startIndex: number = 0) => {
    setOriginalQueue(songs); // Always store original order
    
    if (shuffleMode) {
      // If shuffle is active, shuffle the new queue
      const shuffled = shuffleArray(songs);
      setQueue(shuffled);
      // Find the start song in shuffled queue
      const startSong = songs[startIndex];
      const newIndex = shuffled.findIndex(song => song.id === startSong?.id);
      setCurrentIndex(newIndex >= 0 ? newIndex : 0);
      if (shuffled[newIndex >= 0 ? newIndex : 0]) {
        loadSong(shuffled[newIndex >= 0 ? newIndex : 0]);
      }
    } else {
      setQueue(songs);
      setCurrentIndex(startIndex);
      
      // Load the song at the start index if valid
      if (startIndex >= 0 && startIndex < songs.length) {
        loadSong(songs[startIndex]);
      }
    }
  }, [loadSong, shuffleMode]);

  /**
   * Advance to the next song in the queue
   */
  const next = useCallback(() => {
    if (queue.length === 0) return;
    
    const nextIndex = currentIndex + 1;
    
    // Check if there's a next song
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      loadSong(queue[nextIndex]);
    }
  }, [queue, currentIndex, loadSong]);

  /**
   * Go to the previous song in the queue
   */
  const previous = useCallback(() => {
    if (queue.length === 0) return;
    
    const prevIndex = currentIndex - 1;
    
    // Check if there's a previous song
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      loadSong(queue[prevIndex]);
    }
  }, [queue, currentIndex, loadSong]);

  /**
   * Toggle shuffle mode
   */
  const toggleShuffle = useCallback(() => {
    const newShuffleMode = !shuffleMode;
    setShuffleMode(newShuffleMode);
    
    if (newShuffleMode) {
      // Activating shuffle: save original queue and shuffle remaining songs
      setOriginalQueue(queue);
      
      if (queue.length > 0 && currentIndex >= 0) {
        // Keep current song in place, shuffle the rest
        const beforeCurrent = queue.slice(0, currentIndex);
        const afterCurrent = queue.slice(currentIndex + 1);
        const shuffledAfter = shuffleArray(afterCurrent);
        const newQueue = [...beforeCurrent, queue[currentIndex], ...shuffledAfter];
        setQueue(newQueue);
      }
    } else {
      // Deactivating shuffle: restore original queue order
      if (originalQueue.length > 0) {
        // Find current song in original queue
        const currentSongId = currentSong?.id;
        const newIndex = originalQueue.findIndex(song => song.id === currentSongId);
        setQueue(originalQueue);
        setCurrentIndex(newIndex >= 0 ? newIndex : currentIndex);
      }
    }
    
    // Persist shuffle state
    try {
      localStorage.setItem(SHUFFLE_STORAGE_KEY, newShuffleMode.toString());
    } catch (error) {
      console.error('Failed to save shuffle state:', error);
    }
  }, [shuffleMode, queue, currentIndex, currentSong, originalQueue]);

  /**
   * Set repeat mode
   */
  const setRepeatMode = useCallback((mode: 'off' | 'all' | 'one') => {
    setRepeatModeState(mode);
    
    // Persist repeat mode
    try {
      localStorage.setItem(REPEAT_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save repeat mode:', error);
    }
  }, []);

  /**
   * Cycle through repeat modes: off → all → one → off
   */
  const cycleRepeatMode = useCallback(() => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  }, [repeatMode, setRepeatMode]);

  /**
   * Set playback speed
   */
  const setPlaybackSpeed = useCallback((speed: number) => {
    if (!audioRef.current) return;
    
    // Clamp speed between 0.25x and 2.0x
    const clampedSpeed = Math.max(0.25, Math.min(2.0, speed));
    audioRef.current.playbackRate = clampedSpeed;
    setPlaybackSpeedState(clampedSpeed);
    
    // Persist playback speed
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, clampedSpeed.toString());
    } catch (error) {
      console.error('Failed to save playback speed:', error);
    }
  }, []);

  /**
   * Increase playback speed by 0.25x
   */
  const increaseSpeed = useCallback(() => {
    const newSpeed = Math.min(2.0, playbackSpeed + 0.25);
    setPlaybackSpeed(newSpeed);
  }, [playbackSpeed, setPlaybackSpeed]);

  /**
   * Decrease playback speed by 0.25x
   */
  const decreaseSpeed = useCallback(() => {
    const newSpeed = Math.max(0.25, playbackSpeed - 0.25);
    setPlaybackSpeed(newSpeed);
  }, [playbackSpeed, setPlaybackSpeed]);

  /**
   * Remove a song from the queue
   */
  const removeFromQueue = useCallback((index: number) => {
    if (index < 0 || index >= queue.length) return;
    
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    setQueue(newQueue);
    
    // Adjust current index if necessary
    if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (index === currentIndex && newQueue.length > 0) {
      // If removing current song, load the next one (or previous if at end)
      const newIndex = Math.min(currentIndex, newQueue.length - 1);
      setCurrentIndex(newIndex);
      if (newQueue[newIndex]) {
        loadSong(newQueue[newIndex]);
      }
    }
  }, [queue, currentIndex, loadSong]);

  /**
   * Jump to a specific song in the queue
   */
  const jumpToQueueIndex = useCallback((index: number) => {
    if (index < 0 || index >= queue.length) return;
    
    setCurrentIndex(index);
    loadSong(queue[index]);
  }, [queue, loadSong]);

  // Auto-play next song when current song ends
  useEffect(() => {
    if (!audioRef.current) return;

    const handleEnded = () => {
      if (repeatMode === 'one') {
        // Repeat current song
        audioRef.current!.currentTime = 0;
        audioRef.current!.play();
      } else if (repeatMode === 'all' && currentIndex === queue.length - 1) {
        // Repeat all: go back to start
        setCurrentIndex(0);
        loadSong(queue[0]);
      } else if (currentIndex >= 0 && currentIndex < queue.length - 1) {
        // Normal: play next song
        next();
      } else if (repeatMode === 'all' && queue.length > 0) {
        // At end with repeat all: restart
        setCurrentIndex(0);
        loadSong(queue[0]);
      }
    };

    const audio = audioRef.current;
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, queue, repeatMode, next, loadSong]);

  // Persist state changes to localStorage
  useEffect(() => {
    if (!isInitializedRef.current) return; // Don't save until initial restore is complete
    
    savePersistedState({
      currentSong,
      currentTime,
      volume,
      queue,
      currentIndex,
      shuffleMode,
      repeatMode,
      playbackSpeed,
      originalQueue,
    });
  }, [currentSong, currentTime, volume, queue, currentIndex, shuffleMode, repeatMode, playbackSpeed, originalQueue]);

  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    loading,
    error,
    queue,
    currentIndex,
    shuffleMode,
    repeatMode,
    playbackSpeed,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    increaseVolume,
    decreaseVolume,
    loadSong,
    next,
    previous,
    setQueue: setQueueFunc,
    toggleShuffle,
    setRepeatMode,
    cycleRepeatMode,
    setPlaybackSpeed,
    increaseSpeed,
    decreaseSpeed,
    removeFromQueue,
    jumpToQueueIndex,
  };
}
