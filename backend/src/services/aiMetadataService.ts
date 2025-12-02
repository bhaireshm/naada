/**
 * AI-Enhanced Metadata Service
 * 
 * This service provides intelligent metadata extraction and enhancement
 * using audio analysis and machine learning techniques.
 * 
 * Features:
 * - Genre classification from audio features
 * - Mood detection based on tempo, key, and energy
 * - Energy level calculation
 * - Smart metadata cleaning and normalization
 */

import { parseBuffer } from 'music-metadata';

export interface AIMetadata {
    mood?: string;
    aiGenres?: string[];
    energy?: number;
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

        // Extract key and mode if available
        const key = metadata.common.key;
        const mode = metadata.common.mode;

        // Calculate energy level based on available metrics
        aiMetadata.energy = calculateEnergyLevel(tempo, metadata.format);

        // Detect mood based on tempo, key, and mode
        aiMetadata.mood = detectMood(tempo, key, mode, aiMetadata.energy);

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
    key?: string,
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
    title: string,
    artist: string,
    genre?: string,
    duration?: number
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
