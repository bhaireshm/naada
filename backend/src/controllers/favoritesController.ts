import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Favorite } from '../models/Favorite';
import { Song } from '../models/Song';
import { Types } from 'mongoose';

/**
 * POST /favorites/:songId
 * Add a song to user's favorites
 */
export async function addFavorite(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { songId } = req.params;

    // Validate songId
    if (!Types.ObjectId.isValid(songId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_SONG_ID',
          message: 'Invalid song ID format',
        },
      });
      return;
    }

    // Verify song exists
    const song = await Song.findById(songId);
    if (!song) {
      res.status(404).json({
        error: {
          code: 'SONG_NOT_FOUND',
          message: 'Song not found',
        },
      });
      return;
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId,
      songId: new Types.ObjectId(songId),
    });

    if (existingFavorite) {
      res.status(409).json({
        error: {
          code: 'ALREADY_FAVORITED',
          message: 'Song is already in favorites',
        },
      });
      return;
    }

    // Create favorite
    const favorite = new Favorite({
      userId,
      songId: new Types.ObjectId(songId),
    });

    await favorite.save();

    res.status(201).json({
      favorite: {
        id: (favorite._id as Types.ObjectId).toString(),
        userId: favorite.userId,
        songId: favorite.songId.toString(),
        createdAt: favorite.createdAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to add favorite',
        details: errorMessage,
      },
    });
  }
}

/**
 * DELETE /favorites/:songId
 * Remove a song from user's favorites
 */
export async function removeFavorite(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { songId } = req.params;

    // Validate songId
    if (!Types.ObjectId.isValid(songId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_SONG_ID',
          message: 'Invalid song ID format',
        },
      });
      return;
    }

    // Find and delete favorite
    const result = await Favorite.findOneAndDelete({
      userId,
      songId: new Types.ObjectId(songId),
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'FAVORITE_NOT_FOUND',
          message: 'Favorite not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Favorite removed successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to remove favorite',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /favorites
 * Get all favorites for the authenticated user
 */
export async function getFavorites(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    // Query favorites with populated song data
    const favorites = await Favorite.find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('songId', 'title artist album mimeType createdAt')
      .exec();

    // Get total count
    const total = await Favorite.countDocuments({ userId });

    // Transform favorites to match frontend interface
    const transformedFavorites = favorites.map((favorite) => {
      const song = favorite.songId as any;
      return {
        id: (favorite._id as Types.ObjectId).toString(),
        song: {
          id: song._id.toString(),
          title: song.title,
          artist: song.artist,
          album: song.album,
          mimeType: song.mimeType,
          createdAt: song.createdAt,
        },
        createdAt: favorite.createdAt,
      };
    });

    res.status(200).json({
      favorites: transformedFavorites,
      total,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch favorites',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /favorites/:songId/status
 * Check if a song is favorited by the user
 */
export async function checkFavoriteStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { songId } = req.params;

    // Validate songId
    if (!Types.ObjectId.isValid(songId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_SONG_ID',
          message: 'Invalid song ID format',
        },
      });
      return;
    }

    // Check if favorite exists
    const favorite = await Favorite.findOne({
      userId,
      songId: new Types.ObjectId(songId),
    });

    res.status(200).json({
      isFavorite: !!favorite,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to check favorite status',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /songs/:songId/favorites/count
 * Get the total number of favorites for a song
 */
export async function getFavoriteCount(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { songId } = req.params;

    // Validate songId
    if (!Types.ObjectId.isValid(songId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_SONG_ID',
          message: 'Invalid song ID format',
        },
      });
      return;
    }

    // Count favorites for this song
    const count = await Favorite.countDocuments({
      songId: new Types.ObjectId(songId),
    });

    res.status(200).json({
      count,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to get favorite count',
        details: errorMessage,
      },
    });
  }
}
