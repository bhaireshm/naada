# Design Document

## Overview

This design addresses two critical issues in the music player application:

1. **Song Upload Enhancement**: Implement automatic metadata extraction from audio files and provide graceful fallback when the fpcalc fingerprinting tool is unavailable
2. **Playlist API Fix**: Standardize API response formats to resolve the playlist detail page loading issue

The solution uses the `music-metadata` npm package for metadata extraction and implements a fallback mechanism using SHA-256 file hashing when fpcalc is unavailable. For the playlist issue, we'll standardize the backend response format to match frontend expectations.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌────────────────┐  ┌──────────────────┐                  │
│  │ Upload Page    │  │ Playlist Detail  │                  │
│  │                │  │ Page             │                  │
│  └────────┬───────┘  └────────┬─────────┘                  │
│           │                   │                              │
│           │                   │                              │
└───────────┼───────────────────┼──────────────────────────────┘
            │                   │
            │ HTTP/JSON         │ HTTP/JSON
            │                   │
┌───────────┼───────────────────┼──────────────────────────────┐
│           │                   │                              │
│  ┌────────▼───────┐  ┌────────▼─────────┐                  │
│  │ Song           │  │ Playlist         │                  │
│  │ Controller     │  │ Controller       │                  │
│  └────────┬───────┘  └────────┬─────────┘                  │
│           │                   │                              │
│  ┌────────▼───────────────────▼─────────┐                  │
│  │                                       │                  │
│  │      Metadata Extraction Service      │                  │
│  │  ┌─────────────┐  ┌────────────────┐ │                  │
│  │  │ music-      │  │ Fingerprint    │ │                  │
│  │  │ metadata    │  │ Service        │ │                  │
│  │  │             │  │ (fpcalc/hash)  │ │                  │
│  │  └─────────────┘  └────────────────┘ │                  │
│  │                                       │                  │
│  └───────────────────────────────────────┘                  │
│                      Backend (Express)                       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Metadata Extraction Service

**Purpose**: Extract metadata from audio files using the `music-metadata` library

**Location**: `backend/src/services/metadataService.ts`

**Interface**:
```typescript
interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string[];
  duration?: number;
}

async function extractMetadata(fileBuffer: Buffer): Promise<AudioMetadata>
```

**Behavior**:
- Accepts audio file buffer as input
- Uses `music-metadata` library's `parseBuffer()` method
- Extracts common metadata fields (title, artist, album, year, genre)
- Returns structured metadata object
- Handles errors gracefully and returns empty object on failure

### 2. Enhanced Fingerprint Service

**Purpose**: Generate audio fingerprints with fallback to file hashing

**Location**: `backend/src/services/fingerprintService.ts` (modified)

**Interface**:
```typescript
interface FingerprintResult {
  fingerprint: string;
  method: 'acoustic' | 'hash';
}

async function generateFingerprint(fileBuffer: Buffer): Promise<FingerprintResult>
```

**Behavior**:
- First attempts to use fpcalc for acoustic fingerprinting
- If fpcalc is unavailable or fails:
  - Logs warning message
  - Falls back to SHA-256 hash of file buffer
  - Returns hash with method indicator
- Returns fingerprint string and method used
- Never throws errors - always returns a valid fingerprint

**Implementation Details**:
- Check if fpcalc exists using `which` command (cross-platform)
- Wrap fpcalc execution in try-catch
- Use Node.js `crypto` module for SHA-256 hashing
- Prefix hash-based fingerprints with "HASH:" for identification

### 3. Updated Song Controller

**Purpose**: Orchestrate metadata extraction and fingerprinting during upload

**Location**: `backend/src/controllers/songController.ts` (modified)

**Changes**:
1. Extract metadata from uploaded file buffer
2. Merge extracted metadata with user-provided metadata (user input takes priority)
3. Use fallback values for missing required fields:
   - Title: filename or "Unknown Title"
   - Artist: "Unknown Artist"
4. Generate fingerprint with fallback support
5. Validate merged metadata before proceeding
6. Return extracted metadata in response for user confirmation

**Request Flow**:
```
1. Receive file upload
2. Extract metadata from file buffer
3. Merge with request body metadata (user input priority)
4. Apply fallback values for missing fields
5. Generate fingerprint (with fallback)
6. Check for duplicates
7. Upload to R2
8. Save to database
9. Return success response with metadata
```

### 4. Standardized Playlist Controller

**Purpose**: Fix inconsistent API response formats

**Location**: `backend/src/controllers/playlistController.ts` (modified)

**Changes**:
- Modify `createPlaylist` to return: `{ playlist: playlistObject }`
- Modify `updatePlaylist` to return: `{ playlist: playlistObject }`
- Keep `getPlaylist` returning direct playlist object (frontend expects this)
- Keep `getPlaylists` returning array (frontend expects this)

**Response Format Standards**:
```typescript
// GET /playlists/:id
Response: Playlist

// GET /playlists
Response: Playlist[]

// POST /playlists
Response: { playlist: Playlist }

// PUT /playlists/:id
Response: { playlist: Playlist }

// DELETE /playlists/:id
Response: { message: string, playlistId: string }
```

## Data Models

### AudioMetadata Interface

```typescript
interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string[];
  duration?: number;
}
```

### FingerprintResult Interface

```typescript
interface FingerprintResult {
  fingerprint: string;
  method: 'acoustic' | 'hash';
}
```

### Song Model (No Changes)

Existing Song model remains unchanged. The fingerprint field will store either acoustic fingerprints or file hashes transparently.

### Playlist Model (No Changes)

Existing Playlist model remains unchanged.

## Error Handling

### Metadata Extraction Errors

- **Strategy**: Graceful degradation
- **Behavior**: 
  - Log error with details
  - Return empty metadata object
  - Continue with fallback values
- **User Impact**: None - upload continues with filename/defaults

### Fingerprint Generation Errors

- **Strategy**: Automatic fallback to file hash
- **Behavior**:
  - Log warning when fpcalc unavailable
  - Log error if fpcalc execution fails
  - Compute SHA-256 hash as fallback
  - Prefix with "HASH:" for identification
- **User Impact**: None - duplicate detection still works

### Playlist API Errors

- **Strategy**: Maintain existing error handling
- **Behavior**:
  - Return structured error responses
  - Use appropriate HTTP status codes
  - Include error codes and messages
- **User Impact**: Clear error messages in UI

## Testing Strategy

### Unit Tests

1. **Metadata Service Tests**:
   - Test extraction from MP3 files with ID3 tags
   - Test extraction from files without metadata
   - Test error handling for corrupted files
   - Test various audio formats (MP3, WAV, FLAC)

2. **Fingerprint Service Tests**:
   - Test acoustic fingerprint generation (when fpcalc available)
   - Test fallback to file hash
   - Test hash consistency for same file
   - Test different files produce different hashes

3. **Song Controller Tests**:
   - Test metadata merging logic
   - Test user-provided metadata priority
   - Test fallback value application
   - Test duplicate detection with both fingerprint types

4. **Playlist Controller Tests**:
   - Test response format for each endpoint
   - Test populated song data in responses
   - Test error responses maintain format

### Integration Tests

1. **Upload Flow Tests**:
   - Test complete upload with metadata extraction
   - Test upload with manual metadata override
   - Test upload without fpcalc installed
   - Test duplicate detection

2. **Playlist Flow Tests**:
   - Test playlist creation and retrieval
   - Test adding/removing songs
   - Test frontend can parse all responses

### Manual Testing

1. **Upload Testing**:
   - Upload MP3 with complete metadata
   - Upload MP3 with partial metadata
   - Upload MP3 with no metadata
   - Upload with manual metadata input
   - Test with fpcalc disabled

2. **Playlist Testing**:
   - Create new playlist
   - View playlist detail page
   - Add songs to playlist
   - Remove songs from playlist
   - Verify page loads correctly

## Dependencies

### New Dependencies

```json
{
  "music-metadata": "^8.1.4"
}
```

**Rationale**: Industry-standard library for audio metadata extraction with support for multiple formats

### Existing Dependencies

- `crypto` (Node.js built-in): For SHA-256 hashing
- `child_process` (Node.js built-in): For fpcalc execution
- `multer`: For file upload handling (already installed)

## Implementation Notes

### Cross-Platform Considerations

- Use `which` command on Unix/Linux/Mac
- Use `where` command on Windows
- Handle both command outputs appropriately
- Test file path handling on Windows (backslashes)

### Performance Considerations

- Metadata extraction is fast (<100ms for typical files)
- SHA-256 hashing is fast (<50ms for typical audio files)
- No significant performance impact on upload flow
- Consider caching fpcalc availability check

### Security Considerations

- Validate file buffers before processing
- Sanitize extracted metadata (trim, length limits)
- Prevent path traversal in temp file creation
- Clean up temp files in all code paths (use finally blocks)

### Backward Compatibility

- Existing songs with acoustic fingerprints remain valid
- New hash-based fingerprints use "HASH:" prefix
- Duplicate detection works across both types
- No database migration required
