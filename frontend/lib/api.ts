import { getIdToken } from './firebase';

// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Error response structure from backend
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Song object structure
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  mimeType: string;
  createdAt: string;
  albumArt?: string;
  album?: string;
  duration?: number;
  uploadedBy?: string;
}

/**
 * Playlist object structure
 */
export interface Playlist {
  id: string;
  name: string;
  userId: string;
  ownerId: string;
  visibility: 'private' | 'shared' | 'public';
  collaborators: string[];
  followers: string[];
  followerCount: number;
  permission?: string;
  songIds: string[] | Song[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Make an authenticated API request
 */
async function makeAuthenticatedRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get the current user's ID token
  const token = await getIdToken();

  if (!token) {
    throw new ApiError('AUTH_TOKEN_MISSING', 'User is not authenticated');
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  // Make the request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Parse API response and handle errors
 */
async function parseResponse<T>(response: Response): Promise<T> {
  // Check if response is ok
  if (!response.ok) {
    // Try to parse error response
    try {
      const errorData: ErrorResponse = await response.json();
      
      // Log error details for debugging
      console.error('API Error:', {
        endpoint: response.url,
        status: response.status,
        code: errorData.error.code,
        message: errorData.error.message,
        details: errorData.error.details,
        timestamp: new Date().toISOString(),
      });
      
      throw new ApiError(
        errorData.error.code,
        errorData.error.message,
        errorData.error.details
      );
    } catch (error) {
      // If parsing fails, throw generic error
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Log parsing error
      console.error('API Error (failed to parse):', {
        endpoint: response.url,
        status: response.status,
        timestamp: new Date().toISOString(),
        error,
      });
      
      throw new ApiError(
        'UNKNOWN_ERROR',
        `Request failed with status ${response.status}`
      );
    }
  }

  // Parse successful response
  return response.json();
}

/**
 * Upload a song to the backend
 */
export async function uploadSong(
  file: File,
  title: string,
  artist: string,
  onProgress?: (progress: number) => void
): Promise<Song> {
  const token = await getIdToken();

  if (!token) {
    throw new ApiError('AUTH_TOKEN_MISSING', 'User is not authenticated');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('artist', artist);

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.song);
        } catch {
          reject(new ApiError('PARSE_ERROR', 'Failed to parse response'));
        }
      } else {
        try {
          const errorData: ErrorResponse = JSON.parse(xhr.responseText);
          reject(
            new ApiError(
              errorData.error.code,
              errorData.error.message,
              errorData.error.details
            )
          );
        } catch {
          reject(
            new ApiError(
              'UNKNOWN_ERROR',
              `Request failed with status ${xhr.status}`
            )
          );
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new ApiError('NETWORK_ERROR', 'Network request failed'));
    });

    // Open and send request
    xhr.open('POST', `${API_BASE_URL}/songs/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Get the streaming URL for a song
 */
export function getSongStreamUrl(songId: string): string {
  return `${API_BASE_URL}/songs/${songId}`;
}

/**
 * Get all songs (library)
 */
export async function getSongs(): Promise<Song[]> {
  const response = await makeAuthenticatedRequest('/songs');
  const data = await parseResponse<{ songs: Song[] }>(response);
  return data.songs;
}

/**
 * Get a single song by ID
 */
export async function getSong(songId: string): Promise<Song> {
  const response = await makeAuthenticatedRequest(`/songs/${songId}/metadata`);
  const data = await parseResponse<{ song: Song }>(response);
  return data.song;
}

/**
 * Get all playlists for the current user
 */
export async function getPlaylists(): Promise<Playlist[]> {
  const response = await makeAuthenticatedRequest('/playlists');
  const data = await parseResponse<Playlist[]>(response);
  return data;
}

/**
 * Get a single playlist by ID with populated songs
 */
export async function getPlaylist(playlistId: string): Promise<Playlist> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}`);
  return parseResponse<Playlist>(response);
}

/**
 * Create a new playlist
 */
export async function createPlaylist(name: string): Promise<Playlist> {
  const response = await makeAuthenticatedRequest('/playlists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const data = await parseResponse<{ playlist: Playlist }>(response);
  return data.playlist;
}

/**
 * Update a playlist's songs
 */
export async function updatePlaylist(
  playlistId: string,
  songIds: string[]
): Promise<Playlist> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songIds }),
  });
  const data = await parseResponse<{ playlist: Playlist }>(response);
  return data.playlist;
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}`, {
    method: 'DELETE',
  });
  await parseResponse<{ success: boolean }>(response);
}

/**
 * Add a song to a playlist
 */
export async function addSongToPlaylist(
  playlistId: string,
  songId: string
): Promise<Playlist> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songId }),
  });
  const data = await parseResponse<{ playlist: Playlist }>(response);
  return data.playlist;
}

/**
 * Remove a song from a playlist
 */
export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): Promise<void> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
  });
  await parseResponse<{ success: boolean }>(response);
}

/**
 * Search across songs, artists, albums, and playlists
 */
export async function search(
  query: string,
  filter: 'all' | 'songs' | 'artists' | 'albums' | 'playlists' = 'all',
  limit: number = 5,
  offset: number = 0
): Promise<any> {
  const params = new URLSearchParams({
    q: query,
    filter,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await makeAuthenticatedRequest(`/search?${params.toString()}`);
  return parseResponse(response);
}

/**
 * Add a song to favorites
 */
export async function addFavorite(songId: string): Promise<any> {
  const response = await makeAuthenticatedRequest(`/favorites/${songId}`, {
    method: 'POST',
  });
  return parseResponse(response);
}

/**
 * Remove a song from favorites
 */
export async function removeFavorite(songId: string): Promise<void> {
  const response = await makeAuthenticatedRequest(`/favorites/${songId}`, {
    method: 'DELETE',
  });
  await parseResponse(response);
}

/**
 * Get all favorites for the current user
 */
export async function getFavorites(limit: number = 100, offset: number = 0): Promise<unknown> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  const response = await makeAuthenticatedRequest(`/favorites?${params.toString()}`);
  return parseResponse(response);
}

/**
 * Check if a song is favorited
 */
export async function checkFavoriteStatus(songId: string): Promise<{ isFavorite: boolean }> {
  const response = await makeAuthenticatedRequest(`/favorites/${songId}/status`);
  return parseResponse(response);
}

/**
 * Get favorite count for a song
 */
export async function getFavoriteCount(songId: string): Promise<{ count: number }> {
  const response = await makeAuthenticatedRequest(`/songs/${songId}/favorites/count`);
  return parseResponse(response);
}

/**
 * Update playlist visibility
 */
export async function updatePlaylistVisibility(
  playlistId: string,
  visibility: 'private' | 'shared' | 'public'
): Promise<Playlist> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}/visibility`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ visibility }),
  });
  const data = await parseResponse<{ playlist: Playlist }>(response);
  return data.playlist;
}

/**
 * Add a collaborator to a playlist
 */
export async function addCollaborator(
  playlistId: string,
  collaboratorId: string
): Promise<Playlist> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}/collaborators`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collaboratorId }),
  });
  const data = await parseResponse<{ playlist: Playlist }>(response);
  return data.playlist;
}

/**
 * Remove a collaborator from a playlist
 */
export async function removeCollaborator(
  playlistId: string,
  collaboratorId: string
): Promise<void> {
  const response = await makeAuthenticatedRequest(
    `/playlists/${playlistId}/collaborators/${collaboratorId}`,
    {
      method: 'DELETE',
    }
  );
  await parseResponse<{ success: boolean }>(response);
}

/**
 * Follow a public playlist
 */
export async function followPlaylist(playlistId: string): Promise<void> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}/follow`, {
    method: 'POST',
  });
  await parseResponse<{ success: boolean }>(response);
}

/**
 * Unfollow a playlist
 */
export async function unfollowPlaylist(playlistId: string): Promise<void> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}/follow`, {
    method: 'DELETE',
  });
  await parseResponse<{ success: boolean }>(response);
}

/**
 * Get all public playlists with pagination and search
 */
export async function getPublicPlaylists(
  limit: number = 20,
  offset: number = 0,
  search: string = ''
): Promise<{ playlists: Playlist[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  if (search) {
    params.append('search', search);
  }

  const response = await makeAuthenticatedRequest(`/playlists/public?${params.toString()}`);
  return parseResponse(response);
}

/**
 * Get recommended public playlists (discover)
 */
export async function getDiscoverPlaylists(limit: number = 20): Promise<{ playlists: Playlist[] }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  const response = await makeAuthenticatedRequest(`/playlists/discover?${params.toString()}`);
  return parseResponse(response);
}

/**
 * Generate a shareable link for a playlist
 */
export async function getShareLink(playlistId: string): Promise<string> {
  const response = await makeAuthenticatedRequest(`/playlists/${playlistId}/share-link`);
  const data = await parseResponse<{ shareLink: string }>(response);
  return data.shareLink;
}

/**
 * User profile and settings interfaces
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  googleId?: string;
  googleEmail?: string;
  authProviders?: ('email' | 'google')[];
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await makeAuthenticatedRequest('/users/me');
  const data = await parseResponse<{ user: UserProfile }>(response);
  return data.user;
}

/**
 * Update current user profile
 */
export async function updateUserProfile(
  displayName?: string,
  bio?: string,
  avatarUrl?: string
): Promise<UserProfile> {
  const response = await makeAuthenticatedRequest('/users/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ displayName, bio, avatarUrl }),
  });
  const data = await parseResponse<{ user: UserProfile }>(response);
  return data.user;
}

/**
 * Get public user info by ID
 */
export async function getUserById(userId: string): Promise<Partial<UserProfile>> {
  const response = await makeAuthenticatedRequest(`/users/${userId}`);
  const data = await parseResponse<{ user: Partial<UserProfile> }>(response);
  return data.user;
}

/**
 * Search users by email or display name
 */
export async function searchUsers(query: string): Promise<Partial<UserProfile>[]> {
  const params = new URLSearchParams({ q: query });
  const response = await makeAuthenticatedRequest(`/users/search?${params.toString()}`);
  const data = await parseResponse<{ users: Partial<UserProfile>[] }>(response);
  return data.users;
}

/**
 * Get current user settings
 */
export async function getUserSettings(): Promise<UserSettings> {
  const response = await makeAuthenticatedRequest('/users/me/settings');
  const data = await parseResponse<{ settings: UserSettings }>(response);
  return data.settings;
}

/**
 * Update current user settings
 */
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const response = await makeAuthenticatedRequest('/users/me/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  const data = await parseResponse<{ settings: UserSettings }>(response);
  return data.settings;
}

/**
 * Link Google account to current user profile
 */
export async function linkGoogleAccount(googleIdToken: string): Promise<UserProfile> {
  const response = await makeAuthenticatedRequest('/users/me/link-google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ googleIdToken }),
  });
  const data = await parseResponse<{ user: UserProfile }>(response);
  return data.user;
}

/**
 * Unlink Google account from current user profile
 */
export async function unlinkGoogleAccount(): Promise<UserProfile> {
  const response = await makeAuthenticatedRequest('/users/me/link-google', {
    method: 'DELETE',
  });
  const data = await parseResponse<{ user: UserProfile }>(response);
  return data.user;
}

/**
 * Artist object structure
 */
export interface Artist {
  name: string;
  songCount: number;
  albumCount: number;
}

/**
 * Album object structure
 */
export interface Album {
  artist: string;
  album: string;
  songCount: number;
  year?: number;
}

/**
 * Get all artists
 */
export async function getArtists(): Promise<Artist[]> {
  const response = await makeAuthenticatedRequest('/artists');
  const data = await parseResponse<{ artists: Artist[] }>(response);
  return data.artists;
}

/**
 * Get all songs by a specific artist
 */
export async function getArtistSongs(artistName: string): Promise<{ artist: string; songs: Song[] }> {
  const encodedArtist = encodeURIComponent(artistName);
  const response = await makeAuthenticatedRequest(`/artists/${encodedArtist}`);
  return parseResponse(response);
}

/**
 * Get all albums
 */
export async function getAlbums(): Promise<Album[]> {
  const response = await makeAuthenticatedRequest('/albums');
  const data = await parseResponse<{ albums: Album[] }>(response);
  return data.albums;
}

/**
 * Get all songs from a specific album
 */
export async function getAlbumSongs(
  artistName: string,
  albumName: string
): Promise<{ artist: string; album: string; songs: Song[] }> {
  const encodedArtist = encodeURIComponent(artistName);
  const encodedAlbum = encodeURIComponent(albumName);
  const response = await makeAuthenticatedRequest(`/albums/${encodedArtist}/${encodedAlbum}`);
  return parseResponse(response);
}
