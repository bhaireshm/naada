'use client';

import { Box, Text, Group, ActionIcon, useMantineTheme } from '@mantine/core';
import { IconPlayerPlay, IconMusic, IconUser, IconDisc, IconPlaylist } from '@tabler/icons-react';
import type { SongResult, ArtistResult, AlbumResult, PlaylistResult } from '@/contexts/SearchContext';

interface SearchResultItemProps {
  type: 'song' | 'artist' | 'album' | 'playlist';
  result: SongResult | ArtistResult | AlbumResult | PlaylistResult;
  isSelected?: boolean;
  onClick: () => void;
}

export default function SearchResultItem({ type, result, isSelected, onClick }: SearchResultItemProps) {
  const theme = useMantineTheme();

  const getIcon = () => {
    switch (type) {
      case 'song':
        return <IconMusic size={20} />;
      case 'artist':
        return <IconUser size={20} />;
      case 'album':
        return <IconDisc size={20} />;
      case 'playlist':
        return <IconPlaylist size={20} />;
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'song': {
        const song = result as SongResult;
        return (
          <>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {song.title}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {song.artist}
                {song.album && ` • ${song.album}`}
              </Text>
            </Box>
            <ActionIcon
              variant="subtle"
              color="blue"
              size="lg"
            >
              <IconPlayerPlay size={18} />
            </ActionIcon>
          </>
        );
      }
      case 'artist': {
        const artist = result as ArtistResult;
        return (
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} truncate>
              {artist.name}
            </Text>
            <Text size="xs" c="dimmed">
              {artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'}
              {artist.albums.length > 0 && ` • ${artist.albums.length} ${artist.albums.length === 1 ? 'album' : 'albums'}`}
            </Text>
          </Box>
        );
      }
      case 'album': {
        const album = result as AlbumResult;
        return (
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} truncate>
              {album.name}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {album.artist} • {album.songCount} {album.songCount === 1 ? 'song' : 'songs'}
              {album.year && ` • ${album.year}`}
            </Text>
          </Box>
        );
      }
      case 'playlist': {
        const playlist = result as PlaylistResult;
        return (
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} truncate>
              {playlist.name}
            </Text>
            <Text size="xs" c="dimmed">
              {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
            </Text>
          </Box>
        );
      }
    }
  };

  return (
    <Box
      p="sm"
      style={{
        cursor: 'pointer',
        borderRadius: theme.radius.sm,
        backgroundColor: isSelected ? theme.colors.gray[1] : 'transparent',
        transition: 'background-color 150ms ease',
        border: isSelected ? `1px solid ${theme.colors.accent1[4]}` : '1px solid transparent',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = theme.colors.gray[0];
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <Group wrap="nowrap" gap="sm">
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.gray[1],
            color: theme.colors.gray[6],
          }}
        >
          {getIcon()}
        </Box>
        {renderContent()}
      </Group>
    </Box>
  );
}
