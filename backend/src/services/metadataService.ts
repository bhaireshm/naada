/**
 * Metadata extraction service for audio files
 */

import { extractAIMetadata, AIMetadata } from './aiMetadataService';

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string[];
  duration?: number;
  // AI-enhanced metadata
  mood?: string;
  aiGenres?: string[];
  energy?: number;
}

/**
 * Remove URLs and website links from a string
 * @param text - Text that may contain URLs
 * @returns Cleaned text with URLs removed
 */
function removeUrls(text: string): string {
  // Remove full URLs (http://, https://, www.)
  let cleaned = text.replace(/(?:https?:\/\/|www\.)[^\s]+/gi, '');

  // Remove domain-like patterns (e.g., "MassTamilan.com", "example.org")
  cleaned = cleaned.replace(/\b[\w-]+\.(com|org|net|in|io|co|fm|tv|me|info|biz)\b/gi, '');

  // Remove common separators like " - " that might be left over
  cleaned = cleaned.replace(/\s*-\s*$/g, '').replace(/^\s*-\s*/g, '');

  return cleaned.trim();
}

/**
 * Clean metadata by removing URLs from string fields
 * @param metadata - Raw metadata object
 * @returns Cleaned metadata object
 */
function cleanMetadata(metadata: AudioMetadata): AudioMetadata {
  const cleaned: AudioMetadata = { ...metadata };

  // Clean string fields
  if (cleaned.title) {
    cleaned.title = removeUrls(cleaned.title);
    // If title becomes empty after URL removal, set to undefined
    if (cleaned.title.length === 0) {
      cleaned.title = undefined;
    }
  }
  if (cleaned.artist) {
    cleaned.artist = removeUrls(cleaned.artist);
    // If artist becomes empty after URL removal, set to undefined
    if (cleaned.artist.length === 0) {
      cleaned.artist = undefined;
    }
  }
  if (cleaned.album) {
    cleaned.album = removeUrls(cleaned.album);
    // If album becomes empty after URL removal, set to undefined
    if (cleaned.album.length === 0) {
      cleaned.album = undefined;
    }
  }

  // Clean genre array
  if (cleaned.genre && Array.isArray(cleaned.genre)) {
    cleaned.genre = cleaned.genre
      .map(g => removeUrls(g))
      .filter(g => g.length > 0); // Remove empty strings after URL removal

    // If genre array becomes empty, set to undefined
    if (cleaned.genre.length === 0) {
      cleaned.genre = undefined;
    }
  }

  return cleaned;
}

/**
 * Extract metadata from an audio file buffer
 * @param fileBuffer - The audio file buffer to extract metadata from
 * @returns Promise resolving to AudioMetadata object with both standard and AI-enhanced metadata
 */
export async function extractMetadata(fileBuffer: Buffer): Promise<AudioMetadata> {
  try {
    // Dynamic import of music-metadata
    const { parseBuffer } = await import('music-metadata');

    // Parse the audio file buffer
    const metadata = await parseBuffer(fileBuffer);

    // Extract common metadata fields
    const rawMetadata: AudioMetadata = {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year,
      genre: metadata.common.genre,
      duration: metadata.format.duration,
    };

    // Clean metadata by removing URLs
    const audioMetadata = cleanMetadata(rawMetadata);

    // Extract AI-enhanced metadata in parallel (non-blocking)
    let aiMetadata: AIMetadata = {};
    try {
      aiMetadata = await extractAIMetadata(fileBuffer);

      // Merge AI metadata into the result
      if (aiMetadata.mood) audioMetadata.mood = aiMetadata.mood;
      if (aiMetadata.aiGenres && aiMetadata.aiGenres.length > 0) {
        audioMetadata.aiGenres = aiMetadata.aiGenres;
      }
      if (aiMetadata.energy !== undefined) audioMetadata.energy = aiMetadata.energy;
    } catch (aiError) {
      // AI extraction is optional, don't fail the whole process
      console.warn('AI metadata extraction failed, continuing with standard metadata:',
        aiError instanceof Error ? aiError.message : 'Unknown error');
    }

    // Count fields that were successfully extracted
    const standardFields = Object.entries(audioMetadata)
      .filter(([key]) => !['mood', 'aiGenres', 'energy'].includes(key))
      .filter(([, value]) => value !== undefined).length;

    const aiFields = Object.entries(audioMetadata)
      .filter(([key]) => ['mood', 'aiGenres', 'energy'].includes(key))
      .filter(([, value]) => value !== undefined).length;

    // Log success with field count
    console.log('Metadata extraction succeeded:', {
      standardFieldsExtracted: standardFields,
      aiFieldsExtracted: aiFields,
      title: audioMetadata.title || 'missing',
      artist: audioMetadata.artist || 'missing',
      album: audioMetadata.album || 'missing',
      year: audioMetadata.year || 'missing',
      genre: audioMetadata.genre ? audioMetadata.genre.join(', ') : 'missing',
      duration: audioMetadata.duration ? `${audioMetadata.duration.toFixed(2)}s` : 'missing',
      mood: audioMetadata.mood || 'not detected',
      aiGenres: audioMetadata.aiGenres ? audioMetadata.aiGenres.join(', ') : 'not detected',
      energy: audioMetadata.energy !== undefined ? audioMetadata.energy.toFixed(2) : 'not detected',
    });

    // Log warnings for missing critical metadata
    if (!audioMetadata.title) {
      console.warn('Metadata extraction warning: Title field is missing from audio file');
    }
    if (!audioMetadata.artist) {
      console.warn('Metadata extraction warning: Artist field is missing from audio file');
    }

    return audioMetadata;
  } catch (error) {
    // Log error with stack trace for debugging
    console.error('Metadata extraction failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return empty object on failure (graceful degradation)
    return {};
  }
}
