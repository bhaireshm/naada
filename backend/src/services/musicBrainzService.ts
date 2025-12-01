import { MusicBrainzApi } from 'musicbrainz-api';

const mbApi = new MusicBrainzApi({
    appName: 'Naada Music Player',
    appVersion: '1.0.0',
    appContactInfo: 'bhaireshm@example.com', // Replace with actual contact info if available
});

interface Metadata {
    title?: string;
    artist?: string;
    album?: string;
    year?: number;
    genre?: string[];
}

/**
 * Fetch metadata from MusicBrainz based on title and artist
 */
export async function fetchMetadataFromMusicBrainz(title: string, artist?: string): Promise<Metadata | null> {
    try {
        const artistQuery = artist ? ` AND artist:"${artist}"` : '';
        const query = `recording:"${title}"${artistQuery}`;

        const result = await mbApi.search('recording', { query, limit: 1 });

        if (result.recordings && result.recordings.length > 0) {
            const recording = result.recordings[0];
            const metadata: Metadata = {
                title: recording.title,
                artist: recording['artist-credit']?.[0]?.name,
            };

            if (recording.releases && recording.releases.length > 0) {
                const release = recording.releases[0];
                metadata.album = release.title;
                if (release.date) {
                    metadata.year = Number.parseInt(release.date.split('-')[0], 10);
                }
            }

            // Tags property may not be available in all responses
            // if (recording.tags) {
            //     metadata.genre = recording.tags.map((tag: any) => tag.name);
            // }

            return metadata;
        }

        return null;
    } catch (error) {
        console.error('MusicBrainz API error:', error);
        return null;
    }
}
