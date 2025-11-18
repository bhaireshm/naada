'use client';

import { ActionIcon, useMantineTheme } from '@mantine/core';
import { IconArrowsShuffle } from '@tabler/icons-react';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { ShortcutTooltip } from '@/components/ShortcutTooltip';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';

interface ShuffleButtonProps {
  size?: number;
  variant?: 'subtle' | 'filled' | 'light';
}

import { getConditionalButtonStyles } from '@/lib/buttonColors';

export default function ShuffleButton({ size = 32, variant = 'light' }: ShuffleButtonProps) {
  const theme = useMantineTheme();
  const { shuffleMode, toggleShuffle } = useAudioPlayerContext();

  return (
    <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.shuffle} label={shuffleMode ? 'Shuffle On' : 'Shuffle Off'}>
      <ActionIcon
        variant={variant}
        size={size}
        radius="md"
        onClick={toggleShuffle}
        aria-label={shuffleMode ? 'Disable shuffle' : 'Enable shuffle'}
        aria-pressed={shuffleMode}
        styles={{
          root: getConditionalButtonStyles(theme, shuffleMode),
        }}
      >
        <IconArrowsShuffle size={size * 0.5} stroke={2.5} />
      </ActionIcon>
    </ShortcutTooltip>
  );
}
