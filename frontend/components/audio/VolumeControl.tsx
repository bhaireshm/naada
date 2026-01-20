// Extracted volume control component following SRP
'use client';

import { ActionIcon, Group, Slider } from '@mantine/core';
import {
  IconVolume,
  IconVolume2,
  IconVolume3,
  IconVolumeOff,
} from '@tabler/icons-react';
import { ShortcutTooltip } from '@/components/ShortcutTooltip';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';

interface VolumeControlProps {
  readonly volume: number;
  readonly isMuted: boolean;
  readonly onVolumeChange: (volume: number) => void;
  readonly onToggleMute: () => void;
  readonly size?: 'sm' | 'md' | 'lg';
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  size = 'md',
}: VolumeControlProps) {
  const renderVolumeIcon = (iconSize: number) => {
    if (isMuted || volume === 0) return <IconVolumeOff size={iconSize} />;
    if (volume < 0.33) return <IconVolume3 size={iconSize} />;
    if (volume < 0.66) return <IconVolume2 size={iconSize} />;
    return <IconVolume size={iconSize} />;
  };

  const iconSize = size === 'lg' ? 18 : size === 'md' ? 18 : 16;
  const sliderWidth = size === 'lg' ? 100 : 80;
  const showSlider = size !== 'sm';

  return (
    <Group gap={4} align="center">
      <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.mute} label={isMuted ? 'Unmute' : 'Mute'}>
        <ActionIcon
          variant="subtle"
          color="dark"
          size="sm"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {renderVolumeIcon(iconSize)}
        </ActionIcon>
      </ShortcutTooltip>
      
      {showSlider && (
        <Slider
          value={volume}
          onChange={onVolumeChange}
          max={1}
          min={0}
          step={0.01}
          style={{ width: sliderWidth }}
          size="xs"
          color="dark"
          thumbSize={10}
          aria-label="Volume slider"
        />
      )}
    </Group>
  );
}