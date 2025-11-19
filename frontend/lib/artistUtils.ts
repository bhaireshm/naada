/**
 * Format artists for display
 * Example: "Artist1, Artist2 & Artist3"
 */
export function formatArtists(artists: string[] | undefined, fallback: string = 'Unknown Artist'): string {
  if (!artists || artists.length === 0) return fallback;
  if (artists.length === 1) return artists[0];
  if (artists.length === 2) return `${artists[0]} & ${artists[1]}`;
  
  const lastArtist = artists[artists.length - 1];
  const otherArtists = artists.slice(0, -1).join(', ');
  return `${otherArtists} & ${lastArtist}`;
}

/**
 * Get primary artist (first one)
 */
export function getPrimaryArtist(artists: string[] | undefined, fallback: string = 'Unknown Artist'): string {
  if (!artists || artists.length === 0) return fallback;
  return artists[0];
}

/**
 * Get featured artists (all except first)
 */
export function getFeaturedArtists(artists: string[] | undefined): string[] {
  if (!artists || artists.length <= 1) return [];
  return artists.slice(1);
}

/**
 * Check if song has multiple artists
 */
export function hasMultipleArtists(artists: string[] | undefined): boolean {
  return artists !== undefined && artists.length > 1;
}
