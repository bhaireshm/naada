import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Song } from '../models/Song';
import { searchMusicBrainz } from '../services/metadataEnrichmentService';

/**
 * Enrich song metadata using online sources (MusicBrainz)
 * POST /songs/:id/enrich
 */
export async function enrichSongMetadata(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { id } = req.params;
        const { forceUpdate } = req.body; // If true, overwrite existing fields

        const song = await Song.findById(id);
        if (!song) {
            res.status(404).json({ error: 'Song not found' });
            return;
        }

        // Ensure we have enough info to search
        if (!song.title || !song.artist) {
            res.status(400).json({
                error: 'Song must have a title and artist to perform enrichment'
            });
            return;
        }

        console.log(`Enriching metadata for: ${song.title} - ${song.artist}`);

        // Search online
        const enrichedData = await searchMusicBrainz(song.title, song.artist);

        if (!enrichedData) {
            res.status(404).json({
                message: 'No matching metadata found online',
                song
            });
            return;
        }

        // Update fields
        let updated = false;

        // Helper to update if missing or forced
        const shouldUpdate = (current: any, incoming: any) => {
            if (!incoming) return false;
            if (!current) return true;
            return forceUpdate === true;
        };

        if (shouldUpdate(song.album, enrichedData.album)) {
            song.album = enrichedData.album;
            updated = true;
        }

        if (shouldUpdate(song.year, enrichedData.year)) {
            song.year = enrichedData.year;
            updated = true;
        }

        // For genre, we might want to merge or append
        if (enrichedData.genres && enrichedData.genres.length > 0) {
            // If song.genre is a string, split it. If array, use it.
            let currentGenres: string[] = [];
            if (Array.isArray(song.genre)) {
                currentGenres = song.genre;
            } else if (typeof song.genre === 'string' && song.genre) {
                currentGenres = song.genre.split(',').map(g => g.trim());
            }

            // Add new genres that don't exist
            const newGenres = enrichedData.genres.filter(g => !currentGenres.includes(g));

            if (newGenres.length > 0) {
                // If we are forcing update, maybe we replace? For now, let's append/merge to be safe
                // Or if forceUpdate is true, we could replace.
                // Let's stick to merging for genres to be safe.

                // Update the genre field. 
                // Note: We need to respect the schema. If schema is String, we join.
                // Based on previous tasks, we know schema expects String but we want to support Arrays eventually.
                // For now, let's join them back to a string if the schema is String.

                const merged = [...currentGenres, ...newGenres];
                // Limit to reasonable number
                const finalGenres = merged.slice(0, 5);

                // Check if we need to save as string or array. 
                // The controller previously handled this by checking if it's an array.
                // Let's try to save as string to be safe with current schema.
                song.genre = finalGenres.join(', ');
                updated = true;
            }
        }

        // Cover Art
        if (shouldUpdate(song.albumArt, enrichedData.coverArtUrl)) {
            song.albumArt = enrichedData.coverArtUrl;
            updated = true;
        }

        if (updated) {
            await song.save();
            res.status(200).json({
                message: 'Metadata enriched successfully',
                enrichedFields: enrichedData,
                song
            });
        } else {
            res.status(200).json({
                message: 'Metadata already up to date',
                song
            });
        }

    } catch (error) {
        console.error('Metadata enrichment failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
