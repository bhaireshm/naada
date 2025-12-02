import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Song } from '../models/Song';
import { getFile } from '../services/storageService';
import { extractAIMetadata } from '../services/aiMetadataService';

/**
 * Process existing songs to extract AI metadata
 * POST /songs/process-ai-metadata
 * 
 * This endpoint processes existing songs that don't have AI metadata
 * and updates them with mood, energy, and AI genres.
 */
export async function processAIMetadata(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { songIds, processAll } = req.body;

        // Find songs to process
        let songsToProcess;

        if (processAll) {
            // Process all songs without AI metadata
            songsToProcess = await Song.find({
                $or: [
                    { mood: { $exists: false } },
                    { aiGenres: { $exists: false } },
                    { energy: { $exists: false } },
                ],
            }).lean();
            console.log(`Found ${songsToProcess.length} songs without AI metadata`);
        } else if (songIds && Array.isArray(songIds)) {
            // Process specific songs
            songsToProcess = await Song.find({ _id: { $in: songIds } }).lean();
            console.log(`Processing ${songsToProcess.length} specific songs`);
        } else {
            res.status(400).json({
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Either provide songIds array or set processAll to true',
                },
            });
            return;
        }

        if (songsToProcess.length === 0) {
            res.status(200).json({
                message: 'No songs to process',
                processed: 0,
                failed: 0,
            });
            return;
        }

        // Process songs in batches to avoid memory issues
        const batchSize = 10;
        let processed = 0;
        let failed = 0;
        const results: Array<{ id: string; title: string; status: string; error?: string }> = [];

        for (let i = 0; i < songsToProcess.length; i += batchSize) {
            const batch = songsToProcess.slice(i, i + batchSize);

            await Promise.all(
                batch.map(async (song) => {
                    try {
                        console.log(`Processing song: ${song.title} by ${song.artist}`);

                        // Download the audio file from storage
                        const stream = await getFile(song.fileKey);

                        // Convert stream to buffer
                        const chunks: Buffer[] = [];
                        const readableStream = stream;

                        for await (const chunk of readableStream) {
                            chunks.push(Buffer.from(chunk));
                        }
                        const fileBuffer = Buffer.concat(chunks);

                        // Parse existing genres from DB if available
                        let existingGenres: string[] = [];
                        if (song.genre) {
                            // Handle if genre is already an array or a string
                            if (Array.isArray(song.genre)) {
                                existingGenres = song.genre;
                            } else if (typeof song.genre === 'string') {
                                existingGenres = song.genre.split(',').map(g => g.trim()).filter(g => g.length > 0);
                            }
                        }

                        // Extract AI metadata, passing existing genres
                        const aiMetadata = await extractAIMetadata(fileBuffer, existingGenres);

                        // Prepare update object
                        const updateData: any = {};
                        if (aiMetadata.mood) updateData.mood = aiMetadata.mood;
                        if (aiMetadata.aiGenres && aiMetadata.aiGenres.length > 0) {
                            updateData.aiGenres = aiMetadata.aiGenres;
                        }
                        if (aiMetadata.energy !== undefined) updateData.energy = aiMetadata.energy;

                        // Fix potential schema issues with genre (if it's an array in DB but String in schema)
                        if (Array.isArray(song.genre)) {
                            updateData.genre = (song.genre as unknown as string[]).join(', ');
                        }

                        // Update using updateOne to bypass document validation issues
                        await Song.updateOne({ _id: song._id }, { $set: updateData });

                        processed++;
                        results.push({
                            id: (song._id as string).toString(),
                            title: song.title,
                            status: 'success',
                        });

                        console.log(`✓ Processed: ${song.title} - Mood: ${aiMetadata.mood}, Energy: ${aiMetadata.energy}`);
                    } catch (error) {
                        failed++;
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        results.push({
                            id: (song._id as string).toString(),
                            title: song.title,
                            status: 'failed',
                            error: errorMessage,
                        });
                        console.error(`✗ Failed to process ${song.title}:`, errorMessage);
                    }
                })
            );

            // Log progress
            console.log(`Progress: ${Math.min(i + batchSize, songsToProcess.length)}/${songsToProcess.length} songs processed`);
        }

        res.status(200).json({
            message: 'AI metadata processing completed',
            total: songsToProcess.length,
            processed,
            failed,
            results,
        });
    } catch (error) {
        console.error('AI metadata processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({
            error: {
                code: 'PROCESSING_FAILED',
                message: 'Failed to process AI metadata',
                details: errorMessage,
            },
        });
    }
}

/**
 * Get AI metadata processing status
 * GET /songs/ai-metadata-status
 * 
 * Returns statistics about songs with and without AI metadata
 */
export async function getAIMetadataStatus(
    _req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const totalSongs = await Song.countDocuments();

        const songsWithMood = await Song.countDocuments({ mood: { $exists: true, $ne: null } });
        const songsWithAIGenres = await Song.countDocuments({ aiGenres: { $exists: true, $ne: null } });
        const songsWithEnergy = await Song.countDocuments({ energy: { $exists: true, $ne: null } });

        const songsWithAllAIMetadata = await Song.countDocuments({
            mood: { $exists: true, $ne: null },
            aiGenres: { $exists: true, $ne: null },
            energy: { $exists: true, $ne: null },
        });

        const songsWithoutAIMetadata = await Song.countDocuments({
            $or: [
                { mood: { $exists: false } },
                { aiGenres: { $exists: false } },
                { energy: { $exists: false } },
            ],
        });

        res.status(200).json({
            total: totalSongs,
            withAIMetadata: songsWithAllAIMetadata,
            withoutAIMetadata: songsWithoutAIMetadata,
            breakdown: {
                withMood: songsWithMood,
                withAIGenres: songsWithAIGenres,
                withEnergy: songsWithEnergy,
            },
            percentageComplete: totalSongs > 0
                ? Math.round((songsWithAllAIMetadata / totalSongs) * 100)
                : 0,
        });
    } catch (error) {
        console.error('Get AI metadata status error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({
            error: {
                code: 'STATUS_FETCH_FAILED',
                message: 'Failed to fetch AI metadata status',
                details: errorMessage,
            },
        });
    }
}
