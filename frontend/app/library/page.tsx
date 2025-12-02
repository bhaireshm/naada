'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSongs, Song } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { notifications } from '@mantine/notifications';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import UploadModal from '@/components/UploadModal';
import { BulkUploadModal } from '@/components/BulkUploadModal';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import {
  Container,
  Title,
  Button,
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
  Badge,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconUpload,
  IconMusic,
  IconDots,
  IconPlaylistAdd,
  IconInfoCircle,
  IconAlertCircle,
  IconX,
  IconDownload,
  IconList,
} from '@tabler/icons-react';
import PlayingAnimation from '@/components/PlayingAnimation';
import FavoriteButton from '@/components/FavoriteButton';
import { DownloadButton } from '@/components/DownloadButton';
import { getSongStreamUrl } from '@/lib/api';
import InfiniteScroll from '@/components/InfiniteScroll';
import { useFavorites } from '@/contexts/FavoritesContext';
import { IconHeart, IconHeartFilled, IconCheck } from '@tabler/icons-react';
import { downloadManager } from '@/lib/offline/downloadManager';

// Favorite Menu Item Component to avoid button nesting
function FavoriteMenuItem({ songId }: { songId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const favorited = isFavorite(songId);
  const theme = useMantineTheme();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await toggleFavorite(songId);
      notifications.show({
        title: favorited ? 'Removed from favorites' : 'Added to favorites',
        message: favorited ? 'Song removed from your favorites' : 'Song added to your favorites',
        color: favorited ? 'gray' : 'pink',
        icon: favorited ? <IconHeart size={16} /> : <IconHeartFilled size={16} />,
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update favorites. Please try again.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Menu.Item
      leftSection={favorited ? <IconHeartFilled size={16} style={{ color: '#ff6b9d' }} /> : <IconHeart size={16} />}
      onClick={handleToggle}
      disabled={isLoading}
      style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
    >
      {favorited ? 'Remove from Favorites' : 'Add to Favorites'}
    </Menu.Item>
  );
}

function LibraryPageContent() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offlineSongs, setOfflineSongs] = useState<Set<string>>(new Set());
  const { setQueue, isPlaying, currentSong: audioCurrentSong, addToQueue, play, pause } = useAudioPlayerContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useMantineTheme();

  // Get filter parameters from URL
  const artistFilter = searchParams.get('artist');
  const albumFilter = searchParams.get('album');

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch songs on component mount
  useEffect(() => {
    if (isMounted) {
      fetchSongs();
    }
  }, [isMounted]);

  /**
   * Fetch all songs from the backend
   */
  const fetchSongs = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedSongs = await getSongs();
      setSongs(fetchedSongs);

      // Check offline status for all songs
      const offlineSet = new Set<string>();
      for (const song of fetchedSongs) {
        const isOffline = await downloadManager.isSongOffline(song.id);
        if (isOffline) {
          offlineSet.add(song.id);
        }
      }
      setOfflineSongs(offlineSet);
    } catch (err) {
      setError('Failed to load songs. Please try again.');
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter songs based on URL parameters
  const filteredSongs = songs.filter((song) => {
    if (artistFilter && song.artist !== artistFilter) return false;
    if (albumFilter && song.album !== albumFilter) return false;
    return true;
  });

  // Infinite scroll calculations
  const displayedSongs = filteredSongs.slice(0, displayCount);
  const hasMore = displayCount < filteredSongs.length;

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [artistFilter, albumFilter]);

  // Clear filters
  const clearFilters = () => {
    router.push('/library');
  };

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 20, filteredSongs.length));
      setIsLoadingMore(false);
    }, 300);
  };

  /**
   * Handle song selection for playback
   */
  const handlePlaySong = (song: Song, index: number) => {
    const isCurrentlyPlaying = audioCurrentSong?.id === song.id && isPlaying;

    if (isCurrentlyPlaying) {
      // If this song is currently playing, pause it
      pause();
    } else if (audioCurrentSong?.id === song.id) {
      // If this song is current but paused, resume it
      play();
    } else {
      // Otherwise, set the queue to filtered songs starting from the selected song
      setQueue(filteredSongs, index);
    }
  };

  /**
   * Handle successful upload - refresh the song list
   */
  const handleUploadSuccess = () => {
    fetchSongs();
    setShowUploadModal(false);
  };

  /**
   * Navigate to song details page
   */
  const handleSongDetails = (songId: string) => {
    router.push(`/songs/${songId}`);
  };

  /**
   * Handle song download for offline
   */
  const handleDownload = async (song: Song, e: React.MouseEvent) => {
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
            background: `linear-gradient(135deg, ${theme.colors.secondary[1]} 0%, ${theme.colors.accent2[1]} 100%)`,
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.md,
          }}
        >
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Title
                order={1}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                }}
              >
                My Library
              </Title>
              <Group gap="xs">
                <Text c="dimmed" size="sm">
                  {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'}
                </Text>
                {(artistFilter || albumFilter) && (
                  <>
                    <Text c="dimmed" size="sm">•</Text>
                    <Badge
                      variant="light"
                      color="accent1"
                      rightSection={
                        <ActionIcon
                          size="xs"
                          color="accent1"
                          radius="xl"
                          variant="transparent"
                          onClick={clearFilters}
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      }
                      style={{ paddingRight: 3 }}
                    >
                      {albumFilter ? `Album: ${albumFilter}` : `Artist: ${artistFilter}`}
                    </Badge>
                  </>
                )}
              </Group>
            </Stack>
            <Group gap="xs">
              {albumFilter && filteredSongs.length > 0 && (
                <Button
                  leftSection={<IconPlayerPlay size={18} />}
                  onClick={() => setQueue(filteredSongs, 0)}
                  variant="filled"
                  color="accent1"
                  size="md"
                >
                  Play All
                </Button>
              )}
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button
                    leftSection={<IconUpload size={18} />}
                    variant="gradient"
                    gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
                    size="md"
                  >
                    Upload
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconUpload size={16} />}
                    onClick={() => setShowUploadModal(true)}
                  >
                    Single Upload
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconUpload size={16} />}
                    onClick={() => setShowBulkUploadModal(true)}
                  >
                    Bulk Upload
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Box>

        {/* Loading State */}
        {loading && (
          <Stack gap={theme.spacing.md}>
            <Skeleton height={50} radius={theme.radius.md} />
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
            <Button size="xs" variant="outline" onClick={fetchSongs}>
              Try again
            </Button>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSongs.length === 0 && songs.length === 0 && (
          <Box
            p="xl"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent2[1]} 0%, ${theme.colors.secondary[1]} 100%)`,
              borderRadius: theme.radius.md,
            }}
          >
            <Stack align="center" gap={theme.spacing.md} py={60}>
              <Box
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent2[6]} 0%, ${theme.colors.accent2[7]} 100%)`,
                  borderRadius: '50%',
                  padding: theme.spacing.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconMusic size={48} stroke={1.5} color={theme.colors.primary[0]} />
              </Box>
              <Title order={3}>
                No songs yet
              </Title>
              <Text c="dimmed" size="sm" ta="center" maw={400}>
                Get started by uploading your first song to build your library.
              </Text>
              <Button
                leftSection={<IconUpload size={18} />}
                onClick={() => setShowUploadModal(true)}
                variant="gradient"
                gradient={{ from: 'accent2.6', to: 'accent2.7', deg: 135 }}
                size="md"
              >
                Upload Your First Song
              </Button>
            </Stack>
          </Box>
        )}

        {/* Filtered Empty State */}
        {!loading && !error && filteredSongs.length === 0 && songs.length > 0 && (
          <Alert
            icon={<IconMusic size={18} />}
            title="No songs match the filter"
            color="blue"
            variant="light"
          >
            <Text size="sm" mb="xs">
              No songs found for {albumFilter ? `album "${albumFilter}"` : `artist "${artistFilter}"`}
            </Text>
            <Button size="xs" variant="outline" onClick={clearFilters}>
              Clear filter
            </Button>
          </Alert>
        )}

        {/* Song List - Desktop Table */}
        {!loading && !error && filteredSongs.length > 0 && isMounted && (
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
                          <DownloadButton
                            songId={song.id}
                            title={song.title}
                            artist={song.artist}
                            fileUrl={getSongStreamUrl(song.id)}
                            size="sm"
                          />
                          <Menu position="bottom-end" shadow="sm" width={160}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray" size={36}>
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown p={4}>
                              <Menu.Item
                                leftSection={<IconList size={14} />}
                                onClick={() => {
                                  addToQueue(song);
                                  notifications.show({
                                    title: 'Added to Queue',
                                    message: `${song.title} added to queue`,
                                    color: 'green',
                                  });
                                }}
                                style={{ fontSize: '13px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                              >
                                Add to Queue
                              </Menu.Item>
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
                                  onSuccess={fetchSongs}
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
                            leftSection={<IconList size={16} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToQueue(song);
                              notifications.show({
                                title: 'Added to Queue',
                                message: `${song.title} added to queue`,
                                color: 'green',
                              });
                            }}
                            style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                          >
                            Add to Queue
                          </Menu.Item>
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
                          <FavoriteMenuItem songId={song.id} />
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
                              onSuccess={fetchSongs}
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

      {/* Upload Modal */}
      <UploadModal
        opened={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        opened={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onComplete={handleUploadSuccess}
      />
    </Box>
  );
}

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryPageContent />
    </ProtectedRoute>
  );
}
