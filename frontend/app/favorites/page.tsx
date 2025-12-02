'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFavorites, Song } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import FavoriteButton from '@/components/FavoriteButton';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import {
  Container,
  Title,
  Table,
  Stack,
  Text,
  ActionIcon,
  Menu,
  Alert,
  Box,
  Group,
  Skeleton,
  useMantineTheme,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconHeart,
  IconDots,
  IconPlaylistAdd,
  IconInfoCircle,
  IconAlertCircle,
  IconMusic,
  IconDownload,
  IconCheck,
} from '@tabler/icons-react';
import PlayingAnimation from '@/components/PlayingAnimation';
import { DownloadButton } from '@/components/DownloadButton';
import { getSongStreamUrl } from '@/lib/api';
import InfiniteScroll from '@/components/InfiniteScroll';
import { notifications } from '@mantine/notifications';
import { IconHeartFilled } from '@tabler/icons-react';
import { downloadManager } from '@/lib/offline/downloadManager';

interface FavoriteSong extends Song {
  favoritedAt: string;
}

// Favorite Menu Item Component to avoid button nesting
function RemoveFavoriteMenuItem({ songId, onRemoved }: { songId: string; onRemoved: () => void }) {
  const { toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const theme = useMantineTheme();

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await toggleFavorite(songId);
      notifications.show({
        title: 'Removed from favorites',
        message: 'Song removed from your favorites',
        color: 'gray',
        icon: <IconHeart size={16} />,
      });
      onRemoved();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove from favorites. Please try again.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Menu.Item
      leftSection={<IconHeartFilled size={16} style={{ color: '#ff6b9d' }} />}
      onClick={handleRemove}
      disabled={isLoading}
      color="pink"
      style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
    >
      Remove from Favorites
    </Menu.Item>
  );
}

function FavoritesPageContent() {
  const [songs, setSongs] = useState<FavoriteSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offlineSongs, setOfflineSongs] = useState<Set<string>>(new Set());
  const { setQueue, isPlaying, currentSong: audioCurrentSong, play, pause } = useAudioPlayerContext();
  const { refreshFavorites } = useFavorites();
  const router = useRouter();
  const theme = useMantineTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch favorites on component mount
  useEffect(() => {
    if (isMounted) {
      fetchFavorites();
    }
  }, [isMounted]);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFavorites();
      const favoriteSongs = (data as { favorites: Array<{ song: Song; createdAt: string }> }).favorites.map((fav) => ({
        ...fav.song,
        favoritedAt: fav.createdAt,
      })) as FavoriteSong[];
      setSongs(favoriteSongs);

      // Check offline status for all songs
      const offlineSet = new Set<string>();
      for (const song of favoriteSongs) {
        const isOffline = await downloadManager.isSongOffline(song.id);
        if (isOffline) {
          offlineSet.add(song.id);
        }
      }
      setOfflineSongs(offlineSet);
    } catch (err) {
      setError('Failed to load favorites. Please try again.');
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll calculations
  const displayedSongs = songs.slice(0, displayCount);
  const hasMore = displayCount < songs.length;

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 20, songs.length));
      setIsLoadingMore(false);
    }, 300);
  };

  const handlePlaySong = (song: FavoriteSong, index: number) => {
    const isCurrentlyPlaying = audioCurrentSong?.id === song.id && isPlaying;

    if (isCurrentlyPlaying) {
      pause();
    } else if (audioCurrentSong?.id === song.id) {
      play();
    } else {
      setQueue(songs, index);
    }
  };

  const handleSongDetails = (songId: string) => {
    router.push(`/songs/${songId}`);
  };

  const handleFavoriteRemoved = async () => {
    await fetchFavorites();
    await refreshFavorites();
  };

  const handleDownload = async (song: FavoriteSong, e: React.MouseEvent) => {
    e.stopPropagation();

    const isOffline = offlineSongs.has(song.id);

    if (isOffline) {
      // Remove from offline storage
      try {
        await downloadManager.removeSong(song.id);
        setOfflineSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
        notifications.show({
          title: 'Removed from Offline',
          message: `${song.title} removed from offline storage`,
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
      const songUrl = getSongStreamUrl(song.id);

      await downloadManager.queueDownload(
        song.id,
        song.title,
        song.artist,
        songUrl,
        1,
        (progress) => {
          if (progress.status === 'completed') {
            setOfflineSongs(prev => new Set(prev).add(song.id));
            notifications.show({
              title: 'Download Complete',
              message: `${song.title} is now available offline`,
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
    } catch (error) {
      console.error('Download failed:', error);
      notifications.show({
        title: 'Download Failed',
        message: 'Failed to download song for offline playback',
        color: 'red',
      });
    }
  };

  return (
    <Box pb={90}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Box
          mb="xl"
          p="xl"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.pink[1]} 0%, ${theme.colors.accent1[1]} 100%)`,
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.md,
          }}
        >
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Group gap="sm">
                <Box
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.pink[6]} 0%, ${theme.colors.pink[7]} 100%)`,
                    borderRadius: '50%',
                    padding: theme.spacing.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconHeart size={32} color={theme.colors.primary[0]} />
                </Box>
                <div>
                  <Title
                    order={1}
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.colors.pink[8]} 0%, ${theme.colors.accent1[7]} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    }}
                  >
                    Liked Songs
                  </Title>
                  <Text c="dimmed" size="sm">
                    {songs.length} {songs.length === 1 ? 'song' : 'songs'}
                  </Text>
                </div>
              </Group>
            </Stack>
          </Group>
        </Box>

        {/* Loading State */}
        {loading && (
          <Stack gap={theme.spacing.md}>
            <Skeleton height={50} radius={theme.radius.md} />
            <Skeleton height={50} radius={theme.radius.md} />
            <Skeleton height={50} radius={theme.radius.md} />
          </Stack>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            title="Error"
            color="red"
            variant="light"
          >
            <Text size="sm" mb="xs">
              {error}
            </Text>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && songs.length === 0 && (
          <Box
            p="xl"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.pink[1]} 0%, ${theme.colors.accent1[1]} 100%)`,
              borderRadius: theme.radius.md,
            }}
          >
            <Stack align="center" gap={theme.spacing.md} py={60}>
              <Box
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.pink[6]} 0%, ${theme.colors.pink[7]} 100%)`,
                  borderRadius: '50%',
                  padding: theme.spacing.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconHeart size={48} stroke={1.5} color={theme.colors.primary[0]} />
              </Box>
              <Title order={3}>
                No liked songs yet
              </Title>
              <Text c="dimmed" size="sm" ta="center" maw={400}>
                Songs you like will appear here. Click the heart icon on any song to add it to your favorites.
              </Text>
            </Stack>
          </Box>
        )}

        {/* Song List - Desktop Table */}
        {!loading && !error && songs.length > 0 && isMounted && (
          <InfiniteScroll
            hasMore={hasMore}
            loading={isLoadingMore}
            onLoadMore={loadMore}
          >
            <Box visibleFrom="md">
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Title</Table.Th>
                    <Table.Th>Artist</Table.Th>
                    <Table.Th>Album</Table.Th>
                    <Table.Th w={100}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {displayedSongs.map((song, index) => (
                    <Table.Tr
                      key={song.id}
                      bg={
                        audioCurrentSong?.id === song.id
                          ? theme.colors.accent1[9]
                          : undefined
                      }
                    >
                      <Table.Td
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSongDetails(song.id)}
                      >
                        <Text fw={audioCurrentSong?.id === song.id ? 600 : 400}>
                          {song.title}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed" size="sm">
                          {song.artist}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed" size="sm">
                          {song.album || '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <ActionIcon
                            variant={audioCurrentSong?.id === song.id ? 'filled' : 'subtle'}
                            color="accent1"
                            onClick={() => handlePlaySong(song, index)}
                            aria-label={audioCurrentSong?.id === song.id && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
                          >
                            {audioCurrentSong?.id === song.id && isPlaying ? (
                              <PlayingAnimation size={18} color="white" />
                            ) : (
                              <IconPlayerPlay size={18} />
                            )}
                          </ActionIcon>
                          <FavoriteButton songId={song.id} size="sm" />
                          <Menu position="bottom-end" shadow="sm" width={160}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray" size={36}>
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown p={4}>
                              <Menu.Item
                                leftSection={<IconPlayerPlay size={14} />}
                                onClick={() => handlePlaySong(song, index)}
                                style={{ fontSize: '13px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                              >
                                Play
                              </Menu.Item>
                              <Menu
                                trigger="hover"
                                position="left-start"
                                offset={2}
                                withArrow
                              >
                                <Menu.Target>
                                  <Menu.Item
                                    leftSection={<IconPlaylistAdd size={14} />}
                                    style={{ fontSize: '13px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                                  >
                                    Add to Playlist
                                  </Menu.Item>
                                </Menu.Target>
                                <AddToPlaylistMenu
                                  songId={song.id}
                                  onSuccess={handleFavoriteRemoved}
                                />
                              </Menu>
                              <Menu.Item
                                leftSection={offlineSongs.has(song.id) ? <IconCheck size={14} /> : <IconDownload size={14} />}
                                onClick={(e) => handleDownload(song, e)}
                                color={offlineSongs.has(song.id) ? 'green' : undefined}
                                style={{ fontSize: '13px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                              >
                                {offlineSongs.has(song.id) ? 'Remove from Offline' : 'Download for Offline'}
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconInfoCircle size={14} />}
                                onClick={() => handleSongDetails(song.id)}
                                style={{ fontSize: '13px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                              >
                                Details
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Song List - Mobile Stack */}
            <Stack gap="xs" hiddenFrom="md">
              {displayedSongs.map((song, index) => (
                <Box
                  key={song.id}
                  p="md"
                  style={{
                    background:
                      audioCurrentSong?.id === song.id
                        ? `linear-gradient(135deg, ${theme.colors.accent1[1]} 0%, ${theme.colors.secondary[1]} 100%)`
                        : theme.colors.primary[9],
                    borderRadius: theme.radius.md,
                    border: audioCurrentSong?.id === song.id
                      ? `1px solid ${theme.colors.accent1[4]}`
                      : `1px solid ${theme.colors.secondary[8]}`,
                    transition: `all ${theme.other.transitionDuration.normal} ${theme.other.easingFunctions.easeInOut}`,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Box
                      style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
                      onClick={() => handleSongDetails(song.id)}
                    >
                      <Text
                        fw={audioCurrentSong?.id === song.id ? 600 : 400}
                        truncate
                      >
                        {song.title}
                      </Text>
                      <Text c="dimmed" size="sm" truncate>
                        {song.artist}
                      </Text>
                    </Box>
                    <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                      <ActionIcon
                        variant={audioCurrentSong?.id === song.id ? 'filled' : 'subtle'}
                        color="accent1"
                        size={44}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaySong(song, index);
                        }}
                        aria-label={audioCurrentSong?.id === song.id && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
                        style={{ minWidth: 44, minHeight: 44 }}
                      >
                        {audioCurrentSong?.id === song.id && isPlaying ? (
                          <PlayingAnimation size={22} color="white" />
                        ) : (
                          <IconPlayerPlay size={22} />
                        )}
                      </ActionIcon>
                      <Menu position="bottom-end" shadow="md" width={180} zIndex={500}>
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size={44}
                            style={{ minWidth: 44, minHeight: 44 }}
                            aria-label="More options"
                          >
                            <IconDots size={20} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown p={4}>
                          <Menu.Item
                            leftSection={<IconPlayerPlay size={16} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaySong(song, index);
                            }}
                            style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                          >
                            Play
                          </Menu.Item>
                          <RemoveFavoriteMenuItem songId={song.id} onRemoved={handleFavoriteRemoved} />
                          <Menu
                            trigger="click"
                            position="left-start"
                            offset={2}
                            withArrow
                            zIndex={501}
                          >
                            <Menu.Target>
                              <Menu.Item
                                leftSection={<IconPlaylistAdd size={16} />}
                                style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                              >
                                Add to Playlist
                              </Menu.Item>
                            </Menu.Target>
                            <AddToPlaylistMenu
                              songId={song.id}
                              onSuccess={handleFavoriteRemoved}
                            />
                          </Menu>
                          <Menu.Item
                            leftSection={offlineSongs.has(song.id) ? <IconCheck size={16} /> : <IconDownload size={16} />}
                            onClick={(e) => handleDownload(song, e)}
                            color={offlineSongs.has(song.id) ? 'green' : undefined}
                            style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                          >
                            {offlineSongs.has(song.id) ? 'Remove from Offline' : 'Download for Offline'}
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconInfoCircle size={16} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSongDetails(song.id);
                            }}
                            style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                          >
                            Details
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>
                </Box>
              ))}
            </Stack>
          </InfiniteScroll>
        )}
      </Container>
    </Box>
  );
}

export default function FavoritesPage() {
  return (
    <ProtectedRoute>
      <FavoritesPageContent />
    </ProtectedRoute>
  );
}
