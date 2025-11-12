# Requirements Document

## Introduction

This feature addresses two critical issues in the music player application:

1. Enhances the song upload functionality to automatically extract metadata (title, artist, album, etc.) from audio files and provides a robust fallback mechanism when the audio fingerprinting tool (fpcalc) is unavailable or fails
2. Fixes the playlist detail page loading issue caused by inconsistent API response formats between backend and frontend

The system will gracefully handle missing dependencies while still allowing song uploads with duplicate detection based on file hash when fingerprinting is unavailable. Additionally, it will standardize API response formats to ensure consistent data flow between frontend and backend.

## Glossary

- **Upload Service**: The backend service responsible for processing audio file uploads
- **Metadata Extractor**: Component that reads ID3 tags and other metadata from audio files
- **Fingerprint Service**: Component that generates acoustic fingerprints using fpcalc for duplicate detection
- **File Hash**: SHA-256 hash of the audio file content used as fallback duplicate detection
- **Audio File**: MP3, WAV, FLAC, or other supported audio format files
- **User**: Authenticated user uploading songs to the music player

## Requirements

### Requirement 1

**User Story:** As a user, I want to upload audio files without manually entering metadata, so that I can quickly add songs to my library

#### Acceptance Criteria

1. WHEN a user uploads an audio file, THE Upload Service SHALL extract title, artist, album, year, and genre from the file's metadata tags
2. IF metadata fields are missing from the audio file, THEN THE Upload Service SHALL use the filename as the title and set artist to "Unknown Artist"
3. THE Upload Service SHALL support metadata extraction from MP3 (ID3v2), WAV, FLAC, and AAC audio formats
4. WHEN metadata extraction completes, THE Upload Service SHALL return the extracted metadata to the user for confirmation before saving

### Requirement 2

**User Story:** As a user, I want the system to work even when fpcalc is not installed, so that I can still upload songs without technical setup issues

#### Acceptance Criteria

1. WHEN fpcalc is not available on the system, THE Fingerprint Service SHALL log a warning and use file hash for duplicate detection
2. IF fingerprint generation fails, THEN THE Upload Service SHALL compute a SHA-256 hash of the audio file as a fallback identifier
3. THE Upload Service SHALL complete the upload process successfully regardless of fpcalc availability
4. WHEN using file hash fallback, THE Upload Service SHALL store the hash in the same fingerprint field for consistency

### Requirement 3

**User Story:** As a user, I want to be prevented from uploading duplicate songs, so that my library stays organized

#### Acceptance Criteria

1. WHEN a song with an identical fingerprint exists, THE Upload Service SHALL reject the upload with a 409 status code
2. WHEN a song with an identical file hash exists, THE Upload Service SHALL reject the upload with a 409 status code
3. IF a duplicate is detected, THEN THE Upload Service SHALL return details of the existing song in the error response
4. THE Upload Service SHALL check for duplicates before uploading the file to cloud storage

### Requirement 4

**User Story:** As a user, I want to manually override extracted metadata if it's incorrect, so that I can ensure my library has accurate information

#### Acceptance Criteria

1. WHEN a user provides title or artist in the upload request, THE Upload Service SHALL use the provided values instead of extracted metadata
2. THE Upload Service SHALL merge user-provided metadata with extracted metadata, giving priority to user input
3. IF both extracted and user-provided metadata are missing for required fields, THEN THE Upload Service SHALL return a 400 error with clear field requirements
4. THE Upload Service SHALL validate that at minimum title and artist are present after merging metadata sources

### Requirement 5

**User Story:** As a developer, I want clear error messages when upload fails, so that I can quickly diagnose and fix issues

#### Acceptance Criteria

1. WHEN an upload error occurs, THE Upload Service SHALL return a structured error response with error code and descriptive message
2. IF fpcalc fails, THE Upload Service SHALL log the specific error but continue processing with file hash
3. THE Upload Service SHALL distinguish between client errors (400) and server errors (500) in response codes
4. WHEN metadata extraction fails, THE Upload Service SHALL log the error and continue with fallback values

### Requirement 6

**User Story:** As a user, I want the playlist detail page to load correctly, so that I can view and manage my playlist songs

#### Acceptance Criteria

1. WHEN the frontend requests a playlist by ID, THE Playlist API SHALL return a consistent response format matching the expected structure
2. THE Playlist API SHALL return playlist data in the same format for GET, POST, and PUT operations
3. WHEN the playlist detail page loads, THE Frontend SHALL successfully parse the API response and display the playlist
4. THE Playlist API SHALL wrap single playlist responses in a consistent object structure with a "playlist" property for POST and PUT operations
