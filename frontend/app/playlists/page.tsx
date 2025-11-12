'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPlaylists, createPlaylist, deletePlaylist, Playlist } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
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
} from '@mantine/core';
import {
  IconPlaylist,
  IconPlus,
  IconAlertCircle,
  IconTrash,
} from '@tabler/icons-react';

function PlaylistsPageContent() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

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
    <Box pb={80}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Group justify="space-between" align="center" mb="lg">
          <div>
            <Title 
              order={1}
              style={{
                background: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              }}
            >
              My Playlists
            </Title>
            <Text c="dimmed" size="sm">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
            variant="gradient"
            gradient={{ from: 'deepBlue.7', to: 'slate.7', deg: 135 }}
            size="sm"
          >
            New Playlist
          </Button>
        </Group>

        {/* Loading State */}
        {loading && (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            <Skeleton height={150} radius="md" />
            <Skeleton height={150} radius="md" />
            <Skeleton height={150} radius="md" />
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
        {!loading && !error && playlists.length === 0 && (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            style={{
              background: 'white',
              border: '1px solid rgba(189, 195, 199, 0.2)',
            }}
          >
            <Stack align="center" gap="md" py={40}>
              <Box
                style={{
                  background: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
                  borderRadius: '50%',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPlaylist size={32} stroke={1.5} color="white" />
              </Box>
              <Stack gap="xs" align="center">
                <Text size="lg" fw={600}>
                  No playlists yet
                </Text>
                <Text c="dimmed" size="sm" ta="center" maw={350}>
                  Create your first playlist to organize your favorite songs.
                </Text>
              </Stack>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowCreateModal(true)}
                variant="gradient"
                gradient={{ from: 'deepBlue.7', to: 'slate.7', deg: 135 }}
                size="sm"
              >
                Create Playlist
              </Button>
            </Stack>
          </Card>
        )}

        {/* Playlist Grid */}
        {!loading && !error && playlists.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {playlists.map((playlist) => {
              const songCount = Array.isArray(playlist.songIds) ? playlist.songIds.length : 0;
              
              return (
                <Card
                  key={playlist.id}
                  shadow="sm"
                  padding="md"
                  radius="md"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    border: '1px solid rgba(189, 195, 199, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(1, 31, 75, 0.1)';
                    e.currentTarget.style.borderColor = '#011f4b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                    e.currentTarget.style.borderColor = 'rgba(189, 195, 199, 0.2)';
                  }}
                  onClick={() => handleViewPlaylist(playlist.id)}
                >
                  <Stack gap="sm">
                    <Group gap="sm" wrap="nowrap">
                      <Box
                        style={{
                          background: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '44px',
                          height: '44px',
                        }}
                      >
                        <IconPlaylist size={24} stroke={1.5} color="white" />
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
                        color="deepBlue"
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
              background: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
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
          <Stack gap="sm">
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
                gradient={{ from: 'deepBlue.7', to: 'slate.7', deg: 135 }}
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
