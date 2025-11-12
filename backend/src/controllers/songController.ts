import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateFingerprint, checkDuplicate, FingerprintResult } from '../services/fingerprintService';
import { uploadFile, getFile, fileExists } from '../services/storageService';
import { Song } from '../models/Song';
import { randomUUID } from 'crypto';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, bucketName } from '../config/storage';
import { extractMetadata, AudioMetadata } from '../services/metadataService';

/**
 * Merge extracted metadata with user-provided metadata
 * User-provided values take priority over extracted values
 * @param extracted - Metadata extracted from audio file
 * @param userProvided - Metadata provided by user in request body
 * @param filename - Original filename for fallback title
 * @returns Merged metadata object
 */
function mergeMetadata(
  extracted: AudioMetadata,
  userProvided: { title?: string; artist?: string; album?: string; year?: number; genre?: string[] },
  filename: string
): { title: string; artist: string; album?: string; year?: number; genre?: string[] } {
  // User-provided values take priority, then extracted values, then fallbacks
  const title = userProvided.title || extracted.title || filename.replace(/\.[^/.]+$/, '') || 'Unknown Title';
  const artist = userProvided.artist || extracted.artist || 'Unknown Artist';
  const album = userProvided.album || extracted.album;
  const year = userProvided.year || extracted.year;
  const genre = userProvided.genre || extracted.genre;

  return {
    title,
    artist,
    ...(album && { album }),
    ...(year && { year }),
    ...(genre && { genre }),
  };
}

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

    // Get file buffer and MIME type
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const filename = req.file.originalname;

    // Extract metadata from audio file
    console.log('Extracting metadata from audio file...');
    const extractedMetadata = await extractMetadata(fileBuffer);

    // Extract user-provided metadata from request body
    const { title, artist, album, year, genre } = req.body;
    const userProvidedMetadata = {
      title,
      artist,
      album,
      year: year ? parseInt(year, 10) : undefined,
      genre: genre ? (Array.isArray(genre) ? genre : [genre]) : undefined,
    };

    // Merge extracted and user-provided metadata
    const mergedMetadata = mergeMetadata(extractedMetadata, userProvidedMetadata, filename);

    // Validate that title and artist are present after merging
    if (!mergedMetadata.title || !mergedMetadata.artist) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'Title and artist are required',
        },
      });
      return;
    }

    // Generate audio fingerprint
    console.log('Generating fingerprint for uploaded audio...');
    const fingerprintResult: FingerprintResult = await generateFingerprint(fileBuffer);
    console.log(`Fingerprint generated using ${fingerprintResult.method} method:`, fingerprintResult.fingerprint);

    // Check for duplicate fingerprint
    const duplicate = await checkDuplicate(fingerprintResult.fingerprint);
    if (duplicate) {
      // Check if the file still exists in R2
      const fileStillExists = await fileExists(duplicate.fileKey);
      
      if (!fileStillExists) {
        // File was deleted from R2 but DB entry remains - update the existing record
        console.log('Duplicate found but file missing in R2, updating existing record...');
        
        // Generate new file key
        const fileExtension = filename.split('.').pop() || 'mp3';
        const fileKey = `songs/${randomUUID()}.${fileExtension}`;
        
        // Prepare custom metadata for R2
        const r2Metadata: Record<string, string> = {
          title: mergedMetadata.title,
          artist: mergedMetadata.artist,
        };
        
        if (mergedMetadata.album) {
          r2Metadata.album = mergedMetadata.album;
        }
        if (mergedMetadata.year) {
          r2Metadata.year = mergedMetadata.year.toString();
        }
        if (mergedMetadata.genre && mergedMetadata.genre.length > 0) {
          r2Metadata.genre = mergedMetadata.genre.join(', ');
        }
        if (extractedMetadata.duration) {
          r2Metadata.duration = extractedMetadata.duration.toString();
        }
        
        // Upload file to R2
        console.log('Uploading file to R2...');
        await uploadFile(fileBuffer, fileKey, mimeType, r2Metadata);
        
        // Update existing song record
        duplicate.title = mergedMetadata.title;
        duplicate.artist = mergedMetadata.artist;
        duplicate.album = mergedMetadata.album;
        duplicate.year = mergedMetadata.year;
        duplicate.genre = mergedMetadata.genre;
        duplicate.fileKey = fileKey;
        duplicate.mimeType = mimeType;
        
        await duplicate.save();
        console.log('Existing song record updated with new file and metadata');
        
        res.status(200).json({
          song: {
            id: duplicate._id,
            title: duplicate.title,
            artist: duplicate.artist,
            album: duplicate.album,
            year: duplicate.year,
            genre: duplicate.genre,
            mimeType: duplicate.mimeType,
            createdAt: duplicate.createdAt,
          },
          metadata: {
            extracted: extractedMetadata,
            merged: mergedMetadata,
          },
          updated: true,
        });
        return;
      }
      
      // Check if metadata has changed
      const metadataChanged = 
        duplicate.title !== mergedMetadata.title ||
        duplicate.artist !== mergedMetadata.artist ||
        duplicate.album !== mergedMetadata.album ||
        duplicate.year !== mergedMetadata.year ||
        JSON.stringify(duplicate.genre) !== JSON.stringify(mergedMetadata.genre);
      
      if (metadataChanged) {
        // Update metadata only
        console.log('Duplicate found with different metadata, updating...');
        duplicate.title = mergedMetadata.title;
        duplicate.artist = mergedMetadata.artist;
        duplicate.album = mergedMetadata.album;
        duplicate.year = mergedMetadata.year;
        duplicate.genre = mergedMetadata.genre;
        
        await duplicate.save();
        console.log('Song metadata updated');
        
        res.status(200).json({
          song: {
            id: duplicate._id,
            title: duplicate.title,
            artist: duplicate.artist,
            album: duplicate.album,
            year: duplicate.year,
            genre: duplicate.genre,
            mimeType: duplicate.mimeType,
            createdAt: duplicate.createdAt,
          },
          metadata: {
            extracted: extractedMetadata,
            merged: mergedMetadata,
          },
          updated: true,
        });
        return;
      }
      
      // Exact duplicate - file exists and metadata is the same
      res.status(409).json({
        error: {
          code: 'DUPLICATE_SONG',
          message: 'This song already exists in the library with the same metadata',
          details: {
            existingSong: {
              id: duplicate._id,
              title: duplicate.title,
              artist: duplicate.artist,
              album: duplicate.album,
              year: duplicate.year,
              genre: duplicate.genre,
            },
          },
        },
      });
      return;
    }

    // Generate unique file key for R2 storage
    const fileExtension = filename.split('.').pop() || 'mp3';
    const fileKey = `songs/${randomUUID()}.${fileExtension}`;

    // Prepare custom metadata for R2
    const r2Metadata: Record<string, string> = {
      title: mergedMetadata.title,
      artist: mergedMetadata.artist,
    };
    
    if (mergedMetadata.album) {
      r2Metadata.album = mergedMetadata.album;
    }
    if (mergedMetadata.year) {
      r2Metadata.year = mergedMetadata.year.toString();
    }
    if (mergedMetadata.genre && mergedMetadata.genre.length > 0) {
      r2Metadata.genre = mergedMetadata.genre.join(', ');
    }
    if (extractedMetadata.duration) {
      r2Metadata.duration = extractedMetadata.duration.toString();
    }

    // Upload file to R2 with custom metadata
    console.log('Uploading file to R2...');
    await uploadFile(fileBuffer, fileKey, mimeType, r2Metadata);
    console.log('File uploaded successfully');

    // Save song metadata to database
    const song = new Song({
      title: mergedMetadata.title,
      artist: mergedMetadata.artist,
      album: mergedMetadata.album,
      year: mergedMetadata.year,
      genre: mergedMetadata.genre,
      fileKey,
      mimeType,
      uploadedBy: req.userId,
      fingerprint: fingerprintResult.fingerprint,
    });

    await song.save();
    console.log('Song metadata saved to database');

    // Return created song object with extracted/merged metadata
    res.status(201).json({
      song: {
        id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        year: song.year,
        genre: song.genre,
        mimeType: song.mimeType,
        createdAt: song.createdAt,
      },
      metadata: {
        extracted: extractedMetadata,
        merged: mergedMetadata,
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
 * Get all songs
 * GET /songs
 */
export async function getAllSongs(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Fetch all songs from database
    const songs = await Song.find().sort({ createdAt: -1 });

    // Return songs array
    res.status(200).json({
      songs: songs.map((song) => ({
        id: song._id,
        title: song.title,
        artist: song.artist,
        mimeType: song.mimeType,
        createdAt: song.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get songs error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch songs',
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
