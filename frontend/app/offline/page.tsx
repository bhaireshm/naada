'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Progress,
  ActionIcon,
  Badge,
  Alert,
} from '@mantine/core';
import { IconTrash, IconMusic, IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { downloadManager } from '@/lib/offline/downloadManager';
import { StoredSong } from '@/lib/offline/indexedDB';
import { notifications } from '@mantine/notifications';

export default function OfflinePage() {
  const [offlineSongs, setOfflineSongs] = useState<StoredSong[]>([]);
  const [storageStats, setStorageStats] = useState<{
    usage: number;
    quota: number;
    percentUsed: number;
    offlineSongs: number;
    estimatedSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [songs, stats] = await Promise.all([
        downloadManager.getOfflineSongs(),
        downloadManager.getStorageStats(),
      ]);

      setOfflineSongs(songs);
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load offline data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load offline data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveSong = async (songId: string, title: string) => {
    try {
      await downloadManager.removeSong(songId);
      notifications.show({
        title: 'Removed',
        message: `${title} removed from offline storage`,
        color: 'blue',
      });
      loadData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove song',
        color: 'red',
      });
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to remove all offline songs?')) {
      return;
    }

    try {
      await downloadManager.clearAllOfflineData();
      notifications.show({
        title: 'Cleared',
        message: 'All offline data has been removed',
        color: 'blue',
      });
      loadData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to clear offline data',
        color: 'red',
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Offline Storage</Title>
            <Text c="dimmed" size="sm">
              Manage your downloaded songs for offline playback
            </Text>
          </div>
          <ActionIcon variant="subtle" onClick={loadData} loading={loading}>
            <IconRefresh size={20} />
          </ActionIcon>
        </Group>

        {/* Storage Stats */}
        {storageStats && (
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={500}>Storage Usage</Text>
                <Badge color={storageStats.percentUsed > 80 ? 'red' : 'blue'}>
                  {storageStats.percentUsed}% used
                </Badge>
              </Group>

              <Progress value={storageStats.percentUsed} size="lg" />

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {formatBytes(storageStats.usage)} / {formatBytes(storageStats.quota)}
                </Text>
                <Text size="sm" c="dimmed">
                  {storageStats.offlineSongs} songs ({formatBytes(storageStats.estimatedSize)})
                </Text>
              </Group>
            </Stack>
          </Paper>
        )}

        {/* Warning if storage is low */}
        {storageStats && storageStats.percentUsed > 80 && (
          <Alert icon={<IconAlertCircle size={16} />} title="Storage Almost Full" color="yellow">
            Your offline storage is almost full. Consider removing some songs to free up space.
          </Alert>
        )}

        {/* Offline Songs List */}
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={500}>Offline Songs ({offlineSongs.length})</Text>
            {offlineSongs.length > 0 && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            )}
          </Group>

          {loading ? (
            <Text c="dimmed" ta="center" py="xl">
              Loading...
            </Text>
          ) : offlineSongs.length === 0 ? (
            <Stack align="center" gap="sm" py="xl">
              <IconMusic size={48} stroke={1.5} opacity={0.3} />
              <Text c="dimmed" ta="center">
                No offline songs yet
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Download songs from your library to play them offline
              </Text>
            </Stack>
          ) : (
            <Stack gap="xs">
              {offlineSongs.map((song) => (
                <Paper key={song.id} p="sm" withBorder>
                  <Group justify="space-between">
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {song.title}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {song.artist}
                      </Text>
                      {song.downloadedAt && (
                        <Text size="xs" c="dimmed">
                          Downloaded {new Date(song.downloadedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </div>

                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleRemoveSong(song.id, song.title)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Info */}
        <Alert icon={<IconAlertCircle size={16} />} title="About Offline Storage" color="blue">
          <Text size="sm">
            Downloaded songs are stored on your device and can be played without an internet connection.
            Your offline data will sync automatically when you&apos;re back online.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
