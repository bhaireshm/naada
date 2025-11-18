'use client';

import { useState, useEffect } from 'react';
import { ActionIcon, Tooltip, Progress, Box } from '@mantine/core';
import { IconDownload, IconCheck, IconX } from '@tabler/icons-react';
import { downloadManager, DownloadProgress } from '@/lib/offline/downloadManager';
import { notifications } from '@mantine/notifications';

interface DownloadButtonProps {
  songId: string;
  title: string;
  artist: string;
  fileUrl: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Download Button Component
 * Shows download status and allows downloading songs for offline playback
 */
export function DownloadButton({ songId, title, artist, fileUrl, size = 'sm' }: DownloadButtonProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if song is already downloaded
    const checkOfflineStatus = async () => {
      const offline = await downloadManager.isSongOffline(songId);
      setIsOffline(offline);
    };

    checkOfflineStatus();
  }, [songId]);

  const handleDownload = async () => {
    if (isOffline) {
      // Remove from offline storage
      try {
        await downloadManager.removeSong(songId);
        setIsOffline(false);
        notifications.show({
          title: 'Removed from Offline',
          message: `${title} removed from offline storage`,
          color: 'blue',
        });
      } catch (err) {
        notifications.show({
          title: 'Error',
          message: 'Failed to remove song from offline storage',
          color: 'red',
        });
      }
      return;
    }

    // Download song
    setIsDownloading(true);
    setError(null);
    setProgress(0);

    try {
      await downloadManager.queueDownload(
        songId,
        title,
        artist,
        fileUrl,
        1, // Normal priority
        (downloadProgress: DownloadProgress) => {
          setProgress(downloadProgress.progress);

          if (downloadProgress.status === 'completed') {
            setIsDownloading(false);
            setIsOffline(true);
            notifications.show({
              title: 'Download Complete',
              message: `${title} is now available offline`,
              color: 'green',
            });
          } else if (downloadProgress.status === 'failed') {
            setIsDownloading(false);
            setError(downloadProgress.error || 'Download failed');
            notifications.show({
              title: 'Download Failed',
              message: downloadProgress.error || 'Failed to download song',
              color: 'red',
            });
          }
        }
      );
    } catch (err) {
      setIsDownloading(false);
      setError(err instanceof Error ? err.message : 'Download failed');
      notifications.show({
        title: 'Download Failed',
        message: 'Failed to download song for offline playback',
        color: 'red',
      });
    }
  };

  const getIcon = () => {
    if (error) return <IconX size={16} />;
    if (isOffline) return <IconCheck size={16} />;
    return <IconDownload size={16} />;
  };

  const getColor = () => {
    if (error) return 'red';
    if (isOffline) return 'green';
    return 'blue';
  };

  const getTooltip = () => {
    if (error) return `Download failed: ${error}`;
    if (isDownloading) return `Downloading... ${progress}%`;
    if (isOffline) return 'Remove from offline';
    return 'Download for offline playback';
  };

  return (
    <Box style={{ position: 'relative' }}>
      <Tooltip label={getTooltip()} position="top">
        <ActionIcon
          variant={isOffline ? 'filled' : 'subtle'}
          color={getColor()}
          size={size}
          onClick={handleDownload}
          loading={isDownloading}
          disabled={isDownloading}
        >
          {getIcon()}
        </ActionIcon>
      </Tooltip>

      {isDownloading && (
        <Progress
          value={progress}
          size="xs"
          style={{
            position: 'absolute',
            bottom: -4,
            left: 0,
            right: 0,
          }}
        />
      )}
    </Box>
  );
}
