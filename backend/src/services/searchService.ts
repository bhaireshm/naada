import { Song } from '../models/Song';
import { Playlist } from '../models/Playlist';

export type SearchFilter = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

export interface SongResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  matchType: 'title' | 'artist' | 'album';
}

export interface ArtistResult {
  name: string;
  songCount: number;
  albums: string[];
}

export interface AlbumResult {
  name: string;
  artist: string;
  songCount: number;
  year?: number;
}

export interface PlaylistResult {
  id: string;
  name: string;
  songCount: number;
  createdAt: string;
}

export interface SearchResults {
  query: string;
  filter: SearchFilter;
  results: {
    songs: SongResult[];
    artists: ArtistResult[];
    albums: AlbumResult[];
    playlists: PlaylistResult[];
  };
  totalCounts: {
    songs: number;
    artists: number;
    albums: number;
    playlists: number;
  };
  hasMore: boolean;
}

class SearchService {
  /**
   * Main search method that coordinates all search operations
   */
  async search(
    query: string,
    userId: string,
    filter: SearchFilter,
    limit: number,
    offset: number
  ): Promise<SearchResults> {
    const normalizedQuery = query.toLowerCase().trim();

    // Build search results
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

    // Search based on filter
    if (filter === 'all' || filter === 'songs') {
      const songResults = await this.searchSongs(normalizedQuery, limit, offset);
      results.results.songs = songResults.items;
      results.totalCounts.songs = songResults.total;
    }

    if (filter === 'all' || filter === 'artists') {
      const artistResults = await this.searchArtists(normalizedQuery, limit);
      results.results.artists = artistResults.items;
      results.totalCounts.artists = artistResults.total;
    }

    if (filter === 'all' || filter === 'albums') {
      const albumResults = await this.searchAlbums(normalizedQuery, limit);
      results.results.albums = albumResults.items;
      results.totalCounts.albums = albumResults.total;
    }

    if (filter === 'all' || filter === 'playlists') {
      const playlistResults = await this.searchPlaylists(
        normalizedQuery,
        userId,
        limit,
        offset
      );
      results.results.playlists = playlistResults.items;
      results.totalCounts.playlists = playlistResults.total;
    }

    // Determine if there are more results
    results.hasMore = this.hasMoreResults(results, limit, offset);

    return results;
  }

  /**
   * Search songs by title, artist, or album
   */
  async searchSongs(
    query: string,
    limit: number,
    offset: number
  ): Promise<{ items: SongResult[]; total: number }> {
    // Use MongoDB regex search for case-insensitive matching
    const regex = new RegExp(query, 'i');

    const songs = await Song.find({
      $or: [
        { title: regex },
        { artist: regex },
        { album: regex },
      ],
    })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await Song.countDocuments({
      $or: [
        { title: regex },
        { artist: regex },
        { album: regex },
      ],
    });

    // Determine match type for each song
    const items: SongResult[] = songs.map((song) => {
      let matchType: 'title' | 'artist' | 'album' = 'title';

      if (regex.test(song.title)) {
        matchType = 'title';
      } else if (regex.test(song.artist)) {
        matchType = 'artist';
      } else if (song.album && regex.test(song.album)) {
        matchType = 'album';
      }

      return {
        id: song._id.toString(),
        title: song.title,
        artist: song.artist,
        album: song.album,
        matchType,
      };
    });

    return { items, total };
  }

  /**
   * Search artists by name using aggregation
   */
  async searchArtists(
    query: string,
    limit: number
  ): Promise<{ items: ArtistResult[]; total: number }> {
    const regex = new RegExp(query, 'i');

    // Aggregate unique artists with song counts
    const artists = await Song.aggregate([
      {
        $match: { artist: regex },
      },
      {
        $group: {
          _id: '$artist',
          songCount: { $sum: 1 },
          albums: { $addToSet: '$album' },
        },
      },
      {
        $limit: limit,
      },
    ]);

    const total = artists.length;

    const items: ArtistResult[] = artists.map((artist) => ({
      name: artist._id,
      songCount: artist.songCount,
      albums: artist.albums.filter((album: string | null | undefined) => album != null),
    }));

    return { items, total };
  }

  /**
   * Search albums by name using aggregation
   */
  async searchAlbums(
    query: string,
    limit: number
  ): Promise<{ items: AlbumResult[]; total: number }> {
    const regex = new RegExp(query, 'i');

    // Aggregate unique albums with song counts
    const albums = await Song.aggregate([
      {
        $match: { album: { $regex: regex, $ne: null } },
      },
      {
        $group: {
          _id: { album: '$album', artist: '$artist' },
          songCount: { $sum: 1 },
          year: { $first: '$year' },
        },
      },
      {
        $limit: limit,
      },
    ]);

    const total = albums.length;

    const items: AlbumResult[] = albums.map((album) => ({
      name: album._id.album,
      artist: album._id.artist,
      songCount: album.songCount,
      year: album.year,
    }));

    return { items, total };
  }

  /**
   * Search playlists by name for a specific user
   */
  async searchPlaylists(
    query: string,
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ items: PlaylistResult[]; total: number }> {
    const regex = new RegExp(query, 'i');

    const playlists = await Playlist.find({
      userId,
      name: regex,
    })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await Playlist.countDocuments({
      userId,
      name: regex,
    });

    const items: PlaylistResult[] = playlists.map((playlist) => ({
      id: playlist._id.toString(),
      name: playlist.name,
      songCount: playlist.songIds.length,
      createdAt: playlist.createdAt.toISOString(),
    }));

    return { items, total };
  }

  /**
   * Determine if there are more results beyond the current page
   */
  private hasMoreResults(
    results: SearchResults,
    limit: number,
    offset: number
  ): boolean {
    const { totalCounts, filter } = results;

    if (filter === 'all') {
      // For 'all' filter, check if any category has more results
      return (
        totalCounts.songs > limit ||
        totalCounts.artists > limit ||
        totalCounts.albums > limit ||
        totalCounts.playlists > limit
      );
    }

    // For specific filters, check if there are more results beyond current page
    const totalForFilter = totalCounts[filter];
    return totalForFilter > offset + limit;
  }
}

export const searchService = new SearchService();
