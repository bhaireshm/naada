/**
 * Utility to clean metadata strings by removing URLs and website names
 */

// Regex to match URLs (http, https, www)
// Regex to match URLs (http, https, www)
const URL_REGEX = /(https?:\/\/[^\s\])]+)|(www\.[^\s\])]+)/gi;

// Regex to match domain names (e.g., example.com, site.net)
// This is a bit more aggressive, so we need to be careful not to match regular words.
// We'll look for common TLDs at the end of words.
const DOMAIN_REGEX = /\b[\w-]+\.(com|net|org|io|co|in|us|uk|biz|info|me|tv|cc)\b/gi;

// Regex to match "downloaded from" or similar phrases often found in pirated music metadata
const PROMO_REGEX = /\b(downloaded from|uploaded by|visit|website|url)\b.*$/gi;

/**
 * Cleans a string by removing URLs and website names
 * @param text - The text to clean
 * @returns The cleaned text
 */
export function cleanMetadataString(text: string): string {
    if (!text) return text;

    let cleaned = text;

    // Remove URLs
    cleaned = cleaned.replace(URL_REGEX, '');

    // Remove domain names
    cleaned = cleaned.replace(DOMAIN_REGEX, '');

    // Remove specific promo phrases if they appear at the end or are the whole string
    cleaned = cleaned.replace(PROMO_REGEX, '');

    // Clean up double spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remove common promotional prefixes/suffixes often found with URLs
    // e.g. "Song Name [www.website.com]" -> "Song Name []" -> "Song Name"
    cleaned = cleaned.replace(/\[\s*\]/g, '');
    cleaned = cleaned.replace(/\(\s*\)/g, '');

    return cleaned.trim();
}

/**
 * Cleans an object containing metadata fields
 * @param metadata - The metadata object
 * @returns The cleaned metadata object
 */
export function cleanMetadata(metadata: any): any {
    const cleaned: any = { ...metadata };

    if (cleaned.title) cleaned.title = cleanMetadataString(cleaned.title);
    if (cleaned.artist) cleaned.artist = cleanMetadataString(cleaned.artist);
    if (cleaned.album) cleaned.album = cleanMetadataString(cleaned.album);

    // Genre might be an array or string
    if (cleaned.genre) {
        if (Array.isArray(cleaned.genre)) {
            cleaned.genre = cleaned.genre.map((g: string) => cleanMetadataString(g)).filter((g: string) => g.length > 0);
        } else if (typeof cleaned.genre === 'string') {
            cleaned.genre = cleanMetadataString(cleaned.genre);
        }
    }

    return cleaned;
}
