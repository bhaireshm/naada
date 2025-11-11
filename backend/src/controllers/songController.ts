import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateFingerprint, checkDuplicate } from '../services/fingerprintService';
import { uploadFile } from '../services/storageService';
import { Song } from '../models/Song';
import { randomUUID } from 'crypto';

/**
 * Handle song upload
 * POST /songs/upload
 */
export async function uploadSong(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        error: {
          code: 'MISSING_FILE',
          message: 'No audio file provided',
        },
      });
      return;
    }

    // Extract metadata from request body
    const { title, artist } = req.body;

    // Validate required metadata
    if (!title || !artist) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'Title and artist are required',
        },
      });
      return;
    }

    // Get file buffer and MIME type
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Generate audio fingerprint
    console.log('Generating fingerprint for uploaded audio...');
    const fingerprint = await generateFingerprint(fileBuffer);
    console.log('Fingerprint generated:', fingerprint);

    // Check for duplicate fingerprint
    const duplicate = await checkDuplicate(fingerprint);
    if (duplicate) {
      res.status(409).json({
        error: {
          code: 'DUPLICATE_SONG',
          message: 'This song already exists in the library',
          details: {
            existingSong: {
              id: duplicate._id,
              title: duplicate.title,
              artist: duplicate.artist,
            },
          },
        },
      });
      return;
    }

    // Generate unique file key for R2 storage
    const fileExtension = req.file.originalname.split('.').pop() || 'mp3';
    const fileKey = `songs/${randomUUID()}.${fileExtension}`;

    // Upload file to R2
    console.log('Uploading file to R2...');
    await uploadFile(fileBuffer, fileKey, mimeType);
    console.log('File uploaded successfully');

    // Save song metadata to database
    const song = new Song({
      title,
      artist,
      fileKey,
      mimeType,
      uploadedBy: req.userId,
      fingerprint,
    });

    await song.save();
    console.log('Song metadata saved to database');

    // Return created song object
    res.status(201).json({
      song: {
        id: song._id,
        title: song.title,
        artist: song.artist,
        mimeType: song.mimeType,
        createdAt: song.createdAt,
      },
    });
  } catch (error) {
    console.error('Song upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload song',
        details: errorMessage,
      },
    });
  }
}
