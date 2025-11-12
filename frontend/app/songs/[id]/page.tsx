'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSong, Song } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Box,
  Image,
  Skeleton,
  Alert,
  Menu,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlaylistAdd,
  IconArrowLeft,
  IconAlertCircle,
  IconMusic,
} from '@tabler/icons-react';

function SongDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;
  
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setQueue, currentSong: audioCurrentSong } = useAudioPlayerContext();

  useEffect(() => {
    if (songId) {
      fetchSongDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]);

  const fetchSongDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedSong = await getSong(songId);
      setSong(fetchedSong);
    } catch (err) {
      setError('Failed to load song details. Please try again.');
      console.error('Error fetching song details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = () => {
    if (song) {
      // Set queue with just this song
      setQueue([song], 0);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isCurrentlyPlaying = audioCurrentSong?.id === songId;

  return (
    <Box pb={120}>
      <Container size="md" py="xl">
        {/* Back Button */}
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => router.back()}
          mb="xl"
        >
          Back
        </Button>

        {/* Loading State */}
        {loading && (
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Stack gap="xl">
              <Group align="flex-start" wrap="nowrap">
                <Skeleton height={200} width={200} radius="md" />
                <Stack gap="md" style={{ flex: 1 }}>
                  <Skeleton height={32} width="80%" />
                  <Skeleton height={24} width="60%" />
                  <Skeleton height={20} width="40%" />
                  <Skeleton height={20} width="50%" />
                </Stack>
              </Group>
            </Stack>
          </Paper>
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
            <Button size="xs" variant="outline" onClick={fetchSongDetails}>
              Try again
            </Button>
          </Alert>
        )}

        {/* Song Details */}
        {!loading && !error && song && (
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            {/* Desktop Layout */}
            <Box visibleFrom="md">
              <Group align="flex-start" gap="xl" wrap="nowrap">
                {/* Album Art */}
                <Box style={{ flexShrink: 0 }}>
                  {song.albumArt ? (
                    <Image
                      src={song.albumArt}
                      alt={`${song.title} album art`}
                      width={250}
                      height={250}
                      radius="md"
                      fit="cover"
                    />
                  ) : (
                    <Box
                      style={{
                        width: 250,
                        height: 250,
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        borderRadius: 'var(--mantine-radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconMusic size={80} stroke={1.5} color="var(--mantine-color-gray-5)" />
                    </Box>
                  )}
                </Box>

                {/* Song Info */}
                <Stack gap="md" style={{ flex: 1 }}>
                  <Box>
                    <Title order={1} mb="xs">
                      {song.title}
                    </Title>
                    <Text size="xl" c="dimmed" fw={500}>
                      {song.artist}
                    </Text>
                  </Box>

                  <Stack gap="xs">
                    {song.album && (
                      <Group gap="xs">
                        <Text fw={600} size="sm">
                          Album:
                        </Text>
                        <Text size="sm" c="dimmed">
                          {song.album}
                        </Text>
                      </Group>
                    )}
                    <Group gap="xs">
                      <Text fw={600} size="sm">
                        Duration:
                      </Text>
                      <Text size="sm" c="dimmed">
                        {formatDuration(song.duration)}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <Text fw={600} size="sm">
                        Added:
                      </Text>
                      <Text size="sm" c="dimmed">
                        {formatDate(song.createdAt)}
                      </Text>
                    </Group>
                  </Stack>

                  <Group gap="sm" mt="md">
                    <Button
                      leftSection={<IconPlayerPlay size={18} />}
                      onClick={handlePlaySong}
                      variant={isCurrentlyPlaying ? 'filled' : 'light'}
                      size="md"
                    >
                      {isCurrentlyPlaying ? 'Playing' : 'Play'}
                    </Button>
                    
                    <Menu position="bottom-start" shadow="md">
                      <Menu.Target>
                        <Button
                          leftSection={<IconPlaylistAdd size={18} />}
                          variant="outline"
                          size="md"
                        >
                          Add to Playlist
                        </Button>
                      </Menu.Target>
                      <AddToPlaylistMenu songId={song.id} />
                    </Menu>
                  </Group>
                </Stack>
              </Group>
            </Box>

            {/* Mobile Layout */}
            <Stack gap="xl" hiddenFrom="md">
              {/* Album Art */}
              <Box>
                {song.albumArt ? (
                  <Image
                    src={song.albumArt}
                    alt={`${song.title} album art`}
                    width="100%"
                    height="auto"
                    radius="md"
                    fit="cover"
                    style={{ maxWidth: 400, margin: '0 auto' }}
                  />
                ) : (
                  <Box
                    style={{
                      width: '100%',
                      maxWidth: 400,
                      aspectRatio: '1',
                      margin: '0 auto',
                      backgroundColor: 'var(--mantine-color-gray-1)',
                      borderRadius: 'var(--mantine-radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconMusic size={80} stroke={1.5} color="var(--mantine-color-gray-5)" />
                  </Box>
                )}
              </Box>

              {/* Song Info */}
              <Stack gap="md">
                <Box>
                  <Title order={2} mb="xs">
                    {song.title}
                  </Title>
                  <Text size="lg" c="dimmed" fw={500}>
                    {song.artist}
                  </Text>
                </Box>

                <Stack gap="xs">
                  {song.album && (
                    <Group gap="xs">
                      <Text fw={600} size="sm">
                        Album:
                      </Text>
                      <Text size="sm" c="dimmed">
                        {song.album}
                      </Text>
                    </Group>
                  )}
                  <Group gap="xs">
                    <Text fw={600} size="sm">
                      Duration:
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatDuration(song.duration)}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Text fw={600} size="sm">
                      Added:
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatDate(song.createdAt)}
                    </Text>
                  </Group>
                </Stack>

                <Stack gap="sm" mt="md">
                  <Button
                    leftSection={<IconPlayerPlay size={18} />}
                    onClick={handlePlaySong}
                    variant={isCurrentlyPlaying ? 'filled' : 'light'}
                    size="md"
                    fullWidth
                  >
                    {isCurrentlyPlaying ? 'Playing' : 'Play'}
                  </Button>
                  
                  <Menu position="bottom" shadow="md">
                    <Menu.Target>
                      <Button
                        leftSection={<IconPlaylistAdd size={18} />}
                        variant="outline"
                        size="md"
                        fullWidth
                      >
                        Add to Playlist
                      </Button>
                    </Menu.Target>
                    <AddToPlaylistMenu songId={song.id} />
                  </Menu>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

export default function SongDetailsPage() {
  return (
    <ProtectedRoute>
      <SongDetailsPageContent />
    </ProtectedRoute>
  );
}
