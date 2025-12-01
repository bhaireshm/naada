'use client';

import { useRouter } from 'next/navigation';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { Song } from '@/lib/api';
import { useEffect, useState, useRef } from 'react';
import {
  Group,
  ActionIcon,
  Slider,
  Text,
  Image,
  Box,
  useMantineTheme,
  Stack,
  Tooltip,
  ScrollArea,
  Button,
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
  IconList,
  IconMicrophone,
  IconEdit,
  IconX,
} from '@tabler/icons-react';
import FavoriteButton from '@/components/FavoriteButton';
import { ShortcutTooltip } from '@/components/ShortcutTooltip';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';
import ShuffleButton from '@/components/ShuffleButton';
import RepeatButton from '@/components/RepeatButton';
import PlaybackSpeedControl from '@/components/PlaybackSpeedControl';
import ArtistName from '@/components/ArtistName';
import EditSongModal from '@/components/EditSongModal';
import QueueOverlay from '@/components/QueueOverlay';

interface AudioPlayerProps {
  song: Song | null;
  onSongChange?: (song: Song | null) => void;
}

export default function AudioPlayer({ song, onSongChange }: AudioPlayerProps) {
  const router = useRouter();
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
    isMuted,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    loadSong,
    next,
    previous,
    jumpToQueueIndex,
  } = useAudioPlayerContext();

  // Enhanced colors for better visibility
  const textColor = theme?.colors?.primary?.[9] || 'black';
  const playerBg = theme?.colors ? `linear-gradient(135deg, ${theme.colors.primary[0]} 0%, ${theme.colors.accent2[0]} 100%)` : 'white';

  // Announce volume changes for screen readers
  const volumeAnnouncement = isMuted
    ? 'Muted'
    : `Volume ${Math.round(volume * 100)} percent`;

  const [isHovering, setIsHovering] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverLeft, setHoverLeft] = useState<number>(0);

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
    setIsHovering(false);
    setHoverTime(null);
  };

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
    if (isMuted || volume === 0) return <IconVolumeOff size={size} />;
    if (volume < 0.33) return <IconVolume3 size={size} />;
    if (volume < 0.66) return <IconVolume2 size={size} />;
    return <IconVolume size={size} />;
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
          height: 80,
          background: playerBg,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${theme.colors.gray[2]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          boxShadow: theme.shadows.md,
        }}
        role="region"
        aria-label="Audio player"
      >
        <Text c="dimmed" size="sm" fw={500}>
          No song playing
        </Text>
      </Box>
    );
  }

  return (
    <>
      {/* Queue Overlay */}
      <QueueOverlay
        isOpen={showQueue}
        queue={queue}
        currentIndex={currentIndex}
        onPlay={(index) => {
          jumpToQueueIndex(index);
        }}
        onClose={() => setShowQueue(false)}
      />

      {/* Lyrics Overlay */}
      {showLyrics && (
        <Box
          style={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: 350,
            maxWidth: '100vw',
            height: 'calc(100vh - 180px)', // Leave space for header/footer
            background: theme?.colors?.dark?.[7] || '#333',
            borderRadius: theme?.radius?.md || 8,
            boxShadow: theme?.shadows?.xl || 'none',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: `1px solid ${theme?.colors?.dark?.[4] || '#555'}`,
          }}
        >
          <Group justify="space-between" p="md" style={{ borderBottom: `1px solid ${theme?.colors?.dark?.[6] || '#444'}` }}>
            <Text fw={700} size="lg">Lyrics</Text>
            <ActionIcon variant="subtle" color="gray" onClick={() => setShowLyrics(false)}>
              <IconX size={20} />
            </ActionIcon>
          </Group>
          <ScrollArea style={{ flex: 1 }} p="md">
            {currentSong.lyrics ? (
              <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {currentSong.lyrics}
              </Text>
            ) : (
              <Stack align="center" justify="center" h={200} gap="xs">
                <Text c="dimmed">No lyrics available</Text>
                <Button variant="light" size="xs" leftSection={<IconEdit size={14} />} onClick={() => setEditModalOpen(true)}>
                  Add Lyrics
                </Button>
              </Stack>
            )}
          </ScrollArea>
        </Box>
      )}

      <EditSongModal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        song={currentSong}
        onSuccess={() => {
          // Refresh song data if needed, but currentSong should update via context/API eventually
          // Ideally we should reload the song metadata
        }}
      />

      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background: playerBg,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${theme.colors.gray[2]}`,
          padding: `0 ${theme.spacing.md}`,
          zIndex: 100,
          boxShadow: theme.shadows.md,
          display: 'flex',
          alignItems: 'center',
        }}
        role="region"
        aria-label="Audio player"
      >
        {/* ARIA live region for volume announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {volumeAnnouncement}
        </div>

        {/* Desktop Layout */}
        <Group
          justify="space-between"
          align="center"
          w="100%"
          visibleFrom="md"
          wrap="nowrap"
          gap="lg"
        >
          {/* Left: Album Art and Song Info */}
          <Group
            gap="sm"
            style={{ minWidth: 0, flex: '0 0 250px', cursor: 'pointer' }}
            onClick={() => router.push(`/songs/${currentSong.id}`)}
          >
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
                w={56}
                h={56}
                radius="sm"
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Crect width='56' height='56' fill='%23e0e0e0'/%3E%3Cpath d='M20 16v24l18-12z' fill='%23999'/%3E%3C/svg%3E"
              />
            </Box>
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Group gap={4} wrap="nowrap">
                <Text
                  size="sm"
                  fw={600}
                  truncate
                  c={textColor}
                  style={{ fontSize: '14px', flex: 1, minWidth: 0 }}
                >
                  {currentSong.title}
                </Text>
                <div onClick={(e) => e.stopPropagation()}>
                  <FavoriteButton songId={currentSong.id} size="sm" />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ActionIcon variant="subtle" size="sm" color="gray" onClick={() => setEditModalOpen(true)}>
                    <IconEdit size={14} />
                  </ActionIcon>
                </div>
              </Group>
              <ArtistName
                artist={currentSong.artist}
                size="xs"
                truncate
                c="dimmed"
                style={{ fontSize: '12px' }}
              />
            </Box>
          </Group>

          {/* Center: Playback Controls and Progress */}
          <Stack gap={4} style={{ flex: '1 1 auto', maxWidth: 600 }} align="center">
            <Group gap="md" justify="center">
              <ShuffleButton size={20} />

              <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.previousSong} label="Previous">
                <ActionIcon
                  variant="subtle"
                  color="dark"
                  size="lg"
                  radius="xl"
                  onClick={previous}
                  disabled={!hasPrevious}
                  aria-label="Previous song"
                >
                  <IconPlayerSkipBack size={20} fill="currentColor" />
                </ActionIcon>
              </ShortcutTooltip>

              <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.playPause} label={isPlaying ? 'Pause' : 'Play'}>
                <ActionIcon
                  variant="filled"
                  color="dark"
                  size={40}
                  radius="xl"
                  onClick={togglePlayPause}
                  disabled={loading}
                  loading={loading}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  style={{
                    transition: 'transform 0.1s ease',
                  }}
                >
                  {isPlaying ? (
                    <IconPlayerPause size={20} fill="currentColor" />
                  ) : (
                    <IconPlayerPlay size={20} fill="currentColor" style={{ marginLeft: 2 }} />
                  )}
                </ActionIcon>
              </ShortcutTooltip>

              <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.nextSong} label="Next">
                <ActionIcon
                  variant="subtle"
                  color="dark"
                  size="lg"
                  radius="xl"
                  onClick={next}
                  disabled={!hasNext}
                  aria-label="Next song"
                >
                  <IconPlayerSkipForward size={20} fill="currentColor" />
                </ActionIcon>
              </ShortcutTooltip>

              <RepeatButton size={20} />
            </Group>

            <Group w="100%" gap="xs" align="center">
              <Text size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 35, textAlign: 'right' }}>
                {formatTime(currentTime)}
              </Text>
              <Box
                ref={progressBarRef}
                style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
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
                  onChange={seek}
                  max={duration || 1}
                  min={0}
                  disabled={loading || !duration}
                  style={{ width: '100%' }}
                  size="xs"
                  color="dark"
                  thumbSize={10}
                  aria-label="Seek position"
                  styles={{
                    thumb: {
                      transition: 'opacity 0.2s',
                      opacity: isHovering ? 1 : 0,
                    },
                    track: {
                      cursor: 'pointer',
                    },
                  }}
                  label={null}
                />
              </Box>
              <Text size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 35 }}>
                {formatTime(duration)}
              </Text>
            </Group>
          </Stack>

          {/* Right: Volume and Speed Control */}
          <Group gap="sm" style={{ flex: '0 0 250px' }} justify="flex-end">
            <PlaybackSpeedControl />

            <Group gap={4} align="center">
              <ShortcutTooltip shortcut={KEYBOARD_SHORTCUTS.mute} label={isMuted ? 'Unmute' : 'Mute'}>
                <ActionIcon
                  variant="subtle"
                  color="dark"
                  size="sm"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {renderVolumeIcon(18)}
                </ActionIcon>
              </ShortcutTooltip>
              <Slider
                value={volume}
                onChange={setVolume}
                max={1}
                min={0}
                step={0.01}
                style={{ width: 80 }}
                size="xs"
                color="dark"
                thumbSize={10}
                aria-label="Volume slider"
              />
            </Group>

            <Tooltip label="Lyrics">
              <ActionIcon
                variant={showLyrics ? "filled" : "subtle"}
                color={showLyrics ? "primary" : "dark"}
                onClick={() => setShowLyrics(!showLyrics)}
              >
                <IconMicrophone size={20} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Queue">
              <ActionIcon
                variant={showQueue ? "filled" : "subtle"}
                color={showQueue ? "primary" : "dark"}
                onClick={() => setShowQueue(!showQueue)}
              >
                <IconList size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Mobile Layout */}
        <Box hiddenFrom="md" w="100%">
          {/* Progress Bar at Top */}
          <Slider
            value={currentTime}
            onChange={seek}
            max={duration || 1}
            min={0}
            disabled={loading || !duration}
            size="xs"
            color="dark"
            thumbSize={0} // Hide thumb on mobile
            style={{
              position: 'absolute',
              top: -1,
              left: 0,
              right: 0,
              zIndex: 101
            }}
            styles={{
              track: { borderRadius: 0 },
              bar: { borderRadius: 0 },
            }}
          />

          <Group justify="space-between" align="center" wrap="nowrap" gap="xs" px="xs">
            {/* Album Art and Song Info */}
            <Group gap="xs" style={{ minWidth: 0, flex: 1 }} onClick={() => router.push(`/songs/${currentSong.id}`)}>
              <Image
                src={currentSong.albumArt || null}
                alt={currentSong.title}
                w={48}
                h={48}
                radius="sm"
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23e0e0e0'/%3E%3Cpath d='M18 14v20l16-10z' fill='%23999'/%3E%3C/svg%3E"
              />
              <Box style={{ minWidth: 0, flex: 1 }}>
                <Text size="sm" fw={600} truncate c={textColor}>
                  {currentSong.title}
                </Text>
                <ArtistName
                  artist={currentSong.artist}
                  size="xs"
                  truncate
                  c="dimmed"
                />
              </Box>
            </Group>

            {/* Favorite Button */}
            <FavoriteButton songId={currentSong.id} size="md" />

            {/* Lyrics Button Mobile */}
            <ActionIcon
              variant={showLyrics ? "filled" : "subtle"}
              color={showLyrics ? "primary" : "dark"}
              onClick={() => setShowLyrics(!showLyrics)}
              size="lg"
            >
              <IconMicrophone size={22} />
            </ActionIcon>

            {/* Play/Pause Button */}
            <ActionIcon
              variant="filled"
              color="dark"
              size="lg"
              radius="xl"
              onClick={togglePlayPause}
              disabled={loading}
              loading={loading}
            >
              {isPlaying ? (
                <IconPlayerPause size={22} fill="currentColor" />
              ) : (
                <IconPlayerPlay size={22} fill="currentColor" style={{ marginLeft: 2 }} />
              )}
            </ActionIcon>
          </Group>
        </Box>
      </Box>
    </>
  );
}
