'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconUpload,
  IconMusic,
  IconDots,
  IconPlaylistAdd,
  IconInfoCircle,
  IconAlertCircle,
} from '@tabler/icons-react';
import PlayingAnimation from '@/components/PlayingAnimation';
import { GRADIENTS, BORDERS } from '@/lib/theme-constants';

function LibraryPageContent() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { setQueue, isPlaying, currentSong: audioCurrentSong } = useAudioPlayerContext();
  const router = useRouter();

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

  /**
   * Handle song selection for playback
   */
  const handlePlaySong = (song: Song, index: number) => {
    // Set the queue to all songs starting from the selected song
    setQueue(songs, index);
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
    <Box pb={80}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Box
          mb="xl"
          p="xl"
          style={{
            background: GRADIENTS.pastelBlue,
            borderRadius: 'var(--mantine-radius-md)',
            boxShadow: '0 4px 20px rgba(1, 31, 75, 0.08)',
          }}
        >
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Title 
                order={1}
                style={{
                  background: GRADIENTS.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                }}
              >
                My Library
              </Title>
              <Text c="dimmed" size="sm">
                Your personal music collection
              </Text>
            </Stack>
            <Button
              leftSection={<IconUpload size={18} />}
              onClick={() => setShowUploadModal(true)}
              variant="gradient"
              gradient={{ from: 'deepBlue.7', to: 'slate.7', deg: 135 }}
              size="md"
            >
              Upload Song
            </Button>
          </Group>
        </Box>

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
            <Button size="xs" variant="outline" onClick={fetchSongs}>
              Try again
            </Button>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && songs.length === 0 && (
          <Box
            p="xl"
            style={{
              background: GRADIENTS.pastelPink,
              borderRadius: 'var(--mantine-radius-md)',
            }}
          >
            <Stack align="center" gap="md" py={60}>
              <Box
                style={{
                  background: GRADIENTS.pinkAccent,
                  borderRadius: '50%',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconMusic size={48} stroke={1.5} color="white" />
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
                gradient={{ from: 'pink.6', to: 'red.6', deg: 135 }}
                size="md"
              >
                Upload Your First Song
              </Button>
            </Stack>
          </Box>
        )}

        {/* Song List - Desktop Table */}
        {!loading && !error && songs.length > 0 && isMounted && (
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
                  {songs.map((song, index) => (
                    <Table.Tr
                      key={song.id}
                      bg={
                        audioCurrentSong?.id === song.id
                          ? 'var(--mantine-color-blue-light)'
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
                                style={{ fontSize: '13px', padding: '6px 8px' }}
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
                                    style={{ fontSize: '13px', padding: '6px 8px' }}
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
                                style={{ fontSize: '13px', padding: '6px 8px' }}
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
              {songs.map((song, index) => (
                <Box
                  key={song.id}
                  p="md"
                  style={{
                    background:
                      audioCurrentSong?.id === song.id
                        ? GRADIENTS.pastelLight
                        : GRADIENTS.subtleGray,
                    borderRadius: 'var(--mantine-radius-md)',
                    border: audioCurrentSong?.id === song.id 
                      ? `1px solid ${BORDERS.activeBlue}` 
                      : `1px solid ${BORDERS.light}`,
                    transition: 'all 0.2s ease',
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
                            style={{ fontSize: '13px', padding: '6px 8px' }}
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
                                style={{ fontSize: '13px', padding: '6px 8px' }}
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
                            style={{ fontSize: '13px', padding: '6px 8px' }}
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
