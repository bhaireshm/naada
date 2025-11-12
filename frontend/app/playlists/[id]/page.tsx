'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPlaylist, getSongs, updatePlaylist, Song, Playlist } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import { notifications } from '@mantine/notifications';
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
  Modal,
  Paper,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconArrowLeft,
  IconDots,
  IconPlaylistAdd,
  IconInfoCircle,
  IconTrash,
  IconAlertCircle,
  IconMusic,
  IconPlus,
} from '@tabler/icons-react';
import PlayingAnimation from '@/components/PlayingAnimation';

function PlaylistDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { setQueue, isPlaying, currentSong: audioCurrentSong } = useAudioPlayerContext();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Fetch playlist and all available songs
   */
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [playlistData, songsData] = await Promise.all([
        getPlaylist(playlistId),
        getSongs(),
      ]);
      setPlaylist(playlistData);
      setAllSongs(songsData);
    } catch (err) {
      setError('Failed to load playlist. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch playlist and all songs on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  /**
   * Get songs in the playlist
   */
  const getPlaylistSongs = (): Song[] => {
    if (!playlist) return [];
    
    // Check if songIds are populated with Song objects
    if (playlist.songIds.length > 0 && typeof playlist.songIds[0] === 'object') {
      return playlist.songIds as Song[];
    }
    
    return [];
  };

  /**
   * Get songs not in the playlist
   */
  const getAvailableSongs = (): Song[] => {
    const playlistSongs = getPlaylistSongs();
    const playlistSongIds = playlistSongs.map(s => s.id);
    return allSongs.filter(song => !playlistSongIds.includes(song.id));
  };

  /**
   * Add a song to the playlist
   */
  const handleAddSong = async (songId: string) => {
    if (!playlist) return;

    setUpdating(true);
    try {
      const playlistSongs = getPlaylistSongs();
      const currentSongIds = playlistSongs.map(s => s.id);
      const updatedSongIds = [...currentSongIds, songId];
      
      const updatedPlaylist = await updatePlaylist(playlist.id, updatedSongIds);
      setPlaylist(updatedPlaylist);
      setShowAddSongModal(false);
      
      notifications.show({
        title: 'Success',
        message: 'Song added to playlist',
        color: 'green',
      });
    } catch (err) {
      console.error('Error adding song:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to add song to playlist. Please try again.',
        color: 'red',
      });
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Remove a song from the playlist
   */
  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;

    setUpdating(true);
    try {
      const playlistSongs = getPlaylistSongs();
      const currentSongIds = playlistSongs.map(s => s.id);
      const updatedSongIds = currentSongIds.filter(id => id !== songId);
      
      const updatedPlaylist = await updatePlaylist(playlist.id, updatedSongIds);
      setPlaylist(updatedPlaylist);
      
      notifications.show({
        title: 'Success',
        message: 'Song removed from playlist',
        color: 'green',
      });
    } catch (err) {
      console.error('Error removing song:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to remove song from playlist. Please try again.',
        color: 'red',
      });
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Play a song from the playlist
   */
  const handlePlaySong = (song: Song, index: number) => {
    // Set the queue to all playlist songs starting from the selected song
    setQueue(playlistSongs, index);
  };

  /**
   * Play all songs in the playlist
   */
  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      setQueue(playlistSongs, 0);
    }
  };

  /**
   * Navigate to song details page
   */
  const handleSongDetails = (songId: string) => {
    router.push(`/songs/${songId}`);
  };

  const playlistSongs = getPlaylistSongs();
  const availableSongs = getAvailableSongs();

  return (
    <Box pb={120}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Stack gap="md" mb="xl">
          <Group>
            <ActionIcon
              variant="subtle"
              size={44}
              onClick={() => router.push('/playlists')}
              aria-label="Back to playlists"
            >
              <IconArrowLeft size={22} />
            </ActionIcon>
            <Box style={{ flex: 1 }}>
              <Title order={1}>{playlist?.name || 'Loading...'}</Title>
              <Text c="dimmed" size="sm">
                {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
              </Text>
            </Box>
          </Group>

          {/* Action Buttons */}
          {!loading && !error && playlistSongs.length > 0 && (
            <Group>
              <Button
                leftSection={<IconPlayerPlay size={18} />}
                onClick={handlePlayAll}
              >
                Play All
              </Button>
              <Button
                variant="light"
                leftSection={<IconPlus size={18} />}
                onClick={() => setShowAddSongModal(true)}
                disabled={updating || availableSongs.length === 0}
              >
                Add Song
              </Button>
            </Group>
          )}
        </Stack>

        {/* Loading State */}
        {loading && (
          <Stack gap="md">
            <Skeleton height={50} radius="md" />
            <Skeleton height={50} radius="md" />
            <Skeleton height={50} radius="md" />
            <Skeleton height={50} radius="md" />
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
            <Button size="xs" variant="outline" onClick={fetchData}>
              Try again
            </Button>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && playlistSongs.length === 0 && (
          <Stack align="center" gap="md" py={60}>
            <IconMusic size={48} stroke={1.5} color="var(--mantine-color-gray-5)" />
            <Title order={3} c="dimmed">
              No songs in playlist
            </Title>
            <Text c="dimmed" size="sm">
              Add songs to start building your playlist.
            </Text>
            {availableSongs.length > 0 && (
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => setShowAddSongModal(true)}
              >
                Add Song
              </Button>
            )}
          </Stack>
        )}

        {/* Song List - Desktop Table */}
        {!loading && !error && playlistSongs.length > 0 && isMounted && (
          <>
            <Box visibleFrom="md">
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={50}>#</Table.Th>
                    <Table.Th>Title</Table.Th>
                    <Table.Th>Artist</Table.Th>
                    <Table.Th>Album</Table.Th>
                    <Table.Th w={120}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {playlistSongs.map((song, index) => (
                    <Table.Tr
                      key={song.id}
                      bg={
                        audioCurrentSong?.id === song.id
                          ? 'var(--mantine-color-blue-light)'
                          : undefined
                      }
                    >
                      <Table.Td>
                        <Text c="dimmed" size="sm">
                          {index + 1}
                        </Text>
                      </Table.Td>
                      <Table.Td>
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
                            color="blue"
                            onClick={() => handlePlaySong(song, index)}
                            aria-label={`Play ${song.title}`}
                          >
                            {audioCurrentSong?.id === song.id && isPlaying ? (
                              <PlayingAnimation size={18} color="white" />
                            ) : (
                              <IconPlayerPlay size={18} />
                            )}
                          </ActionIcon>
                          <Menu position="bottom-end" shadow="md">
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray">
                                <IconDots size={18} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconPlayerPlay size={16} />}
                                onClick={() => handlePlaySong(song, index)}
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
                                  <Menu.Item leftSection={<IconPlaylistAdd size={16} />}>
                                    Add to Playlist
                                  </Menu.Item>
                                </Menu.Target>
                                <AddToPlaylistMenu
                                  songId={song.id}
                                  onSuccess={fetchData}
                                />
                              </Menu>
                              <Menu.Item
                                leftSection={<IconInfoCircle size={16} />}
                                onClick={() => handleSongDetails(song.id)}
                              >
                                Song Details
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={() => handleRemoveSong(song.id)}
                                disabled={updating}
                              >
                                Remove from Playlist
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
              {playlistSongs.map((song, index) => (
                <Paper
                  key={song.id}
                  p="md"
                  withBorder
                  bg={
                    audioCurrentSong?.id === song.id
                      ? 'var(--mantine-color-blue-light)'
                      : undefined
                  }
                >
                  <Group justify="space-between" wrap="nowrap" mb="xs">
                    <Text c="dimmed" size="xs">
                      #{index + 1}
                    </Text>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant={audioCurrentSong?.id === song.id ? 'filled' : 'subtle'}
                        color="blue"
                        size={44}
                        onClick={() => handlePlaySong(song, index)}
                        aria-label={`Play ${song.title}`}
                      >
                        {audioCurrentSong?.id === song.id && isPlaying ? (
                          <PlayingAnimation size={22} color="white" />
                        ) : (
                          <IconPlayerPlay size={22} />
                        )}
                      </ActionIcon>
                      <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size={44}>
                            <IconDots size={22} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconPlayerPlay size={16} />}
                            onClick={() => handlePlaySong(song, index)}
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
                              <Menu.Item leftSection={<IconPlaylistAdd size={16} />}>
                                Add to Playlist
                              </Menu.Item>
                            </Menu.Target>
                            <AddToPlaylistMenu
                              songId={song.id}
                              onSuccess={fetchData}
                            />
                          </Menu>
                          <Menu.Item
                            leftSection={<IconInfoCircle size={16} />}
                            onClick={() => handleSongDetails(song.id)}
                          >
                            Song Details
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => handleRemoveSong(song.id)}
                            disabled={updating}
                          >
                            Remove from Playlist
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>
                  <Box>
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
                </Paper>
              ))}
            </Stack>
          </>
        )}
      </Container>

      {/* Add Song Modal */}
      <Modal
        opened={showAddSongModal}
        onClose={() => setShowAddSongModal(false)}
        title="Add Song to Playlist"
        size="lg"
        centered
      >
        {availableSongs.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <IconMusic size={48} stroke={1.5} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed" size="sm">
              All songs have been added to this playlist.
            </Text>
          </Stack>
        ) : (
          <Stack gap="xs" mah={400} style={{ overflowY: 'auto' }}>
            {availableSongs.map((song) => (
              <Paper key={song.id} p="md" withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <Box style={{ minWidth: 0, flex: 1 }}>
                    <Text truncate fw={500}>
                      {song.title}
                    </Text>
                    <Text c="dimmed" size="sm" truncate>
                      {song.artist}
                    </Text>
                  </Box>
                  <Button
                    onClick={() => handleAddSong(song.id)}
                    disabled={updating}
                    loading={updating}
                    size="sm"
                  >
                    Add
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Modal>
    </Box>
  );
}


export default function PlaylistDetailPage() {
  return (
    <ProtectedRoute>
      <PlaylistDetailPageContent />
    </ProtectedRoute>
  );
}
