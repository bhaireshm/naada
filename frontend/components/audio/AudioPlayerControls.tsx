// Extracted audio player controls following SRP
'use client';

import { ActionIcon, Group } from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconPlayerSkipBack,
} from '@tabler/icons-react';
import { ShortcutTooltip } from '@/components/ShortcutTooltip';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';
import ShuffleButton from '@/components/ShuffleButton';
import RepeatButton from '@/components/RepeatButton';

interface AudioPlayerControlsProps {
  readonly isPlaying: boolean;
  readonly loading: boolean;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
  readonly onPlayPause: () => void;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly size?: 'sm' | 'md' | 'lg';
}

export function AudioPlayerControls({
  isPlaying,
  loading,
  hasNext,
  hasPrevious,
  onPlayPause,
  onNext,
  onPrevious,
  size = 'md',
}: AudioPlayerControlsProps) {
  const iconSizes = { sm: 16, md: 20, lg: 32 };
  const buttonSizes = { sm: 'sm', md: 'lg', lg: 'xl' } as const;
  const playButtonSizes = { sm: 32, md: 40, lg: 72 };

  return (
    <Group gap={size === 'lg' ? 'xl' : 'md'} justify="center">
      <ShuffleButton size={iconSizes[size]} />

      <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.previousSong} label="Previous">
        <ActionIcon
          variant={size === 'lg' ? 'transparent' : 'subtle'}
          color="dark"
          size={buttonSizes[size]}
          radius="xl"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous song"
        >
          <IconPlayerSkipBack size={iconSizes[size]} fill="currentColor" />
        </ActionIcon>
      </ShortcutTooltip>

      <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.playPause} label={isPlaying ? 'Pause' : 'Play'}>
        <ActionIcon
          variant="filled"
          color="dark"
          size={playButtonSizes[size]}
          radius="xl"
          onClick={onPlayPause}
          disabled={loading}
          loading={loading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          style={{
            transition: 'transform 0.1s ease',
            ...(size === 'lg' && { boxShadow: 'var(--mantine-shadow-md)' }),
          }}
        >
          {isPlaying ? (
            <IconPlayerPause size={iconSizes[size]} fill="currentColor" />
          ) : (
            <IconPlayerPlay 
              size={iconSizes[size]} 
              fill="currentColor" 
              style={{ marginLeft: size === 'lg' ? 0 : 2 }} 
            />
          )}
        </ActionIcon>
      </ShortcutTooltip>

      <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.nextSong} label="Next">
        <ActionIcon
          variant={size === 'lg' ? 'transparent' : 'subtle'}
          color="dark"
          size={buttonSizes[size]}
          radius="xl"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next song"
        >
          <IconPlayerSkipForward size={iconSizes[size]} fill="currentColor" />
        </ActionIcon>
      </ShortcutTooltip>

      <RepeatButton size={iconSizes[size]} />
    </Group>
  );
}