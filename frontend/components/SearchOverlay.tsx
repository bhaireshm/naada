'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Modal, TextInput, Tabs, Stack, Text, Loader, Center, Box, useMantineTheme, Alert, Button } from '@mantine/core';
import { IconSearch, IconMusic, IconUser, IconDisc, IconPlaylist, IconClock, IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useSearch, SearchFilter } from '@/contexts/SearchContext';
import SearchResultItem from '@/components/SearchResultItem';
import { useRouter } from 'next/navigation';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { getSongs } from '@/lib/api';

export default function SearchOverlay() {
  const {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    activeFilter,
    setActiveFilter,
    results,
    isLoading,
    performSearch,
    searchHistory,
    clearHistory,
    selectedIndex,
    setSelectedIndex,
    error,
    retrySearch,
  } = useSearch();
  
  const theme = useMantineTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setQueue } = useAudioPlayerContext();

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    performSearch(value);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    performSearch(historyQuery);
  };

  const handleSongClick = useCallback(async (songId: string) => {
    try {
      // Fetch all songs to set up the queue
      const allSongs = await getSongs();
      const songIndex = allSongs.findIndex(s => s.id === songId);
      if (songIndex !== -1) {
        setQueue(allSongs, songIndex);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to play song:', error);
    }
  }, [setQueue, handleClose]);

  const handleArtistClick = useCallback((artistName: string) => {
    router.push(`/library?artist=${encodeURIComponent(artistName)}`);
    handleClose();
  }, [router, handleClose]);

  const handleAlbumClick = useCallback((albumName: string, artistName: string) => {
    router.push(`/library?album=${encodeURIComponent(albumName)}&artist=${encodeURIComponent(artistName)}`);
    handleClose();
  }, [router, handleClose]);

  const handlePlaylistClick = useCallback((playlistId: string) => {
    router.push(`/playlists/${playlistId}`);
    handleClose();
  }, [router, handleClose]);

  const handleResultActivation = useCallback(() => {
    if (!results || selectedIndex < 0) return;

    let currentIndex = 0;

    // Check songs
    if (selectedIndex < results.results.songs.length) {
      const song = results.results.songs[selectedIndex];
      handleSongClick(song.id);
      return;
    }
    currentIndex += results.results.songs.length;

    // Check artists
    if (selectedIndex < currentIndex + results.results.artists.length) {
      const artist = results.results.artists[selectedIndex - currentIndex];
      handleArtistClick(artist.name);
      return;
    }
    currentIndex += results.results.artists.length;

    // Check albums
    if (selectedIndex < currentIndex + results.results.albums.length) {
      const album = results.results.albums[selectedIndex - currentIndex];
      handleAlbumClick(album.name, album.artist);
      return;
    }
    currentIndex += results.results.albums.length;

    // Check playlists
    if (selectedIndex < currentIndex + results.results.playlists.length) {
      const playlist = results.results.playlists[selectedIndex - currentIndex];
      handlePlaylistClick(playlist.id);
      return;
    }
  }, [results, selectedIndex, handleSongClick, handleArtistClick, handleAlbumClick, handlePlaylistClick]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if input is focused (let user type)
      if (document.activeElement === inputRef.current) {
        // Only handle Escape and Arrow keys when input is focused
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
          return;
        }
        // Arrow keys should move focus out of input to results
        if (e.key === 'ArrowDown' && results) {
          e.preventDefault();
          inputRef.current?.blur();
          // Will be handled by selectedIndex logic
        }
        return;
      }

      // Handle keyboard navigation in results
      if (!results) return;

      const totalResults = 
        results.results.songs.length +
        results.results.artists.length +
        results.results.albums.length +
        results.results.playlists.length;

      if (totalResults === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((selectedIndex + 1) % totalResults);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((selectedIndex - 1 + totalResults) % totalResults);
          break;
        case 'Enter':
          e.preventDefault();
          handleResultActivation();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleResultActivation, isOpen, results, selectedIndex, setSelectedIndex]);

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      size="xl"
      padding="md"
      centered
      withCloseButton={false}
      fullScreen={typeof window !== 'undefined' && window.innerWidth < 768}
      styles={{
        body: {
          padding: 0,
        },
        content: {
          maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '100vh' : '80vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box p="md">
        {/* Search Input */}
        <TextInput
          ref={inputRef}
          placeholder="Search songs, artists, albums, playlists..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          leftSection={<IconSearch size={18} />}
          size="lg"
          styles={{
            input: {
              border: 'none',
              borderBottom: `2px solid ${theme.colors.gray[3]}`,
              borderRadius: 0,
              paddingLeft: '2.5rem',
              fontSize: theme.fontSizes.lg,
              '&:focus': {
                borderBottomColor: theme.colors.accent1[6],
              },
            },
          }}
        />

        {/* Filter Tabs */}
        <Tabs
          value={activeFilter}
          onChange={(value) => setActiveFilter(value as SearchFilter)}
          mt="md"
        >
          <Tabs.List>
            <Tabs.Tab value="all">All</Tabs.Tab>
            <Tabs.Tab value="songs" leftSection={<IconMusic size={14} />}>
              Songs
            </Tabs.Tab>
            <Tabs.Tab value="artists" leftSection={<IconUser size={14} />}>
              Artists
            </Tabs.Tab>
            <Tabs.Tab value="albums" leftSection={<IconDisc size={14} />}>
              Albums
            </Tabs.Tab>
            <Tabs.Tab value="playlists" leftSection={<IconPlaylist size={14} />}>
              Playlists
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </Box>

      {/* Results Area */}
      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 180px)',
        }}
        p="md"
      >
        {/* Error State */}
        {error && !isLoading && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Search Error"
            color="red"
            withCloseButton
            onClose={() => {}}
            mb="md"
          >
            <Stack gap="sm">
              <Text size="sm">{error}</Text>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconRefresh size={14} />}
                onClick={retrySearch}
              >
                Retry Search
              </Button>
            </Stack>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader size="md" color="accent1" />
              <Text size="sm" c="dimmed">
                Searching...
              </Text>
            </Stack>
          </Center>
        )}

        {/* Search History (when query is empty) */}
        {!query && !isLoading && searchHistory.length > 0 && (
          <Stack gap="xs">
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text size="sm" fw={600} c="dimmed">
                Recent Searches
              </Text>
              <Text
                size="xs"
                c="dimmed"
                style={{ cursor: 'pointer' }}
                onClick={clearHistory}
              >
                Clear all
              </Text>
            </Box>
            {searchHistory.map((item, index) => (
              <Box
                key={index}
                p="sm"
                style={{
                  cursor: 'pointer',
                  borderRadius: theme.radius.sm,
                  transition: 'background-color 150ms ease',
                  '&:hover': {
                    backgroundColor: theme.colors.gray[1],
                  },
                }}
                onClick={() => handleHistoryClick(item.query)}
              >
                <Box style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <IconClock size={16} color={theme.colors.gray[6]} />
                  <Text size="sm">{item.query}</Text>
                </Box>
              </Box>
            ))}
          </Stack>
        )}

        {/* Empty State (no query) */}
        {!query && !isLoading && searchHistory.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Box
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent1[1]} 0%, ${theme.colors.secondary[1]} 100%)`,
                  borderRadius: '50%',
                  padding: theme.spacing.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSearch size={48} color={theme.colors.accent1[6]} stroke={1.5} />
              </Box>
              <Stack align="center" gap="xs">
                <Text size="sm" fw={500} ta="center">
                  Start typing to search your music library
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  Press Ctrl+K (Cmd+K on Mac) to open search anytime
                </Text>
              </Stack>
            </Stack>
          </Center>
        )}

        {/* No Results */}
        {query && !isLoading && results && (
          results.totalCounts.songs === 0 &&
          results.totalCounts.artists === 0 &&
          results.totalCounts.albums === 0 &&
          results.totalCounts.playlists === 0
        ) && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Box
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.secondary[1]} 0%, ${theme.colors.accent2[1]} 100%)`,
                  borderRadius: '50%',
                  padding: theme.spacing.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconMusic size={48} color={theme.colors.accent2[6]} stroke={1.5} />
              </Box>
              <Stack align="center" gap="xs">
                <Text size="sm" fw={500} ta="center">
                  No results found for &ldquo;{query}&rdquo;
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  Try different keywords or check your spelling
                </Text>
              </Stack>
            </Stack>
          </Center>
        )}

        {/* Results Display */}
        {query && !isLoading && results && (
          <Stack gap="lg">
            {/* Songs */}
            {(activeFilter === 'all' || activeFilter === 'songs') && results.results.songs.length > 0 && (
              <Box>
                <Text size="sm" fw={600} c="dimmed" mb="xs">
                  Songs {results.totalCounts.songs > results.results.songs.length && `(${results.results.songs.length} of ${results.totalCounts.songs})`}
                </Text>
                <Stack gap={4}>
                  {results.results.songs.map((song, index) => (
                    <SearchResultItem
                      key={song.id}
                      type="song"
                      result={song}
                      isSelected={selectedIndex === index}
                      onClick={() => handleSongClick(song.id)}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Artists */}
            {(activeFilter === 'all' || activeFilter === 'artists') && results.results.artists.length > 0 && (
              <Box>
                <Text size="sm" fw={600} c="dimmed" mb="xs">
                  Artists {results.totalCounts.artists > results.results.artists.length && `(${results.results.artists.length} of ${results.totalCounts.artists})`}
                </Text>
                <Stack gap={4}>
                  {results.results.artists.map((artist, index) => (
                    <SearchResultItem
                      key={artist.name}
                      type="artist"
                      result={artist}
                      isSelected={selectedIndex === index + results.results.songs.length}
                      onClick={() => handleArtistClick(artist.name)}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Albums */}
            {(activeFilter === 'all' || activeFilter === 'albums') && results.results.albums.length > 0 && (
              <Box>
                <Text size="sm" fw={600} c="dimmed" mb="xs">
                  Albums {results.totalCounts.albums > results.results.albums.length && `(${results.results.albums.length} of ${results.totalCounts.albums})`}
                </Text>
                <Stack gap={4}>
                  {results.results.albums.map((album, index) => (
                    <SearchResultItem
                      key={`${album.name}-${album.artist}`}
                      type="album"
                      result={album}
                      isSelected={selectedIndex === index + results.results.songs.length + results.results.artists.length}
                      onClick={() => handleAlbumClick(album.name, album.artist)}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Playlists */}
            {(activeFilter === 'all' || activeFilter === 'playlists') && results.results.playlists.length > 0 && (
              <Box>
                <Text size="sm" fw={600} c="dimmed" mb="xs">
                  Playlists {results.totalCounts.playlists > results.results.playlists.length && `(${results.results.playlists.length} of ${results.totalCounts.playlists})`}
                </Text>
                <Stack gap={4}>
                  {results.results.playlists.map((playlist, index) => (
                    <SearchResultItem
                      key={playlist.id}
                      type="playlist"
                      result={playlist}
                      isSelected={selectedIndex === index + results.results.songs.length + results.results.artists.length + results.results.albums.length}
                      onClick={() => handlePlaylistClick(playlist.id)}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Modal>
  );
}
