'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSongs, Song } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import UploadModal from '@/components/UploadModal';
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
  useMantineColorScheme,
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
} from '@tabler/icons-react';
import PlayingAnimation from '@/components/PlayingAnimation';
import FavoriteButton from '@/components/FavoriteButton';

function LibraryPageContent() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { setQueue, isPlaying, currentSong: audioCurrentSong } = useAudioPlayerContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

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

  // Clear filters
  const clearFilters = () => {
    router.push('/library');
  };

  /**
   * Handle song selection for playback
   */
  const handlePlaySong = (song: Song, index: number) => {
    // Set the queue to filtered songs starting from the selected song
    setQueue(filteredSongs, index);
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
              <Button
                leftSection={<IconUpload size={18} />}
                onClick={() => setShowUploadModal(true)}
                variant="gradient"
                gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
                size="md"
              >
                Upload Song
              </Button>
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
          <>
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
                  {filteredSongs.map((song, index) => (
                    <Table.Tr
                      key={song.id}
                      bg={
                        audioCurrentSong?.id === song.id
                          ? (colorScheme === 'dark' ? theme.colors.accent1[9] : theme.colors.accent1[1])
                          : undefined
                      }
                    >
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
                            color="accent1"
                            onClick={() => handlePlaySong(song, index)}
                            aria-label={`Play ${song.title}`}
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
                                  onSuccess={fetchSongs}
                                />
                              </Menu>
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
              {filteredSongs.map((song, index) => (
                <Box
                  key={song.id}
                  p="md"
                  style={{
                    background:
                      audioCurrentSong?.id === song.id
                        ? `linear-gradient(135deg, ${theme.colors.accent1[1]} 0%, ${theme.colors.secondary[1]} 100%)`
                        : (colorScheme === 'dark' ? theme.colors.primary[9] : theme.colors.secondary[0]),
                    borderRadius: theme.radius.md,
                    border: audioCurrentSong?.id === song.id 
                      ? `1px solid ${theme.colors.accent1[4]}` 
                      : `1px solid ${colorScheme === 'dark' ? theme.colors.secondary[8] : theme.colors.secondary[3]}`,
                    transition: `all ${theme.other.transitionDuration.normal} ${theme.other.easingFunctions.easeInOut}`,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Box style={{ minWidth: 0, flex: 1 }}>
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
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant={audioCurrentSong?.id === song.id ? 'filled' : 'subtle'}
                        color="accent1"
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
                      <FavoriteButton songId={song.id} size="lg" />
                      <Menu position="bottom-end" shadow="sm" width={160}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size={40}>
                            <IconDots size={18} />
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
                              onSuccess={fetchSongs}
                            />
                          </Menu>
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
                  </Group>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Container>

      {/* Upload Modal */}
      <UploadModal
        opened={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
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
