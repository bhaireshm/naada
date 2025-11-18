'use client';

import { ActionIcon, useMantineTheme } from '@mantine/core';
import { IconRepeat, IconRepeatOnce } from '@tabler/icons-react';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { ShortcutTooltip } from '@/components/ShortcutTooltip';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';

interface RepeatButtonProps {
  size?: number;
  variant?: 'subtle' | 'filled' | 'light';
}

import { getConditionalButtonStyles } from '@/lib/buttonColors';

export default function RepeatButton({ size = 32, variant = 'light' }: RepeatButtonProps) {
  const theme = useMantineTheme();
  const { repeatMode, cycleRepeatMode } = useAudioPlayerContext();

  const isActive = repeatMode !== 'off';

  const getLabel = () => {
    switch (repeatMode) {
      case 'off':
        return 'Repeat Off';
      case 'all':
        return 'Repeat All';
      case 'one':
        return 'Repeat One';
      default:
        return 'Repeat';
    }
  };

  return (
    <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.repeat} label={getLabel()}>
      <ActionIcon
        variant={variant}
        size={size}
        radius="md"
        onClick={cycleRepeatMode}
        aria-label={`Repeat mode: ${repeatMode}`}
        aria-pressed={isActive}
        styles={{
          root: getConditionalButtonStyles(theme, isActive),
        }}
      >
        {repeatMode === 'one' ? (
          <IconRepeatOnce size={size * 0.5} stroke={2.5} />
        ) : (
          <IconRepeat size={size * 0.5} stroke={2.5} />
        )}
      </ActionIcon>
    </ShortcutTooltip>
  );
}
