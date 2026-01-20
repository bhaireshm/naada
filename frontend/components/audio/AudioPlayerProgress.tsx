// Extracted progress bar component following SRP
'use client';

import { Box, Group, Slider, Text, useMantineTheme } from '@mantine/core';
import { useRef, useState } from 'react';

interface AudioPlayerProgressProps {
  readonly currentTime: number;
  readonly duration: number;
  readonly loading: boolean;
  readonly onSeek: (time: number) => void;
  readonly size?: 'sm' | 'md' | 'lg';
}

export function AudioPlayerProgress({
  currentTime,
  duration,
  loading,
  onSeek,
  size = 'md',
}: AudioPlayerProgressProps) {
  const theme = useMantineTheme();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverLeft, setHoverLeft] = useState<number>(0);

  const formatTime = (time: number) => {
    if (Number.isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;
    setHoverTime(time);
    setHoverLeft(x);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setIsHovering(false);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;
    onSeek(time);
  };

  const sliderSize = size === 'lg' ? 'md' : 'xs';
  const thumbSize = size === 'lg' ? 16 : 10;
  const showTimeLabels = size !== 'sm';

  if (size === 'sm') {
    // Mobile progress bar (no time labels, positioned at top)
    return (
      <Slider
        value={currentTime}
        onChange={onSeek}
        max={duration || 1}
        min={0}
        disabled={loading || !duration}
        size="xs"
        color="dark"
        thumbSize={0}
        style={{
          position: 'absolute',
          top: -1,
          left: 0,
          right: 0,
          zIndex: 101,
        }}
        styles={{
          track: { borderRadius: 0 },
          bar: { borderRadius: 0 },
        }}
        aria-label="Seek position"
      />
    );
  }

  return (
    <Group w="100%" gap="xs" align="center">
      {showTimeLabels && (
        <Text 
          size="xs" 
          c="dimmed" 
          style={{ 
            fontVariantNumeric: 'tabular-nums', 
            minWidth: 35, 
            textAlign: 'right' 
          }}
        >
          {formatTime(currentTime)}
        </Text>
      )}
      
      <Box
        ref={progressBarRef}
        style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleProgressBarClick}
      >
        {hoverTime !== null && (
          <Box
            style={{
              position: 'absolute',
              left: hoverLeft,
              bottom: '100%',
              marginBottom: 5,
              transform: 'translateX(-50%)',
              backgroundColor: theme.colors.dark[8],
              color: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
              boxShadow: theme.shadows.sm,
            }}
          >
            {formatTime(hoverTime)}
          </Box>
        )}
        
        <Slider
          value={currentTime}
          onChange={onSeek}
          max={duration || 1}
          min={0}
          disabled={loading || !duration}
          style={{ width: '100%' }}
          size={sliderSize}
          color="dark"
          thumbSize={thumbSize}
          aria-label="Seek position"
          styles={{
            thumb: {
              transition: 'opacity 0.2s',
              opacity: isHovering ? 1 : 0,
              ...(size === 'lg' && { borderWidth: 0, boxShadow: theme.shadows.sm }),
            },
            track: {
              cursor: 'pointer',
              ...(size === 'lg' && { backgroundColor: theme.colors.gray[3] }),
            },
          }}
          label={null}
        />
      </Box>
      
      {showTimeLabels && (
        <Text 
          size="xs" 
          c="dimmed" 
          style={{ fontVariantNumeric: 'tabular-nums', minWidth: 35 }}
        >
          {formatTime(duration)}
        </Text>
      )}
    </Group>
  );
}