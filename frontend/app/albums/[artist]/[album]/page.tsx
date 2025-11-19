'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAlbum, AlbumDetail } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import SongListItem from '@/components/SongListItem';
import EditAlbumModal from '@/components/EditAlbumModal';
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Alert,
  Box,
  Group,
  Skeleton,
  useMantineTheme,
  useMantineColorScheme,
  Image,
  Badge,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconAlertCircle,
  IconArrowLeft,
  IconDisc,
  IconEdit,
} from '@tabler/icons-react';
import { getGradient, getTextGradient } from '@/lib/themeColors';

function AlbumDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const [albumInfo, setAlbumInfo] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { setQueue, isPlaying, currentSong } = useAudioPlayerContext();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const artistName = decodeURIComponent(params.artist as string);
  const albumName = decodeURIComponent(params.album as string);

  useEffect(() => {
    fetchAlbumData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistName, albumName]);

  const fetchAlbumData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAlbum(artistName, albumName);
      setAlbumInfo(data);
    } catch (err) {
      setError('Failed to load album. Please try again.');
      console.error('Error fetching album:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAlbum = () => {
    if (albumInfo && albumInfo.songs.length > 0) {
      setQueue(albumInfo.songs, 0);
    }
  };

  const handlePlaySong = (song: Song, index: number) => {
    if (albumInfo) {
      setQueue(albumInfo.songs, index);
    }
  };

  const handleViewDetails = (songId: string) => {
    router.push(`/songs/${songId}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  return (
    <Box pb={90}>
      <Container size="xl" py="xl">
        {/* Back Button */}
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => router.back()}
          mb="md"
          size="sm"
        >
          Back
        </Button>

        {/* Loading State */}
        {loading && (
          <Stack gap={theme.spacing.md}>
            <Skeleton height={300} radius={theme.radius.md} />
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
            <Button size="xs" variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </Alert>
        )}

        {/* Album Details */}
        {!loading && !error && albumInfo && (
          <>
            {/* Album Header */}
            <Box
              mb="xl"
              p="xl"
              style={{
                background: getGradient(theme, 'secondary'),
                borderRadius: theme.radius.md,
                boxShadow: theme.shadows.lg,
              }}
            >
              <Group align="flex-start" gap="xl" wrap="nowrap">
                {/* Album Art */}
                <Box
                  style={{
                    width: 200,
                    height: 200,
                    flexShrink: 0,
                    borderRadius: theme.radius.md,
                    overflow: 'hidden',
                    boxShadow: theme.shadows.xl,
                  }}
                >
                  {albumInfo.songs[0]?.albumArt ? (
                    <Image
                      src={albumInfo.songs[0].albumArt}
                      alt={albumName}
                      width={200}
                      height={200}
                      fit="cover"
                    />
                  ) : (
                    <Box
                      style={{
                        width: '100%',
                        height: '100%',
                        background: getGradient(theme, 'accent'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconDisc size={80} color={theme.colors.primary[0]} opacity={0.5} />
                    </Box>
                  )}
                </Box>

                {/* Album Info */}
                <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
                  <Badge variant="light" color="accent1" size="sm">
                    Album
                  </Badge>
                  <Title
                    order={1}
                    style={{
                      ...getTextGradient(theme),
                      fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                    }}
                  >
                    {albumName}
                  </Title>
                  <Text size="xl" fw={600}>
                    {artistName}
                  </Text>
                  <Group gap="xs">
                    {albumInfo.year && (
                      <>
                        <Text size="sm" c="dimmed">
                          {albumInfo.year}
                        </Text>
                        <Text size="sm" c="dimmed">
                          •
                        </Text>
                      </>
                    )}
                    <Text size="sm" c="dimmed">
                      {albumInfo.songs.length} {albumInfo.songs.length === 1 ? 'song' : 'songs'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      •
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatTotalDuration(albumInfo.totalDuration)}
                    </Text>
                  </Group>
                  <Group gap="xs" mt="md">
                    <Button
                      leftSection={<IconPlayerPlay size={18} />}
                      onClick={handlePlayAlbum}
                      variant="gradient"
                      gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
                      size="md"
                    >
                      Play Album
                    </Button>
                    <Button
                      leftSection={<IconEdit size={18} />}
                      onClick={() => setShowEditModal(true)}
                      variant="light"
                      color="accent1"
                      size="md"
                    >
                      Edit
                    </Button>
                  </Group>
                </Stack>
              </Group>
            </Box>

            {/* Song List */}
            <Stack gap="xs" hiddenFrom="md">
              {albumInfo.songs.map((song, index) => (
                <SongListItem
                  key={song.id}
                  song={song}
                  index={index}
                  isPlaying={isPlaying}
                  isCurrentSong={currentSong?.id === song.id}
                  onPlay={handlePlaySong}
                  onViewDetails={handleViewDetails}
                  onRefresh={fetchAlbumData}
                />
              ))}
            </Stack>

            {/* Desktop Table View */}
            <Box visibleFrom="md">
              <Stack gap="xs">
                {albumInfo.songs.map((song, index) => (
                  <Box
                    key={song.id}
                    p="md"
                    style={{
                      background:
                        currentSong?.id === song.id
                          ? getGradient(theme, 'secondary')
                          : colorScheme === 'dark'
                          ? theme.colors.primary[9]
                          : theme.colors.primary[0],
                      borderRadius: theme.radius.md,
                      border: `1px solid ${
                        currentSong?.id === song.id
                          ? theme.colors.accent1[4]
                          : colorScheme === 'dark'
                          ? theme.colors.secondary[8]
                          : theme.colors.secondary[3]
                      }`,
                      cursor: 'pointer',
                      transition: `all ${theme.other.transitionDuration.normal} ${theme.other.easingFunctions.easeInOut}`,
                    }}
                    onClick={() => handlePlaySong(song, index)}
                    onMouseEnter={(e) => {
                      if (currentSong?.id !== song.id) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.borderColor = theme.colors.accent1[5];
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      if (currentSong?.id !== song.id) {
                        e.currentTarget.style.borderColor =
                          colorScheme === 'dark'
                            ? theme.colors.secondary[8]
                            : theme.colors.secondary[3];
                      }
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="md" style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" c="dimmed" style={{ width: 30 }}>
                          {index + 1}
                        </Text>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={currentSong?.id === song.id ? 600 : 400} truncate>
                            {song.title}
                          </Text>
                        </Box>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {formatDuration(song.duration || 0)}
                      </Text>
                    </Group>
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Container>

      {/* Edit Album Modal */}
      {albumInfo && (
        <EditAlbumModal
          opened={showEditModal}
          onClose={() => setShowEditModal(false)}
          artist={artistName}
          album={albumName}
          year={albumInfo.year}
          genre={albumInfo.genre}
          albumArt={albumInfo.albumArt}
          onSuccess={() => {
            fetchAlbumData();
            router.refresh();
          }}
        />
      )}
    </Box>
  );
}

export default function AlbumDetailPage() {
  return (
    <ProtectedRoute>
      <AlbumDetailPageContent />
    </ProtectedRoute>
  );
}
