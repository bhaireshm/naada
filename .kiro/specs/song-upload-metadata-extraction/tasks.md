# Implementation Plan

- [x] 1. Install required dependencies

  - Install `music-metadata` package in backend
  - Verify installation and check version compatibility
  - _Requirements: 1.3_

- [x] 2. Create metadata extraction service

  - [x] 2.1 Create metadataService.ts file with AudioMetadata interface

    - Define AudioMetadata interface with title, artist, album, year, genre, duration fields
    - Export interface for use in other modules
    - _Requirements: 1.1_
  
  - [x] 2.2 Implement extractMetadata function

    - Import music-metadata library's parseBuffer function
    - Accept Buffer parameter and return Promise<AudioMetadata>
    - Extract common metadata fields from parsed result
    - Handle errors gracefully and return empty object on failure
    - Add logging for extraction errors
    - _Requirements: 1.1, 1.2, 5.4_
-

- [x] 3. Enhance fingerprint service with fallback mechanism

  - [x] 3.1 Add FingerprintResult interface and hash generation function

    - Define FingerprintResult interface with fingerprint string and method type
    - Import crypto module for SHA-256 hashing
    - Create generateFileHash helper function that computes SHA-256 of buffer
    - Prefix hash results with "HASH:" for identification

    - _Requirements: 2.2, 2.4_
  
  - [x] 3.2 Modify generateFingerprint to use fallback

    - Wrap existing fpcalc logic in try-catch block
    - On fpcalc failure, log warning and call generateFileHash
    - Return FingerprintResult with method indicator
    - Ensure function never throws errors
    - Update return type to FingerprintResult
    - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 4. Update song controller for metadata handling

  - [x] 4.1 Import and integrate metadata extraction

    - Import extractMetadata from metadataService
    - Call extractMetadata with file buffer before fingerprint generation
    - Store extracted metadata in variable
    - _Requirements: 1.1_
  
  - [x] 4.2 Implement metadata merging logic

    - Create mergeMetadata helper function
    - Merge extracted metadata with req.body metadata
    - Give priority to user-provided values
    - Apply fallback values: use filename for missing title, "Unknown Artist" for missing artist
    - Validate that title and artist are present after merging
    - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.3 Update fingerprint handling

    - Update code to handle FingerprintResult type
    - Extract fingerprint string from result object
    - Log the method used (acoustic vs hash)
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.4 Update response to include metadata

    - Add extracted/merged metadata to success response
    - Include album, year, genre if available
    - Maintain existing response structure
    - _Requirements: 1.4_
-

- [x] 5. Fix playlist API response formats

  - [x] 5.1 Update createPlaylist response format

    - Modify response to wrap playlist in object: { playlist: playlistObject }
    - Ensure response matches frontend expectation
    - Test response structure
    - _Requirements: 6.2, 6.4_
  
  - [x] 5.2 Update updatePlaylist response format

    - Modify response to wrap playlist in object: { playlist: playlistObject }
    - Ensure populated songs are included
    - Maintain consistency with createPlaylist format
    - _Requirements: 6.2, 6.4_
  
  - [x] 5.3 Verify getPlaylist and getPlaylists formats

    - Confirm getPlaylist returns direct Playlist object
    - Confirm getPlaylists returns Playlist array
    - Ensure no changes needed for these endpoints
    - _Requirements: 6.1, 6.3_

- [x] 6. Update error handling and logging

  - [x] 6.1 Add structured logging for metadata extraction

    - Log when metadata extraction succeeds with field count
    - Log warnings when metadata is missing
    - Log errors with stack traces for debugging
    - _Requirements: 5.1, 5.4_
  
  - [x] 6.2 Add structured logging for fingerprint fallback

    - Log info message when using acoustic fingerprint
    - Log warning when falling back to file hash
    - Include reason for fallback in log message
    - _Requirements: 5.2_

- [x] 7. Clean metadata by removing URLs

  - [x] 7.1 Implement URL removal function

    - Create removeUrls helper function to strip URLs from text
    - Support http://, https://, <www>. patterns
    - Return cleaned text with URLs removed
    - _Requirements: 1.1, 1.2_
  
  - [x] 7.2 Implement metadata cleaning function

    - Create cleanMetadata function to process AudioMetadata
    - Clean title, artist, album fields by removing URLs
    - Clean genre array and filter empty strings
    - Return cleaned metadata object
    - _Requirements: 1.1, 1.2_
  
  - [x] 7.3 Integrate cleaning into extraction flow

    - Apply cleanMetadata to extracted metadata before returning
    - Ensure cleaned metadata is saved to database
    - Maintain existing logging and error handling
    - _Requirements: 1.1, 1.2, 4.1_
