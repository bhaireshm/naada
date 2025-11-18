import express from 'express';
import { Song } from '../models/Song';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/artists
 * Get all artists with song and album counts
 */
router.get('/', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Aggregate artists with their song counts
    const artists = await Song.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: '$artist',
          songCount: { $sum: 1 },
          albums: { $addToSet: '$album' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          songCount: 1,
          albumCount: {
            $size: {
              $filter: {
                input: '$albums',
                as: 'album',
                cond: { $ne: ['$$album', null] },
              },
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({ artists });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

/**
 * GET /api/artists/:artistName
 * Get all songs by a specific artist
 */
router.get('/:artistName', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const { artistName } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decode the artist name from URL
    const decodedArtistName = decodeURIComponent(artistName);

    // Find all songs by this artist
    const songs = await Song.find({
      uploadedBy: userId,
      artist: decodedArtistName,
    }).sort({ album: 1, title: 1 });

    res.json({
      artist: decodedArtistName,
      songs,
    });
  } catch (error) {
    console.error('Error fetching artist songs:', error);
    res.status(500).json({ error: 'Failed to fetch artist songs' });
  }
});

export default router;
