'use client';

import { useRouter } from 'next/navigation';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { Song } from '@/lib/api';
import { useSongActions } from '@/hooks/useSongActions';
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
  Drawer,
  Button,
  Portal,
  Menu,
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
  IconChevronDown,
  IconTrash,
  IconDots,
  IconPlaylistAdd,
  IconInfoCircle,
  IconDownload,
  IconCheck,
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
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import { downloadManager } from '@/lib/offline/downloadManager';
import { notifications } from '@mantine/notifications';
import { getSongStreamUrl } from '@/lib/api';
import { formatArtists } from '@/lib/artistUtils';

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
    removeFromQueue,
    reorderQueue,
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverLeft, setHoverLeft] = useState<number>(0);

  useEffect(() => {
    if (!currentSong) return;
    const checkOfflineStatus = async () => {
      const offline = await downloadManager.isSongOffline(currentSong.id);
      setIsOffline(offline);
    };
    checkOfflineStatus();
  }, [currentSong?.id]);

  const handleDownload = async () => {
    if (!currentSong) return;

    if (isOffline) {
      // Remove from offline storage
      try {
        await downloadManager.removeSong(currentSong.id);
        setIsOffline(false);
        notifications.show({
          title: 'Removed from Offline',
          message: `${currentSong.title} removed from offline storage`,
          color: 'blue',
        });
      } catch (err) {
        notifications.show({
          title: 'Error',
          message: 'Failed to remove song from offline storage',
          color: 'red',
        });
      }
      return;
    }

    // Download song for offline
    try {
      const songUrl = getSongStreamUrl(currentSong.id);
      const artist = Array.isArray(currentSong.artist) ? formatArtists(currentSong.artist) : currentSong.artist;

      await downloadManager.queueDownload(
        currentSong.id,
        currentSong.title,
        artist,
        songUrl,
        1,
        (progress) => {
          if (progress.status === 'completed') {
            setIsOffline(true);
            notifications.show({
              title: 'Download Complete',
              message: `${currentSong.title} is now available offline`,
              color: 'green',
            });
          } else if (progress.status === 'failed') {
            notifications.show({
              title: 'Download Failed',
              message: progress.error || 'Failed to download song',
              color: 'red',
            });
          }
        }
      );

      notifications.show({
        title: 'Download Started',
        message: `Downloading ${currentSong.title}...`,
        color: 'blue',
      });
    } catch (error) {
      console.error('Download error:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to start download',
        color: 'red',
      });
    }
  };


  // Use song actions hook for current song (always call to avoid hook order issues)
  const songActions = useSongActions(currentSong || { id: '', title: '', artist: '', mimeType: '', createdAt: '' }, {
    onDeleteSuccess: () => {
      if (currentSong) {
        const currentIndex = queue.findIndex(s => s.id === currentSong.id);
        if (currentIndex !== -1) {
          removeFromQueue(currentIndex);
        }
      }
    },
  });

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
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;
    seek(time);
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
    if (isNaN(time)) return '0:00';
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
          width: '100%',
          height: '100%',
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
      {/* Queue Sidebar */}
      <QueueOverlay
        isOpen={showQueue}
        queue={queue}
        currentIndex={currentIndex}
        onPlay={(index) => {
          jumpToQueueIndex(index);
        }}
        onClose={() => setShowQueue(false)}
        zIndex={10000}
        onReorder={reorderQueue}
        onRemove={removeFromQueue}
        isPlaying={isPlaying}
      />

      {/* Lyrics Overlay */}
      {/* Lyrics Overlay */}
      {showLyrics && (
        <Portal>
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
              zIndex: 10000,
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
                  <Button variant="light" size="xs" leftSection={<IconEdit size={14} />} onClick={songActions.handleEdit}>
                    Add Lyrics
                  </Button>
                </Stack>
              )}
            </ScrollArea>
          </Box>
        </Portal>
      )}

      {currentSong && (
        <EditSongModal
          opened={songActions.editModalOpen}
          onClose={songActions.closeEditModal}
          song={currentSong}
          onSuccess={() => {
            // Song will be updated in the queue automatically on next play
            songActions.closeEditModal();
          }}
        />
      )}

      <Box
        style={{
          width: '100%',
          height: '100%',
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
                  <ActionIcon variant="subtle" size="sm" color="gray" onClick={songActions.handleEdit}>
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

          <Group
            justify="space-between"
            align="center"
            wrap="nowrap"
            gap="xs"
            px="xs"
            onClick={() => setIsExpanded(true)}
            style={{ cursor: 'pointer' }}
          >
            {/* Album Art and Song Info */}
            <Group gap="xs" style={{ minWidth: 0, flex: 1 }}>
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
            <div onClick={(e) => e.stopPropagation()}>
              <FavoriteButton songId={currentSong.id} size="md" />
            </div>

            {/* Play/Pause Button */}
            <ActionIcon
              variant="filled"
              color="dark"
              size="lg"
              radius="xl"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
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

        {/* Expanded Mobile Player Drawer */}
        <Drawer
          opened={isExpanded}
          onClose={() => setIsExpanded(false)}
          position="bottom"
          size="100%"
          withCloseButton={false}
          transitionProps={{ transition: 'slide-up', duration: 250 }}
          styles={{
            body: {
              height: '100%',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              background: theme.colors.gray[0], // Light background
            }
          }}
          zIndex={1000}
        >
          {/* Header */}
          <Group justify="space-between" p="md" pt="xl">
            <ActionIcon variant="subtle" color="dark" onClick={() => setIsExpanded(false)}>
              <IconChevronDown size={24} />
            </ActionIcon>
            <Text fw={600} size="sm" tt="uppercase" c="dimmed">Now Playing</Text>
            <Menu position="bottom-end" shadow="md" width={200} zIndex={2002}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="dark">
                  <IconDots size={24} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconInfoCircle size={16} />}
                  onClick={() => {
                    setIsExpanded(false);
                    router.push(`/songs/${currentSong.id}`);
                  }}
                >
                  Details
                </Menu.Item>
                <Menu
                  trigger="click"
                  position="left-start"
                  offset={2}
                  withArrow
                  zIndex={2003}
                >
                  <Menu.Target>
                    <Menu.Item leftSection={<IconPlaylistAdd size={16} />}>
                      Add to Playlist
                    </Menu.Item>
                  </Menu.Target>
                  <AddToPlaylistMenu songId={currentSong.id} />
                </Menu>
                <Menu.Item
                  leftSection={isOffline ? <IconCheck size={16} /> : <IconDownload size={16} />}
                  onClick={handleDownload}
                  color={isOffline ? 'green' : undefined}
                >
                  {isOffline ? 'Remove from Offline' : 'Download for Offline'}
                </Menu.Item>
                {songActions.canDelete && (
                  <Menu.Item
                    leftSection={<IconTrash size={16} />}
                    color="red"
                    onClick={() => {
                      setIsExpanded(false);
                      songActions.handleDelete();
                    }}
                  >
                    Delete Song
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>

          {/* Main Content */}
          <Stack
            flex={1}
            justify="center"
            align="center"
            gap="xl"
            px="xl"
            pb="xl"
            style={{ overflowY: 'auto' }}
          >
            {/* Large Album Art */}
            <Box
              style={{
                borderRadius: theme.radius.md,
                overflow: 'hidden',
                boxShadow: theme.shadows.xl,
                width: '100%',
                maxWidth: 320,
                aspectRatio: '1/1',
              }}
            >
              <Image
                src={currentSong.albumArt || null}
                alt={currentSong.title}
                w="100%"
                h="100%"
                fit="cover"
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23e0e0e0'/%3E%3Cpath d='M120 100v100l80-50z' fill='%23999'/%3E%3C/svg%3E"
              />
            </Box>

            {/* Song Info */}
            <Stack gap={4} align="center" w="100%">
              <Group justify="space-between" w="100%" align="flex-start" wrap="nowrap">
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xl" fw={700} truncate c="dark" style={{ fontSize: '24px', lineHeight: 1.2 }}>
                    {currentSong.title}
                  </Text>
                  <ArtistName
                    artist={currentSong.artist}
                    size="md"
                    truncate
                    c="dimmed"
                    style={{ fontSize: '18px' }}
                  />
                </Box>
                <FavoriteButton songId={currentSong.id} size="lg" />
              </Group>
            </Stack>

            {/* Progress Bar */}
            <Stack gap={8} w="100%">
              <Slider
                value={currentTime}
                onChange={seek}
                max={duration || 1}
                min={0}
                disabled={loading || !duration}
                size="md"
                color="dark"
                thumbSize={16}
                styles={{
                  thumb: { borderWidth: 0, boxShadow: theme.shadows.sm },
                  track: { backgroundColor: theme.colors.gray[3] },
                }}
              />
              <Group justify="space-between">
                <Text size="xs" c="dimmed">{formatTime(currentTime)}</Text>
                <Text size="xs" c="dimmed">{formatTime(duration)}</Text>
              </Group>
            </Stack>

            {/* Main Controls */}
            <Group justify="space-between" w="100%" px="md">
              <ShuffleButton size={24} />

              <ActionIcon
                variant="transparent"
                color="dark"
                size="xl"
                onClick={previous}
                disabled={!hasPrevious}
              >
                <IconPlayerSkipBack size={32} fill="currentColor" />
              </ActionIcon>

              <ActionIcon
                variant="filled"
                color="dark"
                size={72}
                radius="xl"
                onClick={togglePlayPause}
                disabled={loading}
                loading={loading}
                style={{ boxShadow: theme.shadows.md }}
              >
                {isPlaying ? (
                  <IconPlayerPause size={32} fill="currentColor" />
                ) : (
                  <IconPlayerPlay size={32} fill="currentColor" style={{ marginLeft: 4 }} />
                )}
              </ActionIcon>

              <ActionIcon
                variant="transparent"
                color="dark"
                size="xl"
                onClick={next}
                disabled={!hasNext}
              >
                <IconPlayerSkipForward size={32} fill="currentColor" />
              </ActionIcon>

              <RepeatButton size={24} />
            </Group>

            {/* Footer Actions - All in single row */}
            <Group justify="center" w="100%" px="xs" mt="md" gap="md" wrap="nowrap">
              <ActionIcon
                variant={showLyrics ? "filled" : "subtle"}
                color={showLyrics ? "primary" : "dark"}
                size="md"
                onClick={() => setShowLyrics(!showLyrics)}
              >
                <IconMicrophone size={18} />
              </ActionIcon>

              <ActionIcon
                variant={showQueue ? "filled" : "subtle"}
                color={showQueue ? "primary" : "dark"}
                size="md"
                onClick={() => setShowQueue(!showQueue)}
              >
                <IconList size={18} />
              </ActionIcon>

              <ActionIcon
                variant="subtle"
                color="dark"
                size="md"
                onClick={toggleMute}
              >
                {renderVolumeIcon(18)}
              </ActionIcon>

              <PlaybackSpeedControl />
            </Group>
          </Stack>
        </Drawer>
      </Box>
    </>
  );
}
