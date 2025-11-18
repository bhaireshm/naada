'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPlaylists, createPlaylist, deletePlaylist, Playlist } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import {
  Container,
  Title,
  Button,
  SimpleGrid,
  Card,
  Text,
  Stack,
  Alert,
  Box,
  Group,
  Skeleton,
  Modal,
  TextInput,
  ActionIcon,
  useMantineTheme,
  useMantineColorScheme,
  Tabs,
} from '@mantine/core';
import {
  IconPlaylist,
  IconPlus,
  IconAlertCircle,
  IconTrash,
  IconHeart,
} from '@tabler/icons-react';

import Pagination from '@/components/Pagination';

function PlaylistsPageContent() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'followed'>('my');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } catch (err) {
      setError('Failed to load playlists. Please try again.');
      console.error('Error fetching playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const myPlaylists = playlists.filter(p => p.ownerId === user?.uid || p.userId === user?.uid);
  const followedPlaylists = playlists.filter(p => 
    (p.ownerId !== user?.uid && p.userId !== user?.uid) && 
    p.followers.includes(user?.uid || '')
  );

  // Pagination for active tab
  const activePlaylistsData = activeTab === 'my' ? myPlaylists : followedPlaylists;
  const totalPages = Math.ceil(activePlaylistsData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlaylists = activePlaylistsData.slice(startIndex, endIndex);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) return;

    setCreating(true);
    try {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateModal(false);
      await fetchPlaylists();
      
      notifications.show({
        title: 'Success',
        message: `Playlist "${newPlaylistName.trim()}" created successfully`,
        color: 'green',
      });
    } catch (err) {
      console.error('Error creating playlist:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to create playlist. Please try again.',
        color: 'red',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await deletePlaylist(playlistId);
      await fetchPlaylists();
      
      notifications.show({
        title: 'Success',
        message: 'Playlist deleted successfully',
        color: 'green',
      });
    } catch (err) {
      console.error('Error deleting playlist:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete playlist. Please try again.',
        color: 'red',
      });
    }
  };

  const handleViewPlaylist = (playlistId: string) => {
    router.push(`/playlists/${playlistId}`);
  };

  return (
    <Box pb={90}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Group justify="space-between" align="center" mb={theme.spacing.lg}>
          <div>
            <Title 
              order={1}
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              }}
            >
              Playlists
            </Title>
            <Text c="dimmed" size="sm">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
            variant="gradient"
            gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
            size="sm"
          >
            New Playlist
          </Button>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'my' | 'followed')} mb="lg">
          <Tabs.List>
            <Tabs.Tab value="my" leftSection={<IconPlaylist size={16} />}>
              My Playlists
            </Tabs.Tab>
            <Tabs.Tab value="followed" leftSection={<IconHeart size={16} />}>
              Followed
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Loading State */}
        {loading && (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing={theme.spacing.md}>
            <Skeleton height={150} radius={theme.radius.md} />
            <Skeleton height={150} radius={theme.radius.md} />
            <Skeleton height={150} radius={theme.radius.md} />
          </SimpleGrid>
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
            <Button size="xs" variant="outline" onClick={fetchPlaylists}>
              Try again
            </Button>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && (activeTab === 'my' ? myPlaylists : followedPlaylists).length === 0 && (
          <Card
            shadow="sm"
            padding="lg"
            radius={theme.radius.md}
            style={{
              background: colorScheme === 'dark' ? theme.colors.primary[9] : theme.colors.primary[0],
              border: `1px solid ${colorScheme === 'dark' ? theme.colors.secondary[8] : theme.colors.secondary[3]}`,
            }}
          >
            <Stack align="center" gap={theme.spacing.md} py={40}>
              <Box
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
                  borderRadius: '50%',
                  padding: theme.spacing.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPlaylist size={32} stroke={1.5} color={theme.colors.primary[0]} />
              </Box>
              <Stack gap="xs" align="center">
                <Text size="lg" fw={600}>
                  {activeTab === 'my' ? 'No playlists yet' : 'No followed playlists'}
                </Text>
                <Text c="dimmed" size="sm" ta="center" maw={350}>
                  {activeTab === 'my' 
                    ? 'Create your first playlist to organize your favorite songs.'
                    : 'Follow public playlists from the Discover page.'}
                </Text>
              </Stack>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowCreateModal(true)}
                variant="gradient"
                gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
                size="sm"
              >
                Create Playlist
              </Button>
            </Stack>
          </Card>
        )}

        {/* Playlist Grid */}
        {!loading && !error && activePlaylistsData.length > 0 && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={theme.spacing.md}>
              {paginatedPlaylists.map((playlist) => {
              const songCount = Array.isArray(playlist.songIds) ? playlist.songIds.length : 0;
              
              return (
                <Card
                  key={playlist.id}
                  shadow="sm"
                  padding="md"
                  radius={theme.radius.md}
                  style={{
                    cursor: 'pointer',
                    transition: `all ${theme.other.transitionDuration.normal} ${theme.other.easingFunctions.easeInOut}`,
                    background: colorScheme === 'dark' ? theme.colors.primary[9] : theme.colors.primary[0],
                    border: `1px solid ${colorScheme === 'dark' ? theme.colors.secondary[8] : theme.colors.secondary[3]}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                    e.currentTarget.style.borderColor = theme.colors.accent1[6];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme.shadows.sm;
                    e.currentTarget.style.borderColor = colorScheme === 'dark' ? theme.colors.secondary[8] : theme.colors.secondary[3];
                  }}
                  onClick={() => handleViewPlaylist(playlist.id)}
                >
                  <Stack gap={theme.spacing.sm}>
                    <Group gap={theme.spacing.sm} wrap="nowrap">
                      <Box
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
                          borderRadius: theme.radius.sm,
                          padding: theme.spacing.sm,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '44px',
                          height: '44px',
                        }}
                      >
                        <IconPlaylist size={24} stroke={1.5} color={theme.colors.primary[0]} />
                      </Box>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={600} lineClamp={1}>
                          {playlist.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {songCount} {songCount === 1 ? 'song' : 'songs'}
                        </Text>
                      </Box>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      <Button
                        flex={1}
                        size="xs"
                        variant="light"
                        color="accent1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPlaylist(playlist.id);
                        }}
                      >
                        Open
                      </Button>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size={32}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(playlist.id);
                        }}
                        aria-label="Delete playlist"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>

          {/* Pagination */}
          {activePlaylistsData.length > itemsPerPage && (
            <Box mt="xl">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={activePlaylistsData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </Box>
          )}
          </>
        )}
      </Container>

      {/* Create Playlist Modal */}
      <Modal
        opened={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewPlaylistName('');
        }}
        title={
          <Text 
            fw={600} 
            size="md"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Create Playlist
          </Text>
        }
        centered
        size="sm"
        padding="md"
      >
        <form onSubmit={handleCreatePlaylist}>
          <Stack gap={theme.spacing.sm}>
            <TextInput
              label="Name"
              placeholder="My Playlist"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              disabled={creating}
              required
              data-autofocus
              size="sm"
            />
            <Group justify="flex-end" gap="xs">
              <Button
                variant="subtle"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                }}
                disabled={creating}
                size="xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={creating}
                disabled={!newPlaylistName.trim()}
                variant="gradient"
                gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
                size="xs"
              >
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Box>
  );
}


export default function PlaylistsPage() {
  return (
    <ProtectedRoute>
      <PlaylistsPageContent />
    </ProtectedRoute>
  );
}
