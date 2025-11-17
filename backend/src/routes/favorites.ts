import { Router, type Router as RouterType } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavoriteStatus,
  getFavoriteCount,
} from '../controllers/favoritesController';

const router: RouterType = Router();

// GET /favorites - Get all favorites for authenticated user
router.get('/', verifyToken, getFavorites);

// POST /favorites/:songId - Add song to favorites
router.post('/:songId', verifyToken, addFavorite);

// DELETE /favorites/:songId - Remove song from favorites
router.delete('/:songId', verifyToken, removeFavorite);

// GET /favorites/:songId/status - Check if song is favorited
router.get('/:songId/status', verifyToken, checkFavoriteStatus);

// GET /songs/:songId/favorites/count - Get favorite count for a song
// Note: This will be mounted under /songs route in the main app
export { getFavoriteCount };

export default router;
