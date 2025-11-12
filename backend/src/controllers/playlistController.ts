import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Playlist } from '../models/Playlist';
import { Song } from '../models/Song';
import { Types } from 'mongoose';

/**
 * GET /playlists
 * Fetch all playlists for the authenticated user
 */
export async function getPlaylists(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;

    // Query playlists by userId and populate song metadata
    const playlists = await Playlist.find({ userId })
      .populate('songIds', 'title artist mimeType createdAt')
      .exec();

    // Transform playlists to match frontend interface
    const transformedPlaylists = playlists.map((playlist) => ({
      id: (playlist._id as Types.ObjectId).toString(),
      name: playlist.name,
      userId: playlist.userId,
      songIds: playlist.songIds.map((song: any) => 
        song._id ? {
          id: song._id.toString(),
          title: song.title,
          artist: song.artist,
          mimeType: song.mimeType,
          createdAt: song.createdAt,
        } : song
      ),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    }));

    res.status(200).json(transformedPlaylists);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch playlists',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /playlists/:id
 * Fetch a single playlist with populated songs
 */
export async function getPlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const playlistId = req.params.id;

    // Validate playlist ID
    if (!Types.ObjectId.isValid(playlistId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Invalid playlist ID format',
        },
      });
      return;
    }

    // Find playlist and populate song metadata
    const playlist = await Playlist.findOne({
      _id: playlistId,
      userId,
    })
      .populate('songIds', 'title artist mimeType createdAt')
      .exec();

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Playlist not found or access denied',
        },
      });
      return;
    }

    // Transform playlist to match frontend interface
    const transformedPlaylist = {
      id: (playlist._id as Types.ObjectId).toString(),
      name: playlist.name,
      userId: playlist.userId,
      songIds: playlist.songIds.map((song: any) => ({
        id: song._id.toString(),
        title: song.title,
        artist: song.artist,
        mimeType: song.mimeType,
        createdAt: song.createdAt,
      })),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };

    res.status(200).json(transformedPlaylist);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * POST /playlists
 * Create a new playlist for the authenticated user
 */
export async function createPlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { name } = req.body;

    // Validate playlist name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'Playlist name is required',
        },
      });
      return;
    }

    // Create new playlist
    const playlist = new Playlist({
      name: name.trim(),
      userId,
      songIds: [],
    });

    await playlist.save();

    // Transform playlist to match frontend interface
    const transformedPlaylist = {
      id: (playlist._id as Types.ObjectId).toString(),
      name: playlist.name,
      userId: playlist.userId,
      songIds: [],
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };

    res.status(201).json({ playlist: transformedPlaylist });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * PUT /playlists/:id
 * Update playlist songs
 */
export async function updatePlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const playlistId = req.params.id;
    const { songIds } = req.body;

    // Validate playlist ID
    if (!Types.ObjectId.isValid(playlistId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Invalid playlist ID format',
        },
      });
      return;
    }

    // Validate songIds array
    if (!Array.isArray(songIds)) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'songIds must be an array',
        },
      });
      return;
    }

    // Verify all songIds are valid ObjectIds
    const validSongIds = songIds.every((id) => Types.ObjectId.isValid(id));
    if (!validSongIds) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'All songIds must be valid ObjectIds',
        },
      });
      return;
    }

    // Verify all songs exist in database
    const existingSongs = await Song.find({
      _id: { $in: songIds },
    }).select('_id');

    if (existingSongs.length !== songIds.length) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'One or more song IDs do not exist',
        },
      });
      return;
    }

    // Find and update playlist
    const playlist = await Playlist.findOne({
      _id: playlistId,
      userId,
    });

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Playlist not found or access denied',
        },
      });
      return;
    }

    // Update playlist
    playlist.songIds = songIds.map((id) => new Types.ObjectId(id));
    playlist.updatedAt = new Date();
    await playlist.save();

    // Populate and return updated playlist
    await playlist.populate('songIds', 'title artist mimeType createdAt');

    // Transform playlist to match frontend interface
    const transformedPlaylist = {
      id: (playlist._id as Types.ObjectId).toString(),
      name: playlist.name,
      userId: playlist.userId,
      songIds: playlist.songIds.map((song: any) => ({
        id: song._id.toString(),
        title: song.title,
        artist: song.artist,
        mimeType: song.mimeType,
        createdAt: song.createdAt,
      })),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };

    res.status(200).json({ playlist: transformedPlaylist });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * DELETE /playlists/:id
 * Delete a playlist
 */
export async function deletePlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const playlistId = req.params.id;

    // Validate playlist ID
    if (!Types.ObjectId.isValid(playlistId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Invalid playlist ID format',
        },
      });
      return;
    }

    // Find and delete playlist (only if it belongs to the user)
    const result = await Playlist.findOneAndDelete({
      _id: playlistId,
      userId,
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Playlist not found or access denied',
        },
      });
      return;
    }

    res.status(200).json({
      message: 'Playlist deleted successfully',
      playlistId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete playlist',
        details: errorMessage,
      },
    });
  }
}
