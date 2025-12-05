import { Router, type Router as RouterType } from 'express';
import multer from 'multer';
import { getAIMetadataStatus, processAIMetadata } from '../controllers/aiMetadataController';
import { regenerateFingerprints } from '../controllers/fingerprintRegenerationController';
import { aiEnhancedMetadataCleanup, batchMetadataCleanup, enrichSongMetadata } from '../controllers/metadataEnrichmentController';
import { deleteAllSongs, deleteSong, getAllSongs, getSongMetadata, streamSong, updateSong, uploadSong } from '../controllers/songController';
import { verifyToken } from '../middleware/auth';

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

// GET /songs/ai-metadata-status - Get AI metadata processing status
router.get('/ai-metadata-status', verifyToken, getAIMetadataStatus);

// POST /songs/process-ai-metadata - Process existing songs to extract AI metadata
router.post('/process-ai-metadata', verifyToken, processAIMetadata);

// POST /songs/batch-cleanup - Batch metadata cleanup for multiple songs (MUST be before /:id routes)
router.post('/batch-cleanup', verifyToken, batchMetadataCleanup);

// POST /songs/regenerate-fingerprints - Regenerate acoustic fingerprints for hash-based songs
router.post('/regenerate-fingerprints', verifyToken, regenerateFingerprints);

// DELETE /songs/cleanup - Delete all songs for the current user (DANGEROUS - use with caution)
router.delete('/cleanup', verifyToken, deleteAllSongs);

// POST /songs/:id/enrich - Enrich song metadata from online sources
router.post('/:id/enrich', verifyToken, enrichSongMetadata);

// POST /songs/:id/cleanup - AI-enhanced metadata cleanup (fix swapped fields, clean junk)
router.post('/:id/cleanup', verifyToken, aiEnhancedMetadataCleanup);

// GET /songs/:id/metadata - Get song metadata by ID
router.get('/:id/metadata', verifyToken, getSongMetadata);

// GET /songs/:id - Stream a song by ID
router.get('/:id', verifyToken, streamSong);

// PUT /songs/:id - Update song metadata
router.put('/:id', verifyToken, updateSong);

// DELETE /songs/:id - Delete a song (only uploader can delete)
router.delete('/:id', verifyToken, deleteSong);

export default router;
