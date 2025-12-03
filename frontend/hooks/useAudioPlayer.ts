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
  crossfadeDuration: number;
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
  addToQueue: (song: Song) => void;
  setCrossfadeDuration: (duration: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
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
  crossfadeDuration: number;
}

const STORAGE_KEY = 'audioPlayerState';
const VOLUME_STORAGE_KEY = 'musicPlayerVolume';
const MUTE_STORAGE_KEY = 'musicPlayerMuted';
const SHUFFLE_STORAGE_KEY = 'musicPlayerShuffle';
const REPEAT_STORAGE_KEY = 'musicPlayerRepeat';
const SPEED_STORAGE_KEY = 'musicPlayerSpeed';
const CROSSFADE_STORAGE_KEY = 'musicPlayerCrossfade';
const DEFAULT_VOLUME = 0.7; // 70%
const DEFAULT_SPEED = 1; // Normal speed
const DEFAULT_CROSSFADE = 0; // No crossfade

/**
 * Load persisted player state from localStorage
 */
function loadPersistedState(): PersistedPlayerState | null {
  if (typeof globalThis.window === 'undefined') return null;

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
  if (typeof globalThis.window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save player state:', error);
  }
}

/**
 * Load player settings from localStorage
 */
function loadStoredSettings() {
  if (typeof globalThis.window === 'undefined') return null;

  try {
    const volume = localStorage.getItem(VOLUME_STORAGE_KEY);
    const muted = localStorage.getItem(MUTE_STORAGE_KEY);
    const shuffle = localStorage.getItem(SHUFFLE_STORAGE_KEY);
    const repeat = localStorage.getItem(REPEAT_STORAGE_KEY);
    const speed = localStorage.getItem(SPEED_STORAGE_KEY);
    const crossfade = localStorage.getItem(CROSSFADE_STORAGE_KEY);

    return { volume, muted, shuffle, repeat, speed, crossfade };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}

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
  const faderRef = useRef<HTMLAudioElement | null>(null); // Secondary player for crossfade
  const isInitializedRef = useRef<boolean>(false);
  const previousVolumeRef = useRef<number>(DEFAULT_VOLUME);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
  const [crossfadeDuration, setCrossfadeDurationState] = useState<number>(DEFAULT_CROSSFADE);

  // Helper to detach listeners
  const detachListeners = useCallback((audio: HTMLAudioElement) => {
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.removeEventListener('durationchange', handleDurationChange);
    audio.removeEventListener('play', handlePlay);
    audio.removeEventListener('pause', handlePause);
    audio.removeEventListener('loadstart', handleLoadStart);
    audio.removeEventListener('canplay', handleCanPlay);
    audio.removeEventListener('loadeddata', handleLoadedData);
    audio.removeEventListener('error', handleError);
    audio.removeEventListener('ended', handleEnded);
  }, []);

  // Helper to attach listeners to an audio element
  const attachListeners = useCallback((audio: HTMLAudioElement) => {
    // Remove existing listeners first to avoid duplicates if re-attaching
    detachListeners(audio);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
  }, [detachListeners]); // Dependencies will be added via closure if needed, but functions are defined below

  // Event Handlers (defined as refs or stable callbacks to avoid re-attaching)
  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleDurationChange = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setLoading(false);
  };

  const handlePause = () => {
    // Only set isPlaying to false if the main player pauses AND we are not in the middle of a crossfade swap
    // But for simplicity, we rely on the fact that we immediately play the next song
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

  // Handle Ended needs access to latest state, so we might need a ref or effect
  // But since we attach/detach, we can use a stable function that calls a ref
  const handleEndedRef = useRef<() => void>(() => { });

  const handleEnded = () => {
    handleEndedRef.current();
  };

  // Initialize audio element and restore persisted state after mount
  useEffect(() => {
    if (typeof globalThis.window !== 'undefined' && !isInitializedRef.current) {
      isInitializedRef.current = true;
      audioRef.current = new Audio();
      faderRef.current = new Audio(); // Initialize secondary player

      // Load settings from localStorage
      const settings = loadStoredSettings();

      if (settings) {
        if (settings.volume) {
          const vol = Number.parseFloat(settings.volume);
          setVolumeState(vol);
          previousVolumeRef.current = vol;
          audioRef.current.volume = vol;
          faderRef.current.volume = 0; // Fader starts silent
        } else {
          audioRef.current.volume = DEFAULT_VOLUME;
        }

        if (settings.muted === 'true') {
          setIsMuted(true);
          audioRef.current.muted = true;
          faderRef.current.muted = true;
        }

        if (settings.shuffle === 'true') {
          setShuffleMode(true);
        }

        if (settings.repeat && ['off', 'all', 'one'].includes(settings.repeat)) {
          setRepeatModeState(settings.repeat as 'off' | 'all' | 'one');
        }

        if (settings.speed) {
          const speed = Number.parseFloat(settings.speed);
          if (speed >= 0.25 && speed <= 2) {
            setPlaybackSpeedState(speed);
            audioRef.current.playbackRate = speed;
            faderRef.current.playbackRate = speed;
          }
        }

        if (settings.crossfade) {
          setCrossfadeDurationState(Number.parseFloat(settings.crossfade));
        }
      } else {
        audioRef.current.volume = DEFAULT_VOLUME;
      }

      // Load persisted state
      const persistedState = loadPersistedState();

      if (persistedState) {
        setCurrentSong(persistedState.currentSong);
        setQueue(persistedState.queue);
        setCurrentIndex(persistedState.currentIndex);
        setOriginalQueue(persistedState.originalQueue || persistedState.queue);
        if (persistedState.crossfadeDuration !== undefined) {
          setCrossfadeDurationState(persistedState.crossfadeDuration);
        }

        if (persistedState.shuffleMode !== undefined) setShuffleMode(persistedState.shuffleMode);
        if (persistedState.repeatMode) setRepeatModeState(persistedState.repeatMode);
        if (persistedState.playbackSpeed) {
          setPlaybackSpeedState(persistedState.playbackSpeed);
          audioRef.current.playbackRate = persistedState.playbackSpeed;
        }

        if (persistedState.currentSong) {
          (async () => {
            try {
              const token = await getIdToken();
              const streamUrl = getSongStreamUrl(persistedState.currentSong!.id);
              const authenticatedUrl = token ? `${streamUrl}?token=${token}` : streamUrl;

              audioRef.current!.src = authenticatedUrl;
              audioRef.current!.load();

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
      }

      // Attach listeners to main player
      attachListeners(audioRef.current);

      return () => {
        if (audioRef.current) {
          detachListeners(audioRef.current);
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        if (faderRef.current) {
          faderRef.current.pause();
          faderRef.current.src = '';
        }
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
      };
    }
  }, [attachListeners, detachListeners]);




  /**
   * Load a song into the audio player
   */
  const loadSong = useCallback(async (song: Song) => {
    if (!audioRef.current || !faderRef.current) return;

    // Check if we should crossfade
    const shouldCrossfade = crossfadeDuration > 0 && isPlaying && audioRef.current.src && !audioRef.current.paused;

    try {
      setLoading(true);
      setError(null);
      setCurrentSong(song);

      const token = await getIdToken();
      const streamUrl = getSongStreamUrl(song.id);
      const authenticatedUrl = token ? `${streamUrl}?token=${token}` : streamUrl;

      if (shouldCrossfade) {
        // CROSSFADE LOGIC

        // 1. Swap refs: fader becomes the old main (playing), main becomes the new one (to be loaded)
        const oldMain = audioRef.current;
        const newMain = faderRef.current;

        // Detach listeners from old main, attach to new main
        detachListeners(oldMain);
        attachListeners(newMain);

        // Update refs
        audioRef.current = newMain;
        faderRef.current = oldMain;

        // 2. Start fading out the old song (now in faderRef)
        const fadeOutDuration = crossfadeDuration * 1000;
        const steps = 20;
        const stepTime = fadeOutDuration / steps;
        const volStep = volume / steps;

        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

        let currentStep = 0;
        fadeIntervalRef.current = setInterval(() => {
          currentStep++;
          if (faderRef.current) {
            const newVol = Math.max(0, volume - (volStep * currentStep));
            faderRef.current.volume = newVol;
          }

          if (currentStep >= steps) {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            if (faderRef.current) {
              faderRef.current.pause();
              faderRef.current.currentTime = 0;
              faderRef.current.volume = volume; // Reset volume for next time
            }
          }
        }, stepTime);

        // 3. Load and play new song in new main

        // Define auto-play handler
        const handleCanPlayAutoPlay = () => {
          setLoading(false);
          newMain.play().then(() => {
            // Fade in
            let inStep = 0;
            const fadeInInterval = setInterval(() => {
              inStep++;
              if (newMain) {
                const newVol = Math.min(volume, (volStep * inStep));
                newMain.volume = newVol;
              }

              if (inStep >= steps) {
                clearInterval(fadeInInterval);
                if (newMain) newMain.volume = volume; // Ensure final volume is correct
              }
            }, stepTime);
          }).catch((err) => {
            console.error('Auto-play error:', err);
            setError('Failed to play audio');
            setIsPlaying(false);
            setLoading(false);
          });
        };

        // Attach listener BEFORE loading
        newMain.addEventListener('canplay', handleCanPlayAutoPlay, { once: true });

        // Load source
        newMain.src = authenticatedUrl;
        newMain.volume = 0; // Start silent
        newMain.load();

        // Reset time
        setCurrentTime(0);

      } else {
        // STANDARD LOAD LOGIC (No Crossfade)

        // Define handlers
        const handleLoadError = () => {
          console.error('Audio load error');
          setError('Cannot load audio.');
          setIsPlaying(false);
          setLoading(false);
        };

        const handleCanPlayAutoPlay = () => {
          setLoading(false);
          audioRef.current?.play().catch((err) => {
            console.error('Auto-play error:', err);
            setError('Failed to play audio');
            setIsPlaying(false);
            setLoading(false);
          });
        };

        // Attach listeners BEFORE loading
        audioRef.current.addEventListener('error', handleLoadError, { once: true });
        audioRef.current.addEventListener('canplay', handleCanPlayAutoPlay, { once: true });

        // Load source
        audioRef.current.src = authenticatedUrl;
        audioRef.current.load();
        setCurrentTime(0);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load song';
      setError(errorMessage);
      setLoading(false);
    }
  }, [crossfadeDuration, isPlaying, volume, attachListeners, detachListeners]);

  const play = useCallback(() => {
    if (!audioRef.current || !currentSong) return;
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

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    // Also pause fader if it's playing
    if (faderRef.current) faderRef.current.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    const clampedVolume = Math.max(0, Math.min(1, newVolume));

    // Update both players (unless fading)
    audioRef.current.volume = clampedVolume;
    // We don't update fader volume here because it might be fading out

    setVolumeState(clampedVolume);
    previousVolumeRef.current = clampedVolume;

    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, clampedVolume.toString());
    } catch (error) {
      console.error('Failed to save volume:', error);
    }

    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
      if (faderRef.current) faderRef.current.muted = false;
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, 'false');
      } catch (error) { console.error(error); }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioRef.current.muted = newMutedState;
    if (faderRef.current) faderRef.current.muted = newMutedState;

    if (newMutedState) {
      previousVolumeRef.current = volume;
    } else if (previousVolumeRef.current > 0) {
      setVolumeState(previousVolumeRef.current);
      audioRef.current.volume = previousVolumeRef.current;
    }

    try {
      localStorage.setItem(MUTE_STORAGE_KEY, newMutedState.toString());
    } catch (error) { console.error(error); }
  }, [isMuted, volume]);

  const increaseVolume = useCallback((amount: number = 0.05) => {
    const newVolume = Math.min(1, volume + amount);
    setVolume(newVolume);
  }, [volume, setVolume]);

  const decreaseVolume = useCallback((amount: number = 0.05) => {
    const newVolume = Math.max(0, volume - amount);
    setVolume(newVolume);
  }, [volume, setVolume]);

  const setQueueFunc = useCallback((songs: Song[], startIndex: number = 0) => {
    setOriginalQueue(songs);
    if (shuffleMode) {
      const shuffled = shuffleArray(songs);
      setQueue(shuffled);
      const startSong = songs[startIndex];
      const newIndex = shuffled.findIndex(song => song.id === startSong?.id);
      const safeIndex = Math.max(0, newIndex);
      setCurrentIndex(safeIndex);
      if (shuffled[safeIndex]) {
        loadSong(shuffled[safeIndex]);
      }
    } else {
      setQueue(songs);
      setCurrentIndex(startIndex);
      if (startIndex >= 0 && startIndex < songs.length) {
        loadSong(songs[startIndex]);
      }
    }
  }, [loadSong, shuffleMode]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      loadSong(queue[nextIndex]);
    }
  }, [queue, currentIndex, loadSong]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      loadSong(queue[prevIndex]);
    }
  }, [queue, currentIndex, loadSong]);

  const toggleShuffle = useCallback(() => {
    const newShuffleMode = !shuffleMode;
    setShuffleMode(newShuffleMode);

    if (newShuffleMode) {
      setOriginalQueue(queue);
      if (queue.length > 0 && currentIndex >= 0) {
        const beforeCurrent = queue.slice(0, currentIndex);
        const afterCurrent = queue.slice(currentIndex + 1);
        const shuffledAfter = shuffleArray(afterCurrent);
        const newQueue = [...beforeCurrent, queue[currentIndex], ...shuffledAfter];
        setQueue(newQueue);
      }
    } else if (originalQueue.length > 0) {
      const currentSongId = currentSong?.id;
      const newIndex = originalQueue.findIndex(song => song.id === currentSongId);
      setQueue(originalQueue);
      setCurrentIndex(newIndex >= 0 ? newIndex : currentIndex);
    }

    try {
      localStorage.setItem(SHUFFLE_STORAGE_KEY, newShuffleMode.toString());
    } catch (error) { console.error(error); }
  }, [shuffleMode, queue, currentIndex, currentSong, originalQueue]);

  const setRepeatMode = useCallback((mode: 'off' | 'all' | 'one') => {
    setRepeatModeState(mode);
    try {
      localStorage.setItem(REPEAT_STORAGE_KEY, mode);
    } catch (error) { console.error(error); }
  }, []);

  const cycleRepeatMode = useCallback(() => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  }, [repeatMode, setRepeatMode]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    if (!audioRef.current) return;
    const clampedSpeed = Math.max(0.25, Math.min(2, speed));
    audioRef.current.playbackRate = clampedSpeed;
    if (faderRef.current) faderRef.current.playbackRate = clampedSpeed;
    setPlaybackSpeedState(clampedSpeed);

    try {
      localStorage.setItem(SPEED_STORAGE_KEY, clampedSpeed.toString());
    } catch (error) { console.error(error); }
  }, []);

  const increaseSpeed = useCallback(() => {
    const newSpeed = Math.min(2, playbackSpeed + 0.25);
    setPlaybackSpeed(newSpeed);
  }, [playbackSpeed, setPlaybackSpeed]);

  const decreaseSpeed = useCallback(() => {
    const newSpeed = Math.max(0.25, playbackSpeed - 0.25);
    setPlaybackSpeed(newSpeed);
  }, [playbackSpeed, setPlaybackSpeed]);

  const removeFromQueue = useCallback((index: number) => {
    if (index < 0 || index >= queue.length) return;
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    setQueue(newQueue);

    if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (index === currentIndex && newQueue.length > 0) {
      const newIndex = Math.min(currentIndex, newQueue.length - 1);
      setCurrentIndex(newIndex);
      if (newQueue[newIndex]) {
        loadSong(newQueue[newIndex]);
      }
    }
  }, [queue, currentIndex, loadSong]);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, song]);
    setOriginalQueue(prev => [...prev, song]);
  }, []);

  const jumpToQueueIndex = useCallback((index: number) => {
    if (index < 0 || index >= queue.length) return;
    setCurrentIndex(index);
    loadSong(queue[index]);
  }, [queue, loadSong]);

  const setCrossfadeDuration = useCallback((duration: number) => {
    setCrossfadeDurationState(duration);
    try {
      localStorage.setItem(CROSSFADE_STORAGE_KEY, duration.toString());
    } catch (error) { console.error(error); }
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;

    const newQueue = [...queue];
    const [movedSong] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedSong);

    setQueue(newQueue);
    setOriginalQueue(newQueue); // Assuming reorder affects original queue too for now

    // Update currentIndex if needed
    if (currentIndex === fromIndex) {
      setCurrentIndex(toIndex);
    } else if (currentIndex > fromIndex && currentIndex <= toIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentIndex < fromIndex && currentIndex >= toIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [queue, currentIndex]);

  useEffect(() => {
    handleEndedRef.current = () => {
      if (repeatMode === 'one') {
        seek(0);
        play();
      } else {
        removeFromQueue(currentIndex);
      }
    };
  }, [repeatMode, currentIndex, removeFromQueue, seek, play]);

  // Persist state changes
  useEffect(() => {
    if (!isInitializedRef.current) return;

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
      crossfadeDuration,
    });
  }, [currentSong, currentTime, volume, queue, currentIndex, shuffleMode, repeatMode, playbackSpeed, originalQueue, crossfadeDuration]);

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
    crossfadeDuration,
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
    addToQueue,
    setCrossfadeDuration,
    reorderQueue,
  };
}
