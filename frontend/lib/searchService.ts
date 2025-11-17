import { Song } from './api';
import type { SearchResults, SearchFilter, SongResult, ArtistResult, AlbumResult, PlaylistResult } from '@/contexts/SearchContext';

interface Playlist {
  id: string;
  name: string;
  songIds: string[] | Song[];
  createdAt: string;
}

interface CachedResult {
  results: SearchResults;
  timestamp: number;
}

class SearchService {
  private cache: Map<string, CachedResult> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Client-side search for small libraries
   */
  searchLocal(
    query: string,
    songs: Song[],
    playlists: Playlist[],
    filter: SearchFilter,
    limit: number = 5
  ): SearchResults {
    const normalizedQuery = query.toLowerCase().trim();

    const results: SearchResults = {
      query,
      filter,
      results: {
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
      },
      totalCounts: {
        songs: 0,
        artists: 0,
        albums: 0,
        playlists: 0,
      },
      hasMore: false,
    };

    // Search songs
    if (filter === 'all' || filter === 'songs') {
      const songResults = this.searchSongsLocal(normalizedQuery, songs);
      results.results.songs = songResults.slice(0, limit);
      results.totalCounts.songs = songResults.length;
    }

    // Extract artists
    if (filter === 'all' || filter === 'artists') {
      const artistResults = this.searchArtistsLocal(normalizedQuery, songs);
      results.results.artists = artistResults.slice(0, limit);
      results.totalCounts.artists = artistResults.length;
    }

    // Extract albums
    if (filter === 'all' || filter === 'albums') {
      const albumResults = this.searchAlbumsLocal(normalizedQuery, songs);
      results.results.albums = albumResults.slice(0, limit);
      results.totalCounts.albums = albumResults.length;
    }

    // Search playlists
    if (filter === 'all' || filter === 'playlists') {
      const playlistResults = this.searchPlaylistsLocal(normalizedQuery, playlists);
      results.results.playlists = playlistResults.slice(0, limit);
      results.totalCounts.playlists = playlistResults.length;
    }

    // Determine if there are more results
    results.hasMore = this.hasMoreResultsLocal(results, limit);

    return results;
  }

  /**
   * Search songs locally
   */
  private searchSongsLocal(query: string, songs: Song[]): SongResult[] {
    const results: SongResult[] = [];

    for (const song of songs) {
      const titleMatch = song.title.toLowerCase().includes(query);
      const artistMatch = song.artist.toLowerCase().includes(query);
      const albumMatch = song.album?.toLowerCase().includes(query);

      if (titleMatch || artistMatch || albumMatch) {
        let matchType: 'title' | 'artist' | 'album' = 'title';

        if (titleMatch) {
          matchType = 'title';
        } else if (artistMatch) {
          matchType = 'artist';
        } else if (albumMatch) {
          matchType = 'album';
        }

        results.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          matchType,
        });
      }
    }

    // Rank results: exact matches first, then starts-with, then contains
    return this.rankSongResults(results, query);
  }

  /**
   * Search artists locally
   */
  private searchArtistsLocal(query: string, songs: Song[]): ArtistResult[] {
    const artistMap = new Map<string, { songCount: number; albums: Set<string> }>();

    // Group songs by artist
    for (const song of songs) {
      if (song.artist.toLowerCase().includes(query)) {
        const existing = artistMap.get(song.artist);
        if (existing) {
          existing.songCount++;
          if (song.album) {
            existing.albums.add(song.album);
          }
        } else {
          const albums = new Set<string>();
          if (song.album) {
            albums.add(song.album);
          }
          artistMap.set(song.artist, { songCount: 1, albums });
        }
      }
    }

    // Convert to array
    const results: ArtistResult[] = Array.from(artistMap.entries()).map(([name, data]) => ({
      name,
      songCount: data.songCount,
      albums: Array.from(data.albums),
    }));

    // Sort by song count (descending)
    return results.sort((a, b) => b.songCount - a.songCount);
  }

  /**
   * Search albums locally
   */
  private searchAlbumsLocal(query: string, songs: Song[]): AlbumResult[] {
    const albumMap = new Map<string, { artist: string; songCount: number; year?: number }>();

    // Group songs by album
    for (const song of songs) {
      if (song.album && song.album.toLowerCase().includes(query)) {
        const key = `${song.album}|${song.artist}`;
        const existing = albumMap.get(key);
        if (existing) {
          existing.songCount++;
        } else {
          albumMap.set(key, {
            artist: song.artist,
            songCount: 1,
          });
        }
      }
    }

    // Convert to array
    const results: AlbumResult[] = Array.from(albumMap.entries()).map(([key, data]) => {
      const [album] = key.split('|');
      return {
        name: album,
        artist: data.artist,
        songCount: data.songCount,
        year: data.year,
      };
    });

    // Sort by song count (descending)
    return results.sort((a, b) => b.songCount - a.songCount);
  }

  /**
   * Search playlists locally
   */
  private searchPlaylistsLocal(query: string, playlists: Playlist[]): PlaylistResult[] {
    const results: PlaylistResult[] = [];

    for (const playlist of playlists) {
      if (playlist.name.toLowerCase().includes(query)) {
        results.push({
          id: playlist.id,
          name: playlist.name,
          songCount: Array.isArray(playlist.songIds) ? playlist.songIds.length : 0,
          createdAt: playlist.createdAt,
        });
      }
    }

    // Sort by name
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Rank song results by relevance
   */
  private rankSongResults(results: SongResult[], query: string): SongResult[] {
    return results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      // Exact match
      if (aTitle === query && bTitle !== query) return -1;
      if (bTitle === query && aTitle !== query) return 1;

      // Starts with
      if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
      if (bTitle.startsWith(query) && !aTitle.startsWith(query)) return 1;

      // Alphabetical
      return aTitle.localeCompare(bTitle);
    });
  }

  /**
   * Check if there are more results
   */
  private hasMoreResultsLocal(results: SearchResults, limit: number): boolean {
    const { totalCounts, filter } = results;

    if (filter === 'all') {
      return (
        totalCounts.songs > limit ||
        totalCounts.artists > limit ||
        totalCounts.albums > limit ||
        totalCounts.playlists > limit
      );
    }

    return totalCounts[filter] > limit;
  }

  /**
   * Get cached results
   */
  getCachedResults(key: string): SearchResults | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.results;
  }

  /**
   * Set cached results
   */
  setCachedResults(key: string, results: SearchResults): void {
    this.cache.set(key, {
      results,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const searchService = new SearchService();
