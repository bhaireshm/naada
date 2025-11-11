import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateFingerprint, checkDuplicate } from '../services/fingerprintService';
import { uploadFile, getFile } from '../services/storageService';
import { Song } from '../models/Song';
import { randomUUID } from 'crypto';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, bucketName } from '../config/storage';

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

/**
 * Stream a song by ID
 * GET /songs/:id
 */
export async function streamSong(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    // Fetch song metadata from database
    const song = await Song.findById(id);
    
    if (!song) {
      res.status(404).json({
        error: {
          code: 'SONG_NOT_FOUND',
          message: 'Song not found',
        },
      });
      return;
    }

    // Get the Range header if present
    const range = req.headers.range;

    // First, get the file metadata to determine content length
    const headCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: song.fileKey,
    });

    const headResponse = await r2Client.send(headCommand);
    const fileSize = headResponse.ContentLength || 0;

    // Set common headers
    res.setHeader('Content-Type', song.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      // Parse range header (format: "bytes=start-end")
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Validate range
      if (start >= fileSize || end >= fileSize) {
        res.status(416).json({
          error: {
            code: 'INVALID_RANGE',
            message: 'Requested range not satisfiable',
          },
        });
        return;
      }

      // Set headers for partial content
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);

      // Retrieve file with range from R2
      const rangeHeader = `bytes=${start}-${end}`;
      const stream = await getFile(song.fileKey, rangeHeader);

      // Pipe the stream to response
      stream.pipe(res);
    } else {
      // No range request - stream full file
      res.status(200);
      res.setHeader('Content-Length', fileSize);

      // Retrieve full file from R2
      const stream = await getFile(song.fileKey);

      // Pipe the stream to response
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Song streaming error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Only send JSON error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          code: 'STREAMING_FAILED',
          message: 'Failed to stream song',
          details: errorMessage,
        },
      });
    } else {
      // If headers were already sent, just end the response
      res.end();
    }
  }
}
