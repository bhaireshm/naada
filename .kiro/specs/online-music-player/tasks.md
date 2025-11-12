# Implementation Plan

## Backend Implementation

- [x] 1. Initialize backend project structure and dependencies

  - Create Node.js project with TypeScript configuration
  - Install Express, Mongoose, Firebase Admin SDK, AWS SDK, multer, and Chromaprint dependencies
  - Set up ESLint and Prettier configurations
  - Create folder structure: config/, models/, controllers/, services/, middleware/, routes/
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Configure external service connections

  - [x] 2.1 Implement MongoDB connection module

    - Create db.ts with Mongoose connection logic
    - Add connection error handling and retry logic
    - Export connection function for use in main app
    - _Requirements: 2.1, 3.1, 5.1, 5.2, 6.1, 6.2, 8.2, 10.3_
  - [x] 2.2 Implement Firebase Admin SDK initialization

    - Create firebase.ts with Admin SDK initialization
    - Configure service account credentials from environment variables
    - Export admin instance for token verification
    - _Requirements: 1.3, 1.4, 9.1, 9.2, 9.3, 9.4_
  - [x] 2.3 Implement Cloudflare R2 client configuration

    - Create storage.ts with AWS SDK S3 client for R2
    - Configure endpoint, credentials, and bucket from environment variables
    - Export configured client instance
    - _Requirements: 4.1, 10.1, 10.2, 10.3, 10.4_

- [x] 3. Implement data models

  - [x] 3.1 Create User model

    - Define Mongoose schema with uid, email, and createdAt fields
    - Add unique constraints on uid and email
    - Export User model
    - _Requirements: 1.1_

  - [x] 3.2 Create Song model

    - Define Mongoose schema with title, artist, fileKey, mimeType, uploadedBy, fingerprint, and createdAt
    - Add index on fingerprint field for duplicate detection
    - Add unique constraint on fileKey
    - Export Song model
    - _Requirements: 2.2, 2.3, 2.4, 3.2, 3.3, 8.1, 8.2, 8.3, 10.2_
  - [x] 3.3 Create Playlist model

    - Define Mongoose schema with name, userId, songIds array, createdAt, and updatedAt
    - Add reference relationships to User and Song models
    - Export Playlist model
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4_

- [x] 4. Implement authentication middleware

  - Create auth.ts middleware to verify Firebase ID tokens
  - Extract token from Authorization header
  - Verify token using Firebase Admin SDK
  - Attach userId to request object on success
  - Return 401 error for missing or invalid tokens
  - _Requirements: 1.3, 1.4, 9.1, 9.2, 9.3, 9.4_
-

- [x] 5. Implement fingerprint service

  - [x] 5.1 Create fingerprint generation function

    - Implement generateFingerprint() using child_process to execute fpcalc
    - Accept file buffer as input
    - Parse fpcalc output to extract fingerprint hash
    - Handle errors from fpcalc execution
    - _Requirements: 2.2, 8.1_
  - [x] 5.2 Create duplicate detection function

    - Implement checkDuplicate() to query Song model by fingerprint
    - Return existing song document if found, null otherwise
    - _Requirements: 2.3, 8.2, 8.3_

- [x] 6. Implement storage service

  - [x] 6.1 Create file upload function

    - Implement uploadFile() using AWS SDK PutObjectCommand
    - Accept file buffer, key, and MIME type as parameters
    - Upload to configured R2 bucket
    - Return file key on success
    - Handle and throw storage errors
    - _Requirements: 2.4, 10.1, 10.2, 10.4_
  - [x] 6.2 Create file retrieval function

    - Implement getFile() using AWS SDK GetObjectCommand
    - Accept file key as parameter
    - Return readable stream from R2
    - Support range requests for partial content
    - Handle and throw storage errors
    - _Requirements: 4.1, 10.3, 10.4_

- [x] 7. Implement song upload endpoint

  - Create POST /songs/upload route with authentication middleware
  - Configure multer to handle multipart file upload
  - Extract file buffer and metadata (title, artist) from request
  - Generate audio fingerprint using fingerprint service
  - Check for duplicate fingerprint in database
  - If duplicate exists, return 409 error with duplicate message
  - If unique, upload file to R2 using storage service
  - Save song metadata with fingerprint to database
  - Return created song object
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 8.1, 8.2, 8.3, 8.4_

- [x] 8. Implement song streaming endpoint

  - Create GET /songs/:id route with authentication middleware
  - Fetch song metadata from database by ID
  - Retrieve file from R2 using storage service and fileKey
  - Parse Range header from request if present
  - Set appropriate response headers (Content-Type, Accept-Ranges, Content-Range)
  - Stream file with 206 Partial Content status for range requests
  - Stream full file with 200 status for non-range requests
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Implement playlist management endpoints

  - [x] 9.1 Create GET /playlists endpoint

    - Add authentication middleware
    - Query Playlist model by userId from authenticated request
    - Populate songIds with song metadata
    - Return array of playlist objects
    - _Requirements: 5.2_
  - [x] 9.2 Create POST /playlists endpoint

    - Add authentication middleware
    - Extract playlist name from request body
    - Create new Playlist document with userId and name
    - Return created playlist object
    - _Requirements: 5.1_
  - [x] 9.3 Create PUT /playlists/:id endpoint

    - Add authentication middleware
    - Extract songIds array from request body
    - Verify all songIds reference existing songs
    - Update playlist's songIds and updatedAt fields
    - Return updated playlist object
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 9.4 Create DELETE /playlists/:id endpoint
    - Add authentication middleware
    - Verify playlist belongs to authenticated user
    - Delete playlist document from database
    - Return success confirmation
    - _Requirements: 5.3_
-

- [x] 10. Implement error handling middleware

  - Create global error handler middleware
  - Format errors into consistent ErrorResponse structure
  - Map error types to appropriate HTTP status codes
  - Log errors with context information
  - Return user-friendly error messages
  - _Requirements: 1.4, 2.5, 8.4, 10.4_
-

- [-] 11. Check for existing if its already complted don't do else Create Express application entry point

  - Initialize Express app in index.ts
  - Connect to MongoDB on startup
  - Register middleware (CORS, JSON parser, authentication)
  - Register route handlers for auth, songs, and playlists
  - Register error handling middleware
  - Start server on configured port
  - Add health check endpoint GET /health
  - _Requirementcommit the completed tasks changes

s: All requirements_

- [x] 11.1 Write backend integration tests documentation

  - Create document file saying how to test/use the below mentioned.
  - Doc to Test song upload flow with duplicate detection
  - Doc to Test song streaming with range requests
  - Doc to Test playlist CRUD operations
  - Doc to create Mock external services (Firebase, R2, MongoDB)
  - _Requirements: All requirements_

## Frontend Implementation

- [x] 12. Initialize frontend project structure

  - Create Next.js project with TypeScript and Tailwind CSS
  - Install Firebase SDK and other dependencies
  - Configure Tailwind CSS
  - Create folder structure: app/, components/, lib/, hooks/
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
-

- [x] 13. Configure Firebase Authentication

  - Create firebase.ts with Firebase SDK initialization
  - Configure Firebase project credentials from environment variables
  - Export auth instance and helper functions
  - _Requirements: 1.1, 1.2_

- [x] 14. Implement API client module

  - Create api.ts with HTTP client functions
  - Implement getIdToken() to retrieve current user's Firebase token
  - Create wrapper functions for all backend endpoints with automatic token injection
  - Implement error handling and response parsing
  - _Requirements: 1.2, 1.3_
-

- [x] 15. Create authentication hook

  - Implement useAuth() hook to manage authentication state
  - Provide signUp(), signIn(), signOut() functions
  - Track current user and loading state
  - Handle authentication errors
  - _Requirements: 1.1, 1.2_

- [x] 16. Build authentication pages

  - [x] 16.1 Create login page

    - Build login form with email and password inputs
    - Integrate with useAuth() hook
    - Handle form submission and errors
    - Redirect to library on success
    - _Requirements: 1.1, 1.2_
  - [x] 16.2 Create registration page

    - Build signup form with email and password inputs
    - Integrate with useAuth() hook
    - Handle form submission and errors
    - Redirect to library on success
    - _Requirements: 1.1_

- [x] 17. Implement audio player component

  - Create AudioPlayer component with HTML5 audio element
  - Implement play, pause, and seek controls
  - Display current song metadata (title, artist)
  - Implement volume control
  - Create useAudioPlayer() hook to manage player state
  - Set audio source to backend streaming endpoint with song ID
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 18. Build song upload component

  - Create UploadForm component with file input and metadata fields
  - Validate file type (audio formats only)
  - Display upload progress bar
  - Call backend upload endpoint with file and metadata
  - Handle success and error responses (including duplicate detection)
  - Refresh song library on successful upload
  - _Requirements: 2.1, 3.1, 8.4_

- [x] 19. Create song library page

  - Build library page to display all uploaded songs
  - Fetch songs from backend on page load
  - Display song list with title, artist, and play button
  - Integrate with AudioPlayer component to play selected song
  - Include UploadForm component for adding new songs
  - _Requirements: 3.1, 3.2, 3.3, 7.2_
-

- [ ] 20. Implement playlist management components

  - [x] 20.1 Create PlaylistManager component

    - Display list of user's playlists
    - Provide create playlist button and form
    - Provide delete playlist button for each playlist
    - Call backend playlist endpoints
    --_Requirements: 5.1, 5.2, 5.3_

  - [x] 20.2 Create playlist detail page

    - Display playlist name and song list
    - Provide add song button with song selector
    - Provide remove song button for each song in playlist
    - Integrate with AudioPlayer to play songs from playlist
    - Call backend playlist update endpoint
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
-

- [x] 21. Build main application layout

  - Create root layout with navigation bar
  - Add links to library and playlists pages
  - Display current user email and logout button
  - Implement protected route logic to redirect unauthenticated users
  - _Requirements: 1.1, 1.2_

- [ ] 22. Write frontend component tests
  - Test AudioPlayer component rendering and controls
  - Test UploadForm validation and submission
  - Test PlaylistManager CRUD operations
  - Mock API calls and authentication
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

## Deployment

- [x] 23. Configure backend deployment on Render

  - Create Render web service from GitHub repository
  - Configure environment variables for MongoDB, Firebase, and R2
  - Set build command and start command
  - Enable auto-deploy from main branch
  - Verify health check endpoint
  - _Requirements: All backend requirements_

- [ ] 24. Configure frontend deployment on Vercel

  - Create Vercel project from GitHub repository
  - Configure environment variables for API URL and Firebase
  - Enable auto-deploy from main branch
  - Verify production build and deployment
  - _Requirements: All frontend requirements_

- [ ] 25. Perform end-to-end testing
  - Test user registration and login flow
  - Test song upload and duplicate detection
  - Test song playback and streaming
  - Test playlist creation and management
  - Verify all features work in production environment
  - _Requirements: All requirements_
