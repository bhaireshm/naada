/**
 * Parse artist string and extract multiple artists
 * Handles various separators: comma, semicolon, feat., ft., &, and, with
 */
export function parseArtists(artistString: string): string[] {
  if (!artistString || !artistString.trim()) {
    return ['Unknown Artist'];
  }

  // Replace common separators with a standard delimiter
  let normalized = artistString
    // Handle "feat.", "ft.", "featuring"
    .replace(/\s+feat\.?\s+/gi, ', ')
    .replace(/\s+ft\.?\s+/gi, ', ')
    .replace(/\s+featuring\s+/gi, ', ')
    // Handle "&" and "and"
    .replace(/\s+&\s+/g, ', ')
    .replace(/\s+and\s+/gi, ', ')
    .replace(/\s+with\s+/gi, ', ')
    // Handle semicolons
    .replace(/\s*;\s*/g, ', ')
    // Handle slashes
    .replace(/\s*\/\s*/g, ', ');

  // Split by comma and clean up
  const artists = normalized
    .split(',')
    .map(artist => artist.trim())
    .filter(artist => artist.length > 0)
    // Remove duplicates (case-insensitive)
    .filter((artist, index, self) => 
      self.findIndex(a => a.toLowerCase() === artist.toLowerCase()) === index
    );

  return artists.length > 0 ? artists : ['Unknown Artist'];
}

/**
 * Get the primary artist (first one in the list)
 */
export function getPrimaryArtist(artistString: string): string {
  const artists = parseArtists(artistString);
  return artists[0];
}

/**
 * Get featured artists (all except the first one)
 */
export function getFeaturedArtists(artistString: string): string[] {
  const artists = parseArtists(artistString);
  return artists.slice(1);
}

/**
 * Format artists for display
 * Example: "Artist1, Artist2 & Artist3"
 */
export function formatArtists(artists: string[]): string {
  if (artists.length === 0) return 'Unknown Artist';
  if (artists.length === 1) return artists[0];
  if (artists.length === 2) return `${artists[0]} & ${artists[1]}`;
  
  const lastArtist = artists[artists.length - 1];
  const otherArtists = artists.slice(0, -1).join(', ');
  return `${otherArtists} & ${lastArtist}`;
}
