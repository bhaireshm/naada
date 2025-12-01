import { Router, type Router as RouterType } from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth';
import { uploadSong, streamSong, getAllSongs, getSongMetadata, updateSong, deleteSong } from '../controllers/songController';

const router: RouterType = Router();

// Configure multer for memory storage (file buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only audio files
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'audio/m4a',
      'audio/x-m4a',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// GET /songs - Get all songs
router.get('/', verifyToken, getAllSongs);

// POST /songs/upload - Upload a new song
router.post('/upload', verifyToken, upload.single('file'), uploadSong);

// GET /songs/:id/metadata - Get song metadata by ID
router.get('/:id/metadata', verifyToken, getSongMetadata);

// GET /songs/:id - Stream a song by ID
router.get('/:id', verifyToken, streamSong);

// PUT /songs/:id - Update song metadata
router.put('/:id', verifyToken, updateSong);

// DELETE /songs/:id - Delete a song (only uploader can delete)
router.delete('/:id', verifyToken, deleteSong);

export default router;
