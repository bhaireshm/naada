'use client';

import { Group, Text, ActionIcon, Menu, useMantineTheme, Slider, Stack } from '@mantine/core';
import { IconGauge } from '@tabler/icons-react';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { ShortcutTooltip } from '@/components/ShortcutTooltip';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';

export default function PlaybackSpeedControl() {
  const theme = useMantineTheme();
  const { playbackSpeed, setPlaybackSpeed } = useAudioPlayerContext();

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  
  // Convert speed to slider value (0-100)
  const speedToSlider = (speed: number) => ((speed - 0.5) / 1.5) * 100;
  const sliderToSpeed = (value: number) => 0.5 + (value / 100) * 1.5;

  const handleSliderChange = (value: number) => {
    const speed = sliderToSpeed(value);
    // Round to nearest 0.25
    const roundedSpeed = Math.round(speed * 4) / 4;
    setPlaybackSpeed(Math.max(0.5, Math.min(2.0, roundedSpeed)));
  };

  return (
    <Menu shadow="md" width={200} position="top" offset={8}>
      <Menu.Target>
        <ShortcutTooltip 
          shortcut={KEYBOARD_SHORTCUTS.speedUp} 
          label={`Playback speed: ${playbackSpeed}x`}
        >
          <ActionIcon
            variant="light"
            color="accent1"
            size={32}
            radius="md"
            aria-label={`Playback speed: ${playbackSpeed}x`}
            styles={{
              root: {
                border: `1px solid ${theme.colors.accent1[4]}`,
                minWidth: 56,
                '&:hover': {
                  backgroundColor: theme.colors.accent1[1],
                  borderColor: theme.colors.accent1[5],
                },
                transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
              },
            }}
          >
            <Group gap={4} wrap="nowrap">
              <IconGauge size={16} stroke={2} />
              <Text size="xs" fw={600} style={{ fontSize: '11px' }}>
                {playbackSpeed}x
              </Text>
            </Group>
          </ActionIcon>
        </ShortcutTooltip>
      </Menu.Target>

      <Menu.Dropdown p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="xs" fw={600} c="dimmed">
              Playback Speed
            </Text>
            <Text size="xs" fw={700} c="accent1">
              {playbackSpeed}x
            </Text>
          </Group>

          {/* Slider */}
          <Slider
            value={speedToSlider(playbackSpeed)}
            onChange={handleSliderChange}
            min={0}
            max={100}
            step={12.5} // Steps of 0.25x
            marks={[
              { value: 0, label: '0.5x' },
              { value: 33.33, label: '1x' },
              { value: 100, label: '2x' },
            ]}
            size="sm"
            color="accent1"
            styles={{
              markLabel: {
                fontSize: '9px',
                marginTop: 4,
              },
            }}
          />

          {/* Quick preset buttons */}
          <Group gap="xs" justify="center">
            {speedOptions.map((speed) => (
              <ActionIcon
                key={speed}
                variant={speed === playbackSpeed ? 'filled' : 'light'}
                color="accent1"
                size="sm"
                radius="md"
                onClick={() => setPlaybackSpeed(speed)}
                style={{
                  minWidth: 36,
                  fontWeight: speed === playbackSpeed ? 600 : 400,
                }}
              >
                <Text size="xs" style={{ fontSize: '10px' }}>
                  {speed}x
                </Text>
              </ActionIcon>
            ))}
          </Group>

          <Text size="xs" c="dimmed" ta="center">
            Use {KEYBOARD_SHORTCUTS.speedUp.key} / {KEYBOARD_SHORTCUTS.speedDown.key} to adjust
          </Text>
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
}
