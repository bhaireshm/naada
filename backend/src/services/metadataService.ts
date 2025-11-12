/**
 * Metadata extraction service for audio files
 */

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string[];
  duration?: number;
}

/**
 * Extract metadata from an audio file buffer
 * @param fileBuffer - The audio file buffer to extract metadata from
 * @returns Promise resolving to AudioMetadata object
 */
export async function extractMetadata(fileBuffer: Buffer): Promise<AudioMetadata> {
  try {
    // Dynamic import of music-metadata
    const { parseBuffer } = await import('music-metadata');
    
    // Parse the audio file buffer
    const metadata = await parseBuffer(fileBuffer);
    
    // Extract common metadata fields
    const audioMetadata: AudioMetadata = {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year,
      genre: metadata.common.genre,
      duration: metadata.format.duration,
    };
    
    console.log('Metadata extracted successfully:', {
      title: audioMetadata.title || 'N/A',
      artist: audioMetadata.artist || 'N/A',
      fieldsFound: Object.values(audioMetadata).filter(v => v !== undefined).length,
    });
    
    return audioMetadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    
    // Return empty object on failure (graceful degradation)
    return {};
  }
}
