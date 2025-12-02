'use client';

import { Song, getSongStreamUrl } from '@/lib/api';
import { Box, Group, Text, ActionIcon, Menu, useMantineTheme } from '@mantine/core';
import { IconPlayerPlay, IconDots, IconPlaylistAdd, IconInfoCircle, IconDownload, IconCheck, IconTrash } from '@tabler/icons-react';
import PlayingAnimation from '@/components/PlayingAnimation';
import FavoriteButton from '@/components/FavoriteButton';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import { getCardBackground, getCardBorder, getActiveBackground, getTransition } from '@/lib/themeColors';
import { formatArtists } from '@/lib/artistUtils';
import { downloadManager } from '@/lib/offline/downloadManager';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { useSongActions } from '@/hooks/useSongActions';

interface SongListItemProps {
  song: Song;
  index: number;
  isPlaying: boolean;
  isCurrentSong: boolean;
  onPlay: (song: Song, index: number) => void;
  onViewDetails: (songId: string) => void;
  onRefresh?: () => void;
  showFavoriteInMenu?: boolean;
}

export default function SongListItem({
  song,
  index,
  isPlaying,
  isCurrentSong,
  onPlay,
  onViewDetails,
  onRefresh,
  showFavoriteInMenu = false,
}: SongListItemProps) {
  const theme = useMantineTheme();
  const [isOffline, setIsOffline] = useState(false);

  // Use song actions hook
  const { canDelete, handleDelete } = useSongActions(song, {
    onDeleteSuccess: onRefresh,
  });

  useEffect(() => {
    const checkOfflineStatus = async () => {
      const offline = await downloadManager.isSongOffline(song.id);
      setIsOffline(offline);
    };
    checkOfflineStatus();
  }, [song.id]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOffline) {
      // Remove from offline storage
      try {
        await downloadManager.removeSong(song.id);
        setIsOffline(false);
        notifications.show({
          title: 'Removed from Offline',
          message: `${song.title} removed from offline storage`,
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

    // Download song for offline
    try {
      const songUrl = getSongStreamUrl(song.id);
      const artist = Array.isArray(song.artist) ? formatArtists(song.artist) : song.artist;

      await downloadManager.queueDownload(
        song.id,
        song.title,
        artist,
        songUrl,
        1,
        (progress) => {
          if (progress.status === 'completed') {
            setIsOffline(true);
            notifications.show({
              title: 'Download Complete',
              message: `${song.title} is now available offline`,
              color: 'green',
            });
          } else if (progress.status === 'failed') {
            notifications.show({
              title: 'Download Failed',
              message: progress.error || 'Failed to download song',
              color: 'red',
            });
          }
        }
      );
    } catch (error) {
      console.error('Download failed:', error);
      notifications.show({
        title: 'Download Failed',
        message: 'Failed to download song for offline playback',
        color: 'red',
      });
    }
  };

  return (
    <Box
      p="md"
      style={{
        background: isCurrentSong
          ? getActiveBackground(theme)
          : getCardBackground(theme),
        borderRadius: theme.radius.md,
        border: `1px solid ${isCurrentSong ? theme.colors.accent1[4] : getCardBorder(theme)}`,
        transition: getTransition(theme),
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Box
          style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
          onClick={() => onViewDetails(song.id)}
        >
          <Text fw={isCurrentSong ? 600 : 400} truncate>
            {song.title}
          </Text>
          <Text c="dimmed" size="sm" truncate>
            {Array.isArray(song.artist) ? formatArtists(song.artist) : song.artist}
          </Text>
          {song.album && (
            <Text c="dimmed" size="xs" truncate>
              {song.album}
            </Text>
          )}
        </Box>
        <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
          <ActionIcon
            variant={isCurrentSong ? 'filled' : 'subtle'}
            color="accent1"
            size={44}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(song, index);
            }}
            aria-label={isCurrentSong && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {isCurrentSong && isPlaying ? (
              <PlayingAnimation size={22} color="white" />
            ) : (
              <IconPlayerPlay size={22} />
            )}
          </ActionIcon>
          <Menu position="bottom-end" shadow="md" width={180} zIndex={500}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size={44}
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="More options"
              >
                <IconDots size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown p={4}>
              <Menu.Item
                leftSection={<IconPlayerPlay size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(song, index);
                }}
                style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
              >
                Play
              </Menu.Item>
              {showFavoriteInMenu && (
                <Menu.Item
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                >
                  <FavoriteButton songId={song.id} size="sm" />
                </Menu.Item>
              )}
              <Menu
                trigger="click"
                position="left-start"
                offset={2}
                withArrow
                zIndex={501}
              >
                <Menu.Target>
                  <Menu.Item
                    leftSection={<IconPlaylistAdd size={16} />}
                    style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                  >
                    Add to Playlist
                  </Menu.Item>
                </Menu.Target>
                <AddToPlaylistMenu songId={song.id} onSuccess={onRefresh} />
              </Menu>
              <Menu.Item
                leftSection={isOffline ? <IconCheck size={16} /> : <IconDownload size={16} />}
                onClick={handleDownload}
                color={isOffline ? 'green' : undefined}
                style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
              >
                {isOffline ? 'Remove from Offline' : 'Download for Offline'}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconInfoCircle size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(song.id);
                }}
                style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
              >
                Details
              </Menu.Item>

              {canDelete && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={16} />}
                    color="red"
                    onClick={handleDelete}
                    style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                  >
                    Delete
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
}
