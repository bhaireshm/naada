import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Song } from '../models/Song';
import { processBatch } from '../services/aiMetadataService';

/**
 * Process existing songs to extract AI metadata
 * POST /songs/process-ai-metadata
 */
export async function processAIMetadata(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { songIds, processAll } = req.body;

        if (!processAll && (!songIds || !Array.isArray(songIds))) {
            res.status(400).json({
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Either provide songIds array or set processAll to true',
                },
            });
            return;
        }

        // Delegate to service
        const result = await processBatch(songIds, processAll);

        res.status(200).json({
            message: 'AI metadata processing completed',
            ...result
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
