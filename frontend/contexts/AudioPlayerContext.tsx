'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer, UseAudioPlayerReturn } from '@/hooks/useAudioPlayer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcut';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';

const AudioPlayerContext = createContext<UseAudioPlayerReturn | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioPlayer = useAudioPlayer();

  // Register playback keyboard shortcuts
  useKeyboardShortcuts([
    {
      shortcut: KEYBOARD_SHORTCUTS.playPause,
      callback: () => {
        if (audioPlayer.isPlaying) {
          audioPlayer.pause();
        } else {
          audioPlayer.play();
        }
      },
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.nextSong,
      callback: () => audioPlayer.next(),
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.previousSong,
      callback: () => audioPlayer.previous(),
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.volumeUp,
      callback: () => audioPlayer.increaseVolume(0.1), // 10% increase
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.volumeDown,
      callback: () => audioPlayer.decreaseVolume(0.1), // 10% decrease
    },
  ]);

  return (
    <AudioPlayerContext.Provider value={audioPlayer}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayerContext(): UseAudioPlayerReturn {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  }
  return context;
}
