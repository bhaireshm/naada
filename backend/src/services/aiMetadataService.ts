/**
 * AI-Enhanced Metadata Service
 * 
 * This service provides intelligent metadata extraction and enhancement
 * using audio analysis and machine learning techniques.
 */

import { parseBuffer } from 'music-metadata';
import { Song } from '../models/Song';
import { getFile } from './storageService';
import { Readable } from 'stream';

export interface AIMetadata {
    mood?: string;
    aiGenres?: string[];
    energy?: number;
}

export interface BatchProcessingResult {
    total: number;
    processed: number;
    failed: number;
    results: Array<{ id: string; title: string; status: string; error?: string }>;
}

/**
 * Analyze audio buffer and extract AI-enhanced metadata
 * @param fileBuffer - The audio file buffer
 * @param existingGenres - Optional list of genres already in the database
 * @returns AI-enhanced metadata
 */
export async function extractAIMetadata(
    fileBuffer: Buffer,
    existingGenres?: string[]
): Promise<AIMetadata> {
    try {
        // Parse audio file to get detailed format information
        const metadata = await parseBuffer(fileBuffer);

        const aiMetadata: AIMetadata = {};

        // Extract tempo (BPM) if available
        const tempo = metadata.common.bpm;

        // Extract key if available
        const key = metadata.common.key;

        // Calculate energy level based on available metrics
        aiMetadata.energy = calculateEnergyLevel(tempo, metadata.format);

        // Detect mood based on tempo, key, and energy (mode not available in common tags)
        aiMetadata.mood = detectMood(tempo, key, undefined, aiMetadata.energy);

        // Combine file genres with existing DB genres
        const fileGenres = metadata.common.genre || [];
        const allGenres = existingGenres ? [...fileGenres, ...existingGenres] : fileGenres;

        // Enhance genre classification
        aiMetadata.aiGenres = enhanceGenreClassification(
            allGenres,
            tempo,
            aiMetadata.energy
        );

        console.log('AI metadata extraction succeeded:', {
            mood: aiMetadata.mood || 'not detected',
            aiGenres: aiMetadata.aiGenres?.join(', ') || 'not detected',
            energy: aiMetadata.energy?.toFixed(2) || 'not detected',
        });

        return aiMetadata;
    } catch (error) {
        console.error('AI metadata extraction failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {};
    }
}

/**
 * Process a batch of songs to extract AI metadata
 */
export async function processBatch(songIds?: string[], processAll?: boolean): Promise<BatchProcessingResult> {
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
        throw new Error('Either provide songIds array or set processAll to true');
    }

    if (songsToProcess.length === 0) {
        return {
            total: 0,
            processed: 0,
            failed: 0,
            results: []
        };
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
                    const readableStream = stream as Readable;

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

    return {
        total: songsToProcess.length,
        processed,
        failed,
        results
    };
}

/**
 * Calculate energy level from audio characteristics
 * Energy ranges from 0 (calm) to 1 (very energetic)
 */
function calculateEnergyLevel(tempo?: number, format?: any): number {
    let energy = 0.5; // Default neutral energy

    if (tempo) {
        // Tempo-based energy calculation
        // Slow: 0-90 BPM, Medium: 90-130 BPM, Fast: 130+ BPM
        if (tempo < 90) {
            energy = 0.2 + (tempo / 90) * 0.3; // 0.2 - 0.5
        } else if (tempo < 130) {
            energy = 0.5 + ((tempo - 90) / 40) * 0.3; // 0.5 - 0.8
        } else {
            energy = Math.min(0.8 + ((tempo - 130) / 70) * 0.2, 1.0); // 0.8 - 1.0
        }
    }

    // Adjust based on bitrate (higher bitrate often means more complex/energetic music)
    if (format?.bitrate) {
        const bitrateKbps = format.bitrate / 1000;
        if (bitrateKbps > 256) {
            energy = Math.min(energy + 0.05, 1.0);
        }
    }

    return Math.round(energy * 100) / 100; // Round to 2 decimal places
}

/**
 * Detect mood from musical characteristics
 */
function detectMood(
    tempo?: number,
    _key?: string,
    mode?: string,
    energy?: number
): string {
    // Default mood
    let mood = 'neutral';

    // Tempo-based mood detection
    if (tempo) {
        if (tempo < 80) {
            mood = 'calm';
        } else if (tempo < 100) {
            mood = 'relaxed';
        } else if (tempo < 120) {
            mood = 'moderate';
        } else if (tempo < 140) {
            mood = 'upbeat';
        } else {
            mood = 'energetic';
        }
    }

    // Refine mood based on musical mode (major vs minor)
    if (mode) {
        const lowerMode = mode.toLowerCase();
        if (lowerMode.includes('minor')) {
            // Minor keys tend to sound sadder/darker
            if (mood === 'calm') mood = 'melancholic';
            else if (mood === 'relaxed') mood = 'contemplative';
            else if (mood === 'upbeat') mood = 'intense';
            else if (mood === 'energetic') mood = 'aggressive';
        } else if (lowerMode.includes('major')) {
            // Major keys tend to sound happier/brighter
            if (mood === 'calm') mood = 'peaceful';
            else if (mood === 'relaxed') mood = 'content';
            else if (mood === 'moderate') mood = 'cheerful';
            else if (mood === 'upbeat') mood = 'happy';
            else if (mood === 'energetic') mood = 'euphoric';
        }
    }

    // Use energy level to refine further
    if (energy !== undefined) {
        if (energy < 0.3 && !mood.includes('calm') && !mood.includes('peaceful')) {
            mood = 'calm';
        } else if (energy > 0.8 && !mood.includes('energetic') && !mood.includes('euphoric')) {
            mood = 'energetic';
        }
    }

    return mood;
}

/**
 * Enhance genre classification using audio characteristics
 */
function enhanceGenreClassification(
    tagGenres?: string[],
    tempo?: number,
    energy?: number
): string[] {
    const genres: Set<string> = new Set();

    // Add genres from tags (cleaned)
    if (tagGenres && tagGenres.length > 0) {
        tagGenres.forEach(genre => {
            const cleaned = cleanGenre(genre);
            if (cleaned) genres.add(cleaned);
        });
    }

    // Infer additional genres from tempo and energy
    if (tempo && energy !== undefined) {
        // Electronic/Dance music characteristics
        if (tempo >= 120 && tempo <= 140 && energy > 0.7) {
            genres.add('Electronic');
        }

        // Hip-hop/Rap characteristics
        if (tempo >= 85 && tempo <= 115 && energy > 0.5) {
            if (!hasGenreFamily(genres, ['rock', 'metal', 'electronic'])) {
                genres.add('Hip-Hop');
            }
        }

        // Rock/Metal characteristics
        if (tempo >= 140 && energy > 0.8) {
            if (!hasGenreFamily(genres, ['electronic', 'dance'])) {
                genres.add('Rock');
            }
        }

        // Classical/Ambient characteristics
        if (tempo < 80 && energy < 0.4) {
            if (!hasGenreFamily(genres, ['rock', 'metal', 'hip-hop'])) {
                genres.add('Ambient');
            }
        }

        // Pop characteristics (moderate tempo, moderate energy)
        if (tempo >= 100 && tempo <= 130 && energy >= 0.4 && energy <= 0.7) {
            if (genres.size === 0) {
                genres.add('Pop');
            }
        }
    }

    // If no genres detected, return empty array
    return Array.from(genres);
}

/**
 * Clean and normalize genre string
 */
function cleanGenre(genre: string): string | null {
    if (!genre || typeof genre !== 'string') return null;

    // Remove numbers, special characters, and trim
    let cleaned = genre
        .replace(/\d+/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim();

    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();

    // Map common variations to standard names
    const genreMap: Record<string, string> = {
        'rnb': 'R&B',
        'randb': 'R&B',
        'hiphop': 'Hip-Hop',
        'edm': 'Electronic',
        'techno': 'Electronic',
        'house': 'Electronic',
        'trance': 'Electronic',
        'dubstep': 'Electronic',
        'dnb': 'Drum & Bass',
        'drumandbass': 'Drum & Bass',
    };

    const lowerCleaned = cleaned.toLowerCase();
    return genreMap[lowerCleaned] || cleaned;
}

/**
 * Check if genres set contains any genre from a family
 */
function hasGenreFamily(genres: Set<string>, family: string[]): boolean {
    const genresLower = Array.from(genres).map(g => g.toLowerCase());
    return family.some(f => genresLower.some(g => g.includes(f)));
}

/**
 * Analyze and enhance existing metadata with AI insights
 * This can be used to update songs that were uploaded before AI features
 */
export async function analyzeExistingMetadata(
    _title: string,
    _artist: string,
    genre?: string,
    _duration?: number
): Promise<Partial<AIMetadata>> {
    const aiMetadata: Partial<AIMetadata> = {};

    // Estimate energy from genre if available
    if (genre) {
        const lowerGenre = genre.toLowerCase();
        if (lowerGenre.includes('metal') || lowerGenre.includes('punk')) {
            aiMetadata.energy = 0.9;
            aiMetadata.mood = 'aggressive';
        } else if (lowerGenre.includes('classical') || lowerGenre.includes('ambient')) {
            aiMetadata.energy = 0.2;
            aiMetadata.mood = 'calm';
        } else if (lowerGenre.includes('electronic') || lowerGenre.includes('dance')) {
            aiMetadata.energy = 0.8;
            aiMetadata.mood = 'energetic';
        } else if (lowerGenre.includes('jazz') || lowerGenre.includes('blues')) {
            aiMetadata.energy = 0.4;
            aiMetadata.mood = 'relaxed';
        }
    }

    return aiMetadata;
}
