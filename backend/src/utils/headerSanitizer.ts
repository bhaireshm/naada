/**
 * Sanitize a string value for use in HTTP headers
 * Removes or replaces characters that are not allowed in HTTP header values
 * 
 * According to RFC 7230, header field values should only contain:
 * - Visible ASCII characters (0x21-0x7E)
 * - Whitespace (0x20, 0x09)
 * 
 * @param value - The string value to sanitize
 * @returns Sanitized string safe for HTTP headers
 */
export function sanitizeHeaderValue(value: string): string {
    if (!value) return '';

    return value
        // Replace newlines and carriage returns with spaces
        .replace(/[\r\n]/g, ' ')
        // Replace tabs with spaces
        .replace(/\t/g, ' ')
        // Remove other control characters (0x00-0x1F and 0x7F)
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        // Replace non-ASCII characters (> 0x7E) with closest ASCII equivalent or remove
        .replace(/[^\x20-\x7E]/g, '')
        // Collapse multiple spaces into one
        .replace(/\s+/g, ' ')
        // Trim leading/trailing whitespace
        .trim();
}

/**
 * Sanitize all values in a metadata record for use in HTTP headers
 * @param metadata - Record of metadata key-value pairs
 * @returns Sanitized metadata record safe for HTTP headers
 */
export function sanitizeMetadataForHeaders(
    metadata: Record<string, string>
): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(metadata)) {
        if (value !== undefined && value !== null) {
            sanitized[key] = sanitizeHeaderValue(value);
        }
    }

    return sanitized;
}
