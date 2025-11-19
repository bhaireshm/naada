'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAlbums, Album } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Stack,
  Alert,
  Box,
  Skeleton,
  useMantineTheme,
  useMantineColorScheme,
  Image,
  Group,
} from '@mantine/core';
import { IconAlertCircle, IconDisc } from '@tabler/icons-react';
import InfiniteScroll from '@/components/InfiniteScroll';
import { getGradient, getTextGradient, getCardBackground, getCardBorder, getTransition } from '@/lib/themeColors';

function AlbumsPageContent() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    setError(null);

    try {
      const albumList = await getAlbums();
      setAlbums(albumList);
    } catch (err) {
      setError('Failed to load albums. Please try again.');
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayedAlbums = albums.slice(0, displayCount);
  const hasMore = displayCount < albums.length;

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + 20, albums.length));
      setIsLoadingMore(false);
    }, 300);
  };

  const handleAlbumClick = (album: Album) => {
    router.push(`/albums/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.album)}`);
  };

  return (
    <Box pb={90}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Box
          mb="xl"
          p="xl"
          style={{
            background: getGradient(theme, 'secondary'),
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.md,
          }}
        >
          <Stack gap="xs">
            <Title order={1} style={{ ...getTextGradient(theme), fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              Albums
            </Title>
            <Text c="dimmed" size="sm">
              {albums.length} {albums.length === 1 ? 'album' : 'albums'}
            </Text>
          </Stack>
        </Box>

        {/* Loading State */}
        {loading && (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={theme.spacing.md}>
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} height={250} radius={theme.radius.md} />
            ))}
          </SimpleGrid>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert icon={<IconAlertCircle size={18} />} title="Error" color="red" variant="light">
            <Text size="sm">{error}</Text>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && albums.length === 0 && (
          <Box
            p="xl"
            style={{
              background: getGradient(theme, 'secondary'),
              borderRadius: theme.radius.md,
            }}
          >
            <Stack align="center" gap={theme.spacing.md} py={60}>
              <Box
                style={{
                  background: getGradient(theme, 'accent'),
                  borderRadius: '50%',
                  padding: theme.spacing.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconDisc size={48} stroke={1.5} color={theme.colors.primary[0]} />
              </Box>
              <Title order={3}>No albums yet</Title>
              <Text c="dimmed" size="sm" ta="center" maw={400}>
                Upload songs with album information to see them organized here.
              </Text>
            </Stack>
          </Box>
        )}

        {/* Albums Grid */}
        {!loading && !error && albums.length > 0 && (
          <InfiniteScroll hasMore={hasMore} loading={isLoadingMore} onLoadMore={loadMore}>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={theme.spacing.md}>
              {displayedAlbums.map((album) => (
                <Card
                  key={`${album.artist}-${album.album}`}
                  shadow="sm"
                  padding="md"
                  radius={theme.radius.md}
                  style={{
                    cursor: 'pointer',
                    transition: getTransition(theme),
                    background: getCardBackground(theme, colorScheme),
                    border: `1px solid ${getCardBorder(theme, colorScheme)}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                    e.currentTarget.style.borderColor = theme.colors.accent1[6];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme.shadows.sm;
                    e.currentTarget.style.borderColor = getCardBorder(theme, colorScheme);
                  }}
                  onClick={() => handleAlbumClick(album)}
                >
                  <Card.Section>
                    {album.albumArt ? (
                      <Image src={album.albumArt} height={180} alt={album.album} fit="cover" />
                    ) : (
                      <Box
                        style={{
                          height: 180,
                          background: getGradient(theme, 'accent'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconDisc size={60} color={theme.colors.primary[0]} opacity={0.5} />
                      </Box>
                    )}
                  </Card.Section>

                  <Stack gap="xs" mt="md">
                    <Text size="sm" fw={600} lineClamp={2} style={{ minHeight: 40 }}>
                      {album.album}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {album.artist}
                    </Text>
                    <Group gap="xs">
                      {album.year && (
                        <>
                          <Text size="xs" c="dimmed">
                            {album.year}
                          </Text>
                          <Text size="xs" c="dimmed">
                            •
                          </Text>
                        </>
                      )}
                      <Text size="xs" c="dimmed">
                        {album.songCount} {album.songCount === 1 ? 'song' : 'songs'}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </InfiniteScroll>
        )}
      </Container>
    </Box>
  );
}

export default function AlbumsPage() {
  return (
    <ProtectedRoute>
      <AlbumsPageContent />
    </ProtectedRoute>
  );
}
