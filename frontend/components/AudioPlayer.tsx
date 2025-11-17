'use client';

import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { Song } from '@/lib/api';
import { useEffect } from 'react';
import {
  Group,
  ActionIcon,
  Slider,
  Text,
  Image,
  Box,
  useMantineTheme,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconPlayerSkipBack,
  IconVolume,
  IconVolume2,
  IconVolume3,
  IconVolumeOff,
} from '@tabler/icons-react';
import FavoriteButton from '@/components/FavoriteButton';

interface AudioPlayerProps {
  song: Song | null;
  onSongChange?: (song: Song | null) => void;
}

export default function AudioPlayer({ song, onSongChange }: AudioPlayerProps) {
  const theme = useMantineTheme();
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    loading,
    queue,
    currentIndex,
    play,
    pause,
    seek,
    setVolume,
    loadSong,
    next,
    previous,
  } = useAudioPlayerContext();

  // Enhanced colors for better visibility
  const textColor = theme.colors.primary[9];
  const borderColor = theme.colors.accent1[4];
  const hoverBg = theme.colors.accent1[1];
  const hoverBorder = theme.colors.accent1[5];
  const trackBg = theme.colors.accent1[2];
  const playerBg = `linear-gradient(135deg, ${theme.colors.primary[0]} 0%, ${theme.colors.accent2[0]} 100%)`;



  // Load song when prop changes
  useEffect(() => {
    if (song && song.id !== currentSong?.id) {
      loadSong(song);
    }
  }, [song, currentSong, loadSong]);

  // Notify parent of song changes
  useEffect(() => {
    if (onSongChange) {
      onSongChange(currentSong);
    }
  }, [currentSong, onSongChange]);



  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const renderVolumeIcon = (size: number) => {
    if (volume === 0) return <IconVolumeOff size={size} />;
    if (volume < 0.33) return <IconVolume3 size={size} />;
    if (volume < 0.66) return <IconVolume2 size={size} />;
    return <IconVolume size={size} />;
  };

  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;

  if (!currentSong) {
    return (
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: playerBg,
          backdropFilter: 'blur(20px)',
          borderTop: `2px solid ${theme.colors.accent1[3]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          boxShadow: theme.shadows.md,
        }}
      >
        <Text c="dimmed" size="sm" fw={500}>
          No song playing
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: playerBg,
        backdropFilter: 'blur(20px)',
        borderTop: `2px solid ${theme.colors.accent1[3]}`,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        zIndex: 100,
        boxShadow: theme.shadows.md,
      }}
    >
      {/* Desktop Layout */}
      <Group
        justify="space-between"
        align="center"
        h="100%"
        visibleFrom="md"
        wrap="nowrap"
        gap="lg"
      >
        {/* Left: Album Art and Song Info */}
        <Group gap="xs" style={{ minWidth: 0, flex: '0 0 200px' }}>
          <Box
            style={{
              position: 'relative',
              borderRadius: theme.radius.sm,
              overflow: 'hidden',
              boxShadow: theme.shadows.xs,
            }}
          >
            <Image
              src={currentSong.albumArt || null}
              alt={currentSong.title}
              w={40}
              h={40}
              radius="sm"
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e0e0e0'/%3E%3Cpath d='M14 10v20l14-10z' fill='%23999'/%3E%3C/svg%3E"
            />
          </Box>
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Group gap={4} wrap="nowrap">
              <Text 
                size="sm" 
                fw={600} 
                truncate 
                c={textColor}
                style={{ fontSize: '13px', flex: 1, minWidth: 0 }}
              >
                {currentSong.title}
              </Text>
              <FavoriteButton songId={currentSong.id} size="sm" />
            </Group>
            <Text 
              size="xs" 
              truncate 
              c="dimmed"
              style={{ fontSize: '11px' }}
            >
              {currentSong.artist}
            </Text>
          </Box>
        </Group>

        {/* Center: Playback Controls */}
        <Box style={{ flex: '1 1 auto', maxWidth: 600 }}>
          <Group gap="xs" justify="center" mb={4}>
            <ActionIcon
              variant="light"
              color="accent1"
              size={32}
              radius="md"
              onClick={previous}
              disabled={!hasPrevious}
              aria-label="Previous song"
              styles={{
                root: {
                  border: `1px solid ${borderColor}`,
                  '&:hover': {
                    backgroundColor: hoverBg,
                    borderColor: hoverBorder,
                  },
                  transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
                },
              }}
            >
              <IconPlayerSkipBack size={16} stroke={2.5} />
            </ActionIcon>

            <ActionIcon
              variant="gradient"
              gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
              size={38}
              radius="xl"
              onClick={togglePlayPause}
              disabled={loading}
              loading={loading}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              styles={{
                root: {
                  boxShadow: theme.shadows.md,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: theme.shadows.lg,
                  },
                  transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
                },
              }}
            >
              {isPlaying ? (
                <IconPlayerPause size={18} stroke={2.5} />
              ) : (
                <IconPlayerPlay size={18} stroke={2.5} style={{ marginLeft: '2px' }} />
              )}
            </ActionIcon>

            <ActionIcon
              variant="light"
              color="accent1"
              size={32}
              radius="md"
              onClick={next}
              disabled={!hasNext}
              aria-label="Next song"
              styles={{
                root: {
                  border: `1px solid ${borderColor}`,
                  '&:hover': {
                    backgroundColor: hoverBg,
                    borderColor: hoverBorder,
                  },
                  transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
                },
              }}
            >
              <IconPlayerSkipForward size={16} stroke={2.5} />
            </ActionIcon>
          </Group>

          <Slider
            value={currentTime}
            onChange={seek}
            max={duration || 0}
            min={0}
            disabled={loading || !duration}
            style={{ width: '100%' }}
            size="xs"
            styles={{
              thumb: {
                borderWidth: 2,
                padding: 3,
              },
              track: {
                '&::before': {
                  backgroundColor: trackBg,
                },
              },
            }}
          />
        </Box>

        {/* Right: Volume Control */}
        <Group gap="xs" style={{ flex: '0 0 90px' }} justify="flex-end">
          <ActionIcon
            variant="light"
            color="accent1"
            size={28}
            radius="md"
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            aria-label="Toggle mute"
            styles={{
              root: {
                border: `1px solid ${borderColor}`,
                '&:hover': {
                  backgroundColor: hoverBg,
                },
                transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
              },
            }}
          >
            {renderVolumeIcon(14)}
          </ActionIcon>
          <Slider
            value={volume}
            onChange={setVolume}
            max={1}
            min={0}
            step={0.01}
            style={{ width: 55 }}
            size="xs"
            aria-label="Volume"
            styles={{
              thumb: {
                borderWidth: 2,
                padding: 2,
              },
              track: {
                '&::before': {
                  backgroundColor: trackBg,
                },
              },
            }}
          />
        </Group>
      </Group>

      {/* Mobile Layout */}
      <Group justify="space-between" align="center" hiddenFrom="md" h="100%" wrap="nowrap">
        {/* Album Art and Song Info */}
        <Group gap="xs" style={{ minWidth: 0, flex: 1 }}>
          <Box
            style={{
              borderRadius: theme.radius.sm,
              overflow: 'hidden',
              boxShadow: theme.shadows.xs,
            }}
          >
            <Image
              src={currentSong.albumArt || null}
              alt={currentSong.title}
              w={36}
              h={36}
              radius="sm"
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' fill='%23e0e0e0'/%3E%3Cpath d='M12 9v18l13-9z' fill='%23999'/%3E%3C/svg%3E"
            />
          </Box>
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text 
              size="xs" 
              fw={600} 
              truncate 
              c={textColor}
              style={{ fontSize: '12px' }}
            >
              {currentSong.title}
            </Text>
            <Text 
              size="xs" 
              truncate 
              c="dimmed"
              style={{ fontSize: '10px' }}
            >
              {currentSong.artist}
            </Text>
          </Box>
        </Group>

        {/* Playback Controls */}
        <Group gap={4}>
          <ActionIcon
            variant="light"
            color="accent1"
            size={32}
            radius="md"
            onClick={previous}
            disabled={!hasPrevious}
            aria-label="Previous song"
            styles={{
              root: {
                border: `1px solid ${borderColor}`,
                '&:hover': {
                  backgroundColor: hoverBg,
                },
                transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
              },
            }}
          >
            <IconPlayerSkipBack size={14} stroke={2.5} />
          </ActionIcon>

          <ActionIcon
            variant="gradient"
            gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
            size={38}
            radius="xl"
            onClick={togglePlayPause}
            disabled={loading}
            loading={loading}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            styles={{
              root: {
                boxShadow: theme.shadows.md,
                transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
              },
            }}
          >
            {isPlaying ? (
              <IconPlayerPause size={18} stroke={2.5} />
            ) : (
              <IconPlayerPlay size={18} stroke={2.5} style={{ marginLeft: '2px' }} />
            )}
          </ActionIcon>

          <ActionIcon
            variant="light"
            color="accent1"
            size={32}
            radius="md"
            onClick={next}
            disabled={!hasNext}
            aria-label="Next song"
            styles={{
              root: {
                border: `1px solid ${borderColor}`,
                '&:hover': {
                  backgroundColor: hoverBg,
                },
                transition: `all ${theme.other.transitionDuration.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
              },
            }}
          >
            <IconPlayerSkipForward size={14} stroke={2.5} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
}
