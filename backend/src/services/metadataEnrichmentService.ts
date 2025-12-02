import axios from 'axios';

interface MusicBrainzRecording {
    id: string;
    title: string;
    'artist-credit': Array<{
        artist: {
            id: string;
            name: string;
        };
    }>;
    releases?: Array<{
        id: string;
        title: string;
        date?: string;
        country?: string;
    }>;
    tags?: Array<{
        count: number;
        name: string;
    }>;
}

interface EnrichedMetadata {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    genres?: string[];
    coverArtUrl?: string;
    mbid?: string; // MusicBrainz ID
}

const USER_AGENT = 'NaadaMusicPlayer/1.0.0 ( bhairesh@mailinator.com )'; // Required by MusicBrainz

/**
 * Search MusicBrainz for song metadata
 */
export async function searchMusicBrainz(title: string, artist: string): Promise<EnrichedMetadata | null> {
    try {
        // 1. Search for the recording
        let query = `recording:"${title}"`;
        if (artist) {
            query += ` AND artist:"${artist}"`;
        }
        const searchUrl = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&fmt=json`;

        const response = await axios.get(searchUrl, {
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!response.data.recordings || response.data.recordings.length === 0) {
            return null;
        }

        // Get the best match (first result)
        const match = response.data.recordings[0] as MusicBrainzRecording;

        const result: EnrichedMetadata = {
            title: match.title,
            artist: match['artist-credit']?.[0]?.artist?.name,
            mbid: match.id,
        };

        // Get Album (Release) info
        if (match.releases && match.releases.length > 0) {
            // Prefer official releases
            const release = match.releases[0];
            result.album = release.title;
            result.year = release.date?.split('-')[0]; // Extract year from YYYY-MM-DD

            // Try to fetch cover art for this release
            try {
                const coverArt = await getCoverArt(release.id);
                if (coverArt) {
                    result.coverArtUrl = coverArt;
                }
            } catch (e) {
                console.warn('Failed to fetch cover art:', e);
            }
        }

        // Get Genres (Tags)
        if (match.tags) {
            // Create a copy before sorting to avoid mutating original array
            result.genres = [...match.tags]
                .sort((a, b) => b.count - a.count) // Sort by popularity
                .slice(0, 5) // Top 5
                .map(t => t.name);
        }

        return result;
    } catch (error) {
        console.error('MusicBrainz search failed:', error);
        return null;
    }
}

/**
 * Fetch cover art from Cover Art Archive
 */
async function getCoverArt(releaseId: string): Promise<string | null> {
    try {
        const url = `https://coverartarchive.org/release/${releaseId}`;
        const response = await axios.get(url);

        if (response.data.images && response.data.images.length > 0) {
            // Return the front cover
            const front = response.data.images.find((img: any) => img.front);
            return front ? front.image : response.data.images[0].image;
        }
        return null;
    } catch (error) {
        // 404 is common if no cover art exists, so we just return null
        return null;
    }
}
