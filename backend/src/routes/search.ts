import { Router, type Router as RouterType } from 'express';
import { verifyToken } from '../middleware/auth';
import { search } from '../controllers/searchController';

const router: RouterType = Router();

// GET /search?q=query&filter=songs&limit=20&offset=0
router.get('/', verifyToken, search);

export default router;
