import express, { Router } from 'express';
import { Song } from '../models/Song';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * GET /api/albums
 * Get all albums with song counts
 */
router.get('/', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Aggregate albums with their song counts
    const albums = await Song.aggregate([
      {
        $match: {
          uploadedBy: userId,
          album: { $ne: null, $exists: true },
        },
      },
      {
        $group: {
          _id: { artist: '$artist', album: '$album' },
          songCount: { $sum: 1 },
          year: { $first: '$year' },
        },
      },
      {
        $project: {
          _id: 0,
          artist: '$_id.artist',
          album: '$_id.album',
          songCount: 1,
          year: 1,
        },
      },
      { $sort: { artist: 1, album: 1 } },
    ]);

    res.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

/**
 * GET /api/albums/:artistName/:albumName
 * Get all songs from a specific album
 */
router.get('/:artistName/:albumName', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { artistName, albumName } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Decode the names from URL
    const decodedArtistName = decodeURIComponent(artistName);
    const decodedAlbumName = decodeURIComponent(albumName);

    // Find all songs in this album
    const songs = await Song.find({
      uploadedBy: userId,
      artist: decodedArtistName,
      album: decodedAlbumName,
    }).sort({ title: 1 });

    if (songs.length === 0) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }

    res.json({
      artist: decodedArtistName,
      album: decodedAlbumName,
      songs,
    });
  } catch (error) {
    console.error('Error fetching album songs:', error);
    res.status(500).json({ error: 'Failed to fetch album songs' });
  }
});

export default router;
