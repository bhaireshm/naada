# Backend Integration Testing Guide

This document provides instructions for manually testing the backend API endpoints and understanding how to mock external services for integration testing.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Testing Song Upload Flow with Duplicate Detection](#testing-song-upload-flow-with-duplicate-detection)
4. [Testing Song Streaming with Range Requests](#testing-song-streaming-with-range-requests)
5. [Testing Playlist CRUD Operations](#testing-playlist-crud-operations)
6. [Mocking External Services](#mocking-external-services)

## Prerequisites

Before testing, ensure you have:

- Node.js (v18 or higher)
- MongoDB running locally or MongoDB Atlas connection
- Firebase project with Admin SDK credentials
- Cloudflare R2 bucket configured
- Chromaprint (fpcalc) installed on your system
- A REST client (Postman, Insomnia, or curl)

## Environment Setup

1. Install dependencies:
```bash
cd backend
pnpm install
```

2. Create a `.env` file with the following variables:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/music-player-test
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

3. Start the development server:
```bash
pnpm dev
```

The server should start on `http://localhost:3001`.

## Testing Song Upload Flow with Duplicate Detection

### Test Case 1: Successful Song Upload

**Objective**: Verify that a new song can be uploaded successfully.

**Steps**:

1. Authenticate a user via Firebase and obtain an ID token
2. Make a POST request to `/songs/upload`:

```bash
curl -X POST http://localhost:3001/songs/upload \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -F "file=@/path/to/song.mp3" \
  -F "title=Test Song" \
  -F "artist=Test Artist"
```

**Expected Response** (201 Created):
```json
{
  "song": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Test Song",
    "artist": "Test Artist",
    "fileKey": "songs/uuid-generated-key.mp3",
    "mimeType": "audio/mpeg",
    "uploadedBy": "firebase-user-id",
    "fingerprint": "AQAD1234567890...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Verification**:
- Check MongoDB to confirm the song document was created
- Check R2 bucket to confirm the file was uploaded
- Note the fingerprint value for duplicate testing

### Test Case 2: Duplicate Song Detection

**Objective**: Verify that uploading the same audio file is rejected.

**Steps**:

1. Upload the same audio file again using the same request from Test Case 1

**Expected Response** (409 Conflict):
```json
{
  "error": {
    "code": "DUPLICATE_SONG",
    "message": "A song with the same audio fingerprint already exists",
    "details": {
      "existingSong": {
        "id": "507f1f77bcf86cd799439011",
        "title": "Test Song",
        "artist": "Test Artist"
      }
    }
  }
}
```

**Verification**:
- Confirm no new document was created in MongoDB
- Confirm no new file was uploaded to R2
- Verify the existing song ID matches the first upload

### Test Case 3: Upload Without Authentication

**Objective**: Verify authentication is required.

**Steps**:

1. Make a POST request without the Authorization header:

```bash
curl -X POST http://localhost:3001/songs/upload \
  -F "file=@/path/to/song.mp3" \
  -F "title=Test Song" \
  -F "artist=Test Artist"
```

**Expected Response** (401 Unauthorized):
```json
{
  "error": {
    "code": "AUTH_TOKEN_MISSING",
    "message": "No authentication token provided"
  }
}
```

### Test Case 4: Upload Without File

**Objective**: Verify file is required.

**Steps**:

1. Make a POST request without attaching a file:

```bash
curl -X POST http://localhost:3001/songs/upload \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -F "title=Test Song" \
  -F "artist=Test Artist"
```

**Expected Response** (400 Bad Request):
```json
{
  "error": {
    "code": "MISSING_FILE",
    "message": "No audio file provided"
  }
}
```

### Test Case 5: Upload Without Metadata

**Objective**: Verify title and artist are required.

**Steps**:

1. Make a POST request without title or artist:

```bash
curl -X POST http://localhost:3001/songs/upload \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -F "file=@/path/to/song.mp3"
```

**Expected Response** (400 Bad Request):
```json
{
  "error": {
    "code": "MISSING_METADATA",
    "message": "Title and artist are required"
  }
}
```

## Testing Song Streaming with Range Requests

### Test Case 1: Stream Full Song

**Objective**: Verify complete song streaming without range requests.

**Steps**:

1. Upload a song (see previous section)
2. Make a GET request to `/songs/:id`:

```bash
curl -X GET http://localhost:3001/songs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  --output downloaded-song.mp3
```

**Expected Response** (200 OK):
- Headers:
  - `Content-Type: audio/mpeg`
  - `Accept-Ranges: bytes`
  - `Content-Length: <file-size>`
- Body: Complete audio file stream

**Verification**:
- Play the downloaded file to confirm it's valid
- Check file size matches the original upload

### Test Case 2: Stream with Range Request (Partial Content)

**Objective**: Verify partial content streaming for seeking/progressive playback.

**Steps**:

1. Make a GET request with a Range header:

```bash
curl -X GET http://localhost:3001/songs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Range: bytes=0-1023" \
  --output partial-song.mp3
```

**Expected Response** (206 Partial Content):
- Headers:
  - `Content-Type: audio/mpeg`
  - `Content-Range: bytes 0-1023/<total-size>`
  - `Content-Length: 1024`
  - `Accept-Ranges: bytes`
- Body: First 1024 bytes of the audio file

**Verification**:
- Check that the downloaded file is exactly 1024 bytes
- Verify Content-Range header shows correct range

### Test Case 3: Stream with Multiple Range Requests

**Objective**: Simulate progressive playback by requesting sequential chunks.

**Steps**:

1. Request first chunk (bytes 0-999):
```bash
curl -X GET http://localhost:3001/songs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Range: bytes=0-999"
```

2. Request second chunk (bytes 1000-1999):
```bash
curl -X GET http://localhost:3001/songs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Range: bytes=1000-1999"
```

**Expected Response** (206 Partial Content for each):
- Each response should contain the requested byte range
- Content-Range headers should reflect the correct positions

### Test Case 4: Invalid Range Request

**Objective**: Verify error handling for out-of-bounds range requests.

**Steps**:

1. Request a range beyond the file size:

```bash
curl -X GET http://localhost:3001/songs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Range: bytes=999999999-999999999"
```

**Expected Response** (416 Range Not Satisfiable):
```json
{
  "error": {
    "code": "INVALID_RANGE",
    "message": "Requested range not satisfiable"
  }
}
```

### Test Case 5: Stream Non-Existent Song

**Objective**: Verify error handling for invalid song IDs.

**Steps**:

1. Request a song with a non-existent ID:

```bash
curl -X GET http://localhost:3001/songs/000000000000000000000000 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Expected Response** (404 Not Found):
```json
{
  "error": {
    "code": "SONG_NOT_FOUND",
    "message": "Song not found"
  }
}
```

## Testing Playlist CRUD Operations

### Test Case 1: Create Playlist

**Objective**: Verify playlist creation.

**Steps**:

1. Make a POST request to `/playlists`:

```bash
curl -X POST http://localhost:3001/playlists \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Favorite Songs"}'
```

**Expected Response** (201 Created):
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "My Favorite Songs",
  "userId": "firebase-user-id",
  "songIds": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Verification**:
- Check MongoDB to confirm the playlist document was created
- Verify userId matches the authenticated user
- Confirm songIds is an empty array

### Test Case 2: Create Playlist Without Name

**Objective**: Verify name is required.

**Steps**:

1. Make a POST request without a name:

```bash
curl -X POST http://localhost:3001/playlists \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response** (400 Bad Request):
```json
{
  "error": {
    "code": "MISSING_METADATA",
    "message": "Playlist name is required"
  }
}
```

### Test Case 3: Fetch All Playlists

**Objective**: Verify retrieval of user's playlists.

**Steps**:

1. Create 2-3 playlists using Test Case 1
2. Make a GET request to `/playlists`:

```bash
curl -X GET http://localhost:3001/playlists \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Expected Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "My Favorite Songs",
    "userId": "firebase-user-id",
    "songIds": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Workout Mix",
    "userId": "firebase-user-id",
    "songIds": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Verification**:
- Confirm all playlists belong to the authenticated user
- Verify the response is an array

### Test Case 4: Update Playlist with Songs

**Objective**: Verify adding songs to a playlist.

**Steps**:

1. Upload 2-3 songs and note their IDs
2. Create a playlist and note its ID
3. Make a PUT request to `/playlists/:id`:

```bash
curl -X PUT http://localhost:3001/playlists/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "songIds": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439014"
    ]
  }'
```

**Expected Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "My Favorite Songs",
  "userId": "firebase-user-id",
  "songIds": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Test Song 1",
      "artist": "Test Artist 1"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Test Song 2",
      "artist": "Test Artist 2"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:01:00.000Z"
}
```

**Verification**:
- Confirm songIds array contains the full song objects (populated)
- Verify updatedAt timestamp changed
- Check MongoDB to confirm the update

### Test Case 5: Update Playlist with Invalid Song IDs

**Objective**: Verify validation of song IDs.

**Steps**:

1. Make a PUT request with non-existent song IDs:

```bash
curl -X PUT http://localhost:3001/playlists/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "songIds": ["000000000000000000000000"]
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "error": {
    "code": "MISSING_METADATA",
    "message": "One or more song IDs do not exist"
  }
}
```

### Test Case 6: Remove Songs from Playlist

**Objective**: Verify removing songs by updating with a smaller array.

**Steps**:

1. Update a playlist that has songs with an empty array:

```bash
curl -X PUT http://localhost:3001/playlists/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"songIds": []}'
```

**Expected Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "My Favorite Songs",
  "userId": "firebase-user-id",
  "songIds": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:02:00.000Z"
}
```

### Test Case 7: Delete Playlist

**Objective**: Verify playlist deletion.

**Steps**:

1. Make a DELETE request to `/playlists/:id`:

```bash
curl -X DELETE http://localhost:3001/playlists/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "message": "Playlist deleted successfully"
}
```

**Verification**:
- Check MongoDB to confirm the playlist was deleted
- Verify a subsequent GET request returns 404

### Test Case 8: Delete Non-Existent Playlist

**Objective**: Verify error handling for invalid playlist IDs.

**Steps**:

1. Make a DELETE request with a non-existent ID:

```bash
curl -X DELETE http://localhost:3001/playlists/000000000000000000000000 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Expected Response** (404 Not Found):
```json
{
  "error": {
    "code": "INVALID_PLAYLIST_ID",
    "message": "Playlist not found"
  }
}
```

### Test Case 9: Playlist Operations Without Authentication

**Objective**: Verify authentication is required for all playlist operations.

**Steps**:

1. Make any playlist request without the Authorization header:

```bash
curl -X GET http://localhost:3001/playlists
```

**Expected Response** (401 Unauthorized):
```json
{
  "error": {
    "code": "AUTH_TOKEN_MISSING",
    "message": "No authentication token provided"
  }
}
```

## Mocking External Services

When writing automated integration tests, you'll need to mock external services to avoid dependencies on Firebase, R2, and MongoDB. Here's how to approach mocking each service:

### Mocking Firebase Authentication

Firebase Admin SDK is used to verify ID tokens. To mock this:

**Approach 1: Jest Mock (for automated tests)**

```typescript
jest.mock('../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn().mockResolvedValue({ 
      uid: 'test-user-id',
      email: 'test@example.com'
    }),
  },
}));
```

**Approach 2: Test Firebase Project**

- Create a separate Firebase project for testing
- Use Firebase Auth emulator for local testing
- Generate test tokens programmatically

**Key Points**:
- Mock `verifyIdToken()` to return a test user object
- Test both successful verification and failure scenarios
- Ensure the mock returns the expected `uid` field

### Mocking Cloudflare R2 (AWS SDK)

R2 uses the AWS SDK S3 client. To mock this:

**Approach 1: Jest Mock**

```typescript
jest.mock('../services/storageService', () => ({
  uploadFile: jest.fn().mockResolvedValue('songs/test-file-key.mp3'),
  getFile: jest.fn().mockResolvedValue(Readable.from(['mock audio data'])),
}));

jest.mock('../config/storage', () => ({
  r2Client: {
    send: jest.fn().mockResolvedValue({
      ContentLength: 1000,
    }),
  },
  bucketName: 'test-bucket',
}));
```

**Approach 2: Local S3-Compatible Storage**

- Use MinIO or LocalStack for local S3-compatible storage
- Configure the AWS SDK to point to the local endpoint
- Useful for more realistic integration testing

**Key Points**:
- Mock `uploadFile()` to return a file key without actual upload
- Mock `getFile()` to return a readable stream
- Mock R2 client's `send()` method for HEAD requests (file size)
- Test error scenarios (upload failures, retrieval failures)

### Mocking MongoDB

For database operations, use an in-memory MongoDB instance:

**Approach: MongoDB Memory Server**

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Setup before tests
async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}

// Cleanup after each test
async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// Teardown after all tests
async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}
```

**Key Points**:
- Use `mongodb-memory-server` for isolated test database
- Clear collections between tests to ensure isolation
- No need to mock Mongoose models - use real models with test DB
- Fast and doesn't require external MongoDB instance

### Mocking Chromaprint (fpcalc)

The fingerprint service executes the `fpcalc` command-line tool:

**Approach: Jest Mock**

```typescript
jest.mock('../services/fingerprintService', () => ({
  generateFingerprint: jest.fn().mockResolvedValue('AQAD1234567890'),
  checkDuplicate: jest.fn().mockResolvedValue(null),
}));
```

**Key Points**:
- Mock `generateFingerprint()` to return a consistent test fingerprint
- Mock `checkDuplicate()` to return null (no duplicate) or a song object
- Test duplicate detection by controlling the mock return value
- No need to have fpcalc installed for automated tests

### Complete Test Setup Example

Here's a complete example of setting up mocks for integration tests:

```typescript
import request from 'supertest';
import express, { Express } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user-id' }),
  },
}));

// Mock Fingerprint Service
jest.mock('../services/fingerprintService', () => ({
  generateFingerprint: jest.fn().mockResolvedValue('AQAD1234567890'),
  checkDuplicate: jest.fn().mockResolvedValue(null),
}));

// Mock Storage Service
jest.mock('../services/storageService', () => ({
  uploadFile: jest.fn().mockResolvedValue('songs/test-key.mp3'),
  getFile: jest.fn().mockResolvedValue(Readable.from(['audio data'])),
}));

// Mock R2 Client
jest.mock('../config/storage', () => ({
  r2Client: {
    send: jest.fn().mockResolvedValue({ ContentLength: 1000 }),
  },
  bucketName: 'test-bucket',
}));

describe('Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let app: Express;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    // Create Express app with routes
    app = createTestApp();
  });

  afterEach(async () => {
    // Clear database between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    
    // Clear mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it('should upload a song', async () => {
    const response = await request(app)
      .post('/songs/upload')
      .set('Authorization', 'Bearer mock-token')
      .field('title', 'Test Song')
      .field('artist', 'Test Artist')
      .attach('file', Buffer.from('audio'), 'test.mp3');

    expect(response.status).toBe(201);
    expect(response.body.song.title).toBe('Test Song');
  });
});
```

### Testing Strategy Summary

1. **Unit Tests**: Test individual functions with mocked dependencies
2. **Integration Tests**: Test API endpoints with mocked external services (Firebase, R2) and in-memory MongoDB
3. **Manual Tests**: Use this guide to test with real services in development/staging
4. **E2E Tests**: Test complete user flows with real or staging services

### Common Testing Pitfalls

1. **Not clearing database between tests**: Always clear collections to ensure test isolation
2. **Not resetting mocks**: Use `jest.clearAllMocks()` in `afterEach()`
3. **Hardcoded IDs**: Use MongoDB's ObjectId generation for realistic IDs
4. **Not testing error cases**: Test both success and failure scenarios
5. **Forgetting authentication**: Always include Authorization header in protected endpoint tests
6. **Not testing range requests properly**: Verify Content-Range headers and partial content

## Health Check Endpoint

The backend includes a health check endpoint for monitoring:

```bash
curl -X GET http://localhost:3001/health
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Use this endpoint to verify the server is running before starting tests.

## Troubleshooting

### Issue: "fpcalc not found"

**Solution**: Install Chromaprint:
- macOS: `brew install chromaprint`
- Ubuntu: `sudo apt-get install libchromaprint-tools`
- Windows: Download from https://acoustid.org/chromaprint

### Issue: MongoDB connection failed

**Solution**: 
- Ensure MongoDB is running locally or check Atlas connection string
- Verify network access in MongoDB Atlas settings
- Check firewall rules

### Issue: Firebase token verification failed

**Solution**:
- Verify Firebase credentials in `.env`
- Ensure private key is properly formatted with `\n` for newlines
- Check Firebase project ID matches

### Issue: R2 upload/download failed

**Solution**:
- Verify R2 credentials and endpoint
- Check bucket permissions
- Ensure bucket name is correct

## Conclusion

This guide provides comprehensive testing instructions for all backend functionality. For automated testing, use the mocking strategies outlined in the "Mocking External Services" section. For manual testing, follow the test cases in each section with real services configured.
