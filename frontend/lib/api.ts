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
}

/**
 * Playlist object structure
 */
export interface Playlist {
  id: string;
  name: string;
  userId: string;
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
  // First, get the current playlist
  const playlist = await getPlaylist(playlistId);
  
  // Extract song IDs (handle both populated and unpopulated songIds)
  const currentSongIds = playlist.songIds.map((song) => 
    typeof song === 'string' ? song : song.id
  );
  
  // Add the new song if it's not already in the playlist
  if (!currentSongIds.includes(songId)) {
    currentSongIds.push(songId);
  }
  
  // Update the playlist with the new song list
  return updatePlaylist(playlistId, currentSongIds);
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
export async function getFavorites(limit: number = 100, offset: number = 0): Promise<any> {
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
