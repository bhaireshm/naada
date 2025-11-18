'use client';

import { Group, Text, ActionIcon, Menu, useMantineTheme } from '@mantine/core';
import { IconGauge, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { ShortcutTooltip } from '@/components/ShortcutTooltip';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';
import { getNormalButtonStyles } from '@/lib/buttonColors';

interface PlaybackSpeedControlProps {
  compact?: boolean;
}

export default function PlaybackSpeedControl({ compact = false }: PlaybackSpeedControlProps) {
  const theme = useMantineTheme();
  const { playbackSpeed, setPlaybackSpeed, increaseSpeed, decreaseSpeed } = useAudioPlayerContext();

  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const textColor = theme.colors.accent2[9];

  if (compact) {
    return (
      <Menu shadow="sm" width={120} position="top" offset={4}>
        <Menu.Target>
          <ActionIcon
            variant="light"
            color="accent1"
            size={28}
            radius="md"
            aria-label={`Playback speed: ${playbackSpeed}x`}
            styles={{
              root: getNormalButtonStyles(theme),
            }}
          >
            <Group gap={2} wrap="nowrap">
              <IconGauge size={14} stroke={2.5} />
              <Text size="xs" fw={600} style={{ fontSize: '10px' }}>
                {playbackSpeed}x
              </Text>
            </Group>
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Playback Speed</Menu.Label>
          {speedOptions.map((speed) => (
            <Menu.Item
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              style={{
                backgroundColor: speed === playbackSpeed ? theme.colors.accent1[1] : undefined,
                fontWeight: speed === playbackSpeed ? 600 : 400,
              }}
            >
              {speed}x {speed === 1.0 && '(Normal)'}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.speedDown} label="Decrease speed">
        <ActionIcon
          variant="light"
          size={28}
          radius="md"
          onClick={decreaseSpeed}
          disabled={playbackSpeed <= 0.25}
          aria-label="Decrease playback speed"
          styles={{
            root: getNormalButtonStyles(theme),
          }}
        >
          <IconChevronDown size={14} stroke={2.5} />
        </ActionIcon>
      </ShortcutTooltip>

      <Menu shadow="sm" width={120} position="top" offset={4}>
        <Menu.Target>
          <ActionIcon
            variant="light"
            size={32}
            radius="md"
            aria-label={`Playback speed: ${playbackSpeed}x`}
            styles={{
              root: {
                ...getNormalButtonStyles(theme),
                minWidth: 60,
              },
            }}
          >
            <Group gap={4} wrap="nowrap">
              <IconGauge size={16} stroke={2.5} />
              <Text size="sm" fw={600} c={textColor} style={{ fontSize: '12px' }}>
                {playbackSpeed}x
              </Text>
            </Group>
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Playback Speed</Menu.Label>
          {speedOptions.map((speed) => (
            <Menu.Item
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              style={{
                backgroundColor: speed === playbackSpeed ? theme.colors.accent2[1] : undefined,
                fontWeight: speed === playbackSpeed ? 600 : 400,
                color: speed === playbackSpeed ? theme.colors.accent2[9] : undefined,
              }}
            >
              {speed}x {speed === 1.0 && '(Normal)'}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.speedUp} label="Increase speed">
        <ActionIcon
          variant="light"
          size={28}
          radius="md"
          onClick={increaseSpeed}
          disabled={playbackSpeed >= 2.0}
          aria-label="Increase playback speed"
          styles={{
            root: getNormalButtonStyles(theme),
          }}
        >
          <IconChevronUp size={14} stroke={2.5} />
        </ActionIcon>
      </ShortcutTooltip>
    </Group>
  );
}
