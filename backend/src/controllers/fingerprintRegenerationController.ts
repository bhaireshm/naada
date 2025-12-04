import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Song } from '../models/Song';
import { generateFingerprint } from '../services/fingerprintService';
import { getFile } from '../services/storageService';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';

/**
 * Helper to save stream to file
 */
async function saveStreamToFile(stream: Readable, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        stream.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

/**
 * Regenerate acoustic fingerprints for songs with hash-based fingerprints
 * POST /songs/regenerate-fingerprints
 */
export async function regenerateFingerprints(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { songIds, processAll, limit = 10 } = req.body; // Process max 10 songs at a time by default

        if (!processAll && (!songIds || !Array.isArray(songIds))) {
            res.status(400).json({
                error: 'Either provide songIds array or set processAll to true'
            });
            return;
        }

        console.log(`Starting fingerprint regeneration (processAll: ${processAll}, limit: ${limit})`);

        // Find songs with hash-based fingerprints (starts with "HASH:")
        let songs;
        if (processAll) {
            songs = await Song.find({
                fingerprint: { $regex: /^HASH:/ }
            }).limit(limit); // Limit to prevent memory issues
        } else {
            songs = await Song.find({
                _id: { $in: songIds },
                fingerprint: { $regex: /^HASH:/ }
            }).limit(limit);
        }

        console.log(`Found ${songs.length} songs with hash-based fingerprints (limited to ${limit})`);

        const results: Array<{
            id: string;
            title: string;
            status: 'success' | 'failed';
            oldFingerprint?: string;
            newFingerprint?: string;
            error?: string;
        }> = [];

        let processed = 0;
        let failed = 0;

        for (const song of songs) {
            try {
                console.log(`Processing: ${song.title} - ${song.artist}`);

                // Create temp directory if it doesn't exist
                const tempDir = path.join(os.tmpdir(), 'music-player-fingerprints');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                // Download file from R2
                const tempFilePath = path.join(tempDir, `${song._id}.mp3`);

                try {
                    const stream = await getFile(song.fileKey);
                    await saveStreamToFile(stream, tempFilePath);
                } catch (downloadError) {
                    console.error(`Failed to download ${song.fileKey}:`, downloadError);
                    failed++;
                    results.push({
                        id: song.id,
                        title: song.title || 'Unknown',
                        status: 'failed',
                        error: 'Failed to download audio file from storage'
                    });
                    continue;
                }

                // Read file as buffer
                const fileBuffer = fs.readFileSync(tempFilePath);

                // Generate new acoustic fingerprint
                const fingerprintResult = await generateFingerprint(fileBuffer);

                // Clean up temp file
                fs.unlinkSync(tempFilePath);

                if (fingerprintResult.method === 'acoustic') {
                    // Update song with new fingerprint
                    const oldFingerprint = song.fingerprint;
                    song.fingerprint = fingerprintResult.fingerprint;
                    await song.save();

                    processed++;
                    results.push({
                        id: song.id,
                        title: song.title || 'Unknown',
                        status: 'success',
                        oldFingerprint: oldFingerprint.substring(0, 50) + '...',
                        newFingerprint: fingerprintResult.fingerprint.substring(0, 50) + '...'
                    });

                    console.log(`✓ Updated fingerprint for: ${song.title}`);
                } else {
                    // Acoustic fingerprinting failed, keep hash
                    failed++;
                    results.push({
                        id: song.id,
                        title: song.title || 'Unknown',
                        status: 'failed',
                        error: 'Acoustic fingerprinting not available, kept hash'
                    });
                }

            } catch (error) {
                failed++;
                results.push({
                    id: song.id,
                    title: song.title || 'Unknown',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                console.error(`Failed to regenerate fingerprint for song ${song.id}:`, error);
            }
        }

        res.status(200).json({
            message: 'Fingerprint regeneration completed',
            total: songs.length,
            processed,
            failed,
            results
        });

    } catch (error) {
        console.error('Fingerprint regeneration failed:', error);
        res.status(500).json({
            error: 'Fingerprint regeneration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
