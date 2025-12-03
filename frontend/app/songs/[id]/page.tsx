'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSong, Song } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import { useSongActions } from '@/hooks/useSongActions';
import EditSongModal from '@/components/EditSongModal';
import FavoriteButton from '@/components/FavoriteButton';
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
  useMantineTheme,
  Grid,
  Badge,
  ActionIcon,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlaylistAdd,
  IconArrowLeft,
  IconAlertCircle,
  IconMusic,
  IconList,
  IconEdit,
  IconTrash,
  IconClock,
  IconCalendar,
  IconDisc,
  IconMicrophone,
} from '@tabler/icons-react';

function SongDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const theme = useMantineTheme();
  const songId = params.id as string;

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setQueue, currentSong: audioCurrentSong, addToQueue } = useAudioPlayerContext();

  // Use the song actions hook (with null check in render)
  const songActions = useSongActions(song || {} as Song, {
    onDeleteSuccess: () => router.push('/library'),
  });

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

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Button variant="subtle" leftSection={<IconArrowLeft size={18} />} onClick={() => router.back()} mb="xl">
          Back
        </Button>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Skeleton height={350} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Skeleton height={50} width="60%" />
              <Skeleton height={30} width="40%" />
              <Skeleton height={20} width="30%" />
              <Group mt="xl">
                <Skeleton height={40} width={120} />
                <Skeleton height={40} width={120} />
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    );
  }

  if (error || !song) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size={18} />} title="Error" color="red" variant="light">
          <Text size="sm" mb="xs">{error || 'Song not found'}</Text>
          <Button size="xs" variant="outline" onClick={fetchSongDetails}>Try again</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Box pb={120} style={{ overflowX: 'hidden' }}>
      {/* Immersive Background Header */}
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: 250,
          overflow: 'hidden',
          marginBottom: -140, // Pull content up significantly
        }}
      >
        {/* Blurred Background Image */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${song.albumArt || '/placeholder-art.png'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.5)',
            zIndex: 0,
          }}
        />
        {/* Gradient Overlay */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.9) 100%)',
            zIndex: 1,
          }}
        />

        <Container size="lg" style={{ position: 'relative', zIndex: 2, height: '100%', paddingTop: 20 }}>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.back()}
            style={{ color: 'white' }}
          >
            Back
          </Button>
        </Container>
      </Box>

      <Container size="lg" style={{ position: 'relative', zIndex: 3 }}>
        <Grid gutter="xl">
          {/* Left Column: Album Art */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Box
              w={{ base: 220, xs: 280, md: '100%' }}
              mx="auto"
              style={{
                borderRadius: theme.radius.lg,
                overflow: 'hidden',
                boxShadow: theme.shadows.xl,
                aspectRatio: '1/1',
                position: 'relative',
                backgroundColor: theme.colors.dark[8],
              }}
            >
              {song.albumArt ? (
                <Image
                  src={song.albumArt}
                  alt={song.title}
                  w="100%"
                  h="100%"
                  fit="cover"
                />
              ) : (
                <Box
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.gray[1],
                  }}
                >
                  <IconMusic size={80} color={theme.colors.gray[5]} />
                </Box>
              )}
            </Box>
          </Grid.Col>

          {/* Right Column: Info & Actions */}
          <Grid.Col span={{ base: 12, md: 8 }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: theme.spacing.xl }}>
            <Stack gap="md">
              <Group align="flex-start" justify="space-between" wrap="nowrap">
                <Box>
                  <Title
                    order={1}
                    style={{
                      fontSize: '3rem',
                      lineHeight: 1.1,
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      color: 'white' // Force white text on dark background
                    }}
                  >
                    {song.title}
                  </Title>
                  <Text size="xl" fw={500} style={{ color: 'rgba(255,255,255,0.8)' }} mt="xs">
                    {song.artist}
                  </Text>
                </Box>
                <Box mt="xs">
                  <FavoriteButton songId={song.id} size="lg" />
                </Box>
              </Group>

              {/* Metadata Badges */}
              <Group gap="sm" mt="sm">
                {song.album && (
                  <Badge
                    size="lg"
                    variant="filled"
                    color="dark"
                    leftSection={<IconDisc size={14} />}
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
                  >
                    {song.album}
                  </Badge>
                )}
                {song.duration && (
                  <Badge
                    size="lg"
                    variant="filled"
                    color="dark"
                    leftSection={<IconClock size={14} />}
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
                  >
                    {formatDuration(song.duration)}
                  </Badge>
                )}
                <Badge
                  size="lg"
                  variant="filled"
                  color="dark"
                  leftSection={<IconCalendar size={14} />}
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
                >
                  {formatDate(song.createdAt)}
                </Badge>
              </Group>

              {/* Action Buttons */}
              <Group gap="md" mt="xl">
                <Button
                  size="lg"
                  radius="xl"
                  color="primary"
                  leftSection={<IconPlayerPlay size={24} />}
                  onClick={handlePlaySong}
                  variant={isCurrentlyPlaying ? 'filled' : 'gradient'}
                  gradient={{ from: 'primary', to: 'accent2', deg: 45 }}
                  style={{ boxShadow: theme.shadows.md }}
                >
                  {isCurrentlyPlaying ? 'Playing' : 'Play Now'}
                </Button>

                <Button
                  size="lg"
                  radius="xl"
                  variant="default"
                  leftSection={<IconList size={20} />}
                  onClick={() => addToQueue(song)}
                  style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(10px)' }}
                >
                  Add to Queue
                </Button>

                <Menu position="bottom" shadow="md">
                  <Menu.Target>
                    <ActionIcon
                      size={50}
                      radius="xl"
                      variant="default"
                      style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(10px)' }}
                    >
                      <IconPlaylistAdd size={24} />
                    </ActionIcon>
                  </Menu.Target>
                  <AddToPlaylistMenu songId={song.id} />
                </Menu>

                {songActions.isOwner && (
                  <Menu position="bottom" shadow="md">
                    <Menu.Target>
                      <ActionIcon
                        size={50}
                        radius="xl"
                        variant="default"
                        style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(10px)' }}
                      >
                        <IconEdit size={24} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={16} />} onClick={songActions.handleEdit}>
                        Edit Metadata
                      </Menu.Item>
                      <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={songActions.handleDelete}>
                        Delete Song
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Lyrics Section */}
        <Paper shadow="sm" radius="lg" p="xl" mt={50} withBorder>
          <Group mb="lg">
            <IconMicrophone size={24} color={theme.colors.primary[6]} />
            <Title order={3}>Lyrics</Title>
          </Group>

          {song.lyrics ? (
            <Text
              size="lg"
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                fontFamily: 'monospace',
                color: theme.colors.dark[3]
              }}
            >
              {song.lyrics}
            </Text>
          ) : (
            <Stack align="center" py="xl" gap="md">
              <Text c="dimmed" size="lg">No lyrics available for this song</Text>
              {songActions.isOwner && (
                <Button
                  variant="light"
                  leftSection={<IconEdit size={16} />}
                  onClick={songActions.handleEdit}
                >
                  Add Lyrics
                </Button>
              )}
            </Stack>
          )}
        </Paper>
      </Container>

      {/* Edit Modal */}
      <EditSongModal
        opened={songActions.editModalOpen}
        onClose={songActions.closeEditModal}
        song={song}
        onSuccess={fetchSongDetails}
      />
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
