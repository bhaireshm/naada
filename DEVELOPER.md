# 🛠️ Developer Documentation

Complete technical documentation for developers working on the Music Player application.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [PWA Implementation](#pwa-implementation)
- [State Management](#state-management)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Mobile     │  │   Desktop    │      │
│  │   (PWA)      │  │   (PWA)      │  │   (PWA)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Service Worker  │  IndexedDB  │  React Contexts    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (REST API)
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers  │  Services  │  Middleware  │  Models  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │   MongoDB    │        │ Cloudflare   │
        │   Database   │        │      R2      │
        └──────────────┘        └──────────────┘
```

### Technology Stack

**Frontend**
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Mantine v7
- **Language**: TypeScript
- **State Management**: React Context API
- **Authentication**: Firebase Auth
- **Offline Storage**: IndexedDB
- **PWA**: Service Workers, Web App Manifest

**Backend**
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: Firebase Admin SDK
- **Audio Processing**: Chromaprint (fpcalc)

## Frontend Architecture

### Directory Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── library/                 # Library page
│   ├── playlists/               # Playlist pages
│   ├── favorites/               # Favorites page
│   ├── discover/                # Discover page
│   ├── offline/                 # Offline management
│   ├── profile/                 # User profile
│   ├── settings/                # Settings page
│   └── songs/[id]/              # Song details
│
├── components/                   # React components
│   ├── AudioPlayer.tsx          # Main audio player
│   ├── Navigation.tsx           # App navigation
│   ├── SearchOverlay.tsx        # Global search
│   ├── InstallPrompt.tsx        # PWA install prompt
│   ├── OfflineIndicator.tsx     # Online/offline status
│   ├── DownloadButton.tsx       # Download for offline
│   ├── FavoriteButton.tsx       # Favorite toggle
│   └── ...
│
├── contexts/                     # React Context providers
│   ├── AudioPlayerContext.tsx   # Audio player state
│   ├── AuthContext.tsx          # Authentication state
│   ├── SearchContext.tsx        # Search state
│   ├── FavoritesContext.tsx     # Favorites state
│   └── ThemeProvider.tsx        # Theme management
│
├── lib/                          # Utilities and services
│   ├── api.ts                   # API client
│   ├── firebase.ts              # Firebase configuration
│   ├── keyboardShortcuts.ts     # Keyboard shortcuts config
│   ├── offline/                 # Offline functionality
│   │   ├── indexedDB.ts        # IndexedDB wrapper
│   │   ├── offlineStorage.ts   # Storage service
│   │   ├── downloadManager.ts  # Download management
│   │   └── syncManager.ts      # Sync management
│   └── sw/                      # Service worker utilities
│       └── register.ts          # SW registration
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useKeyboardShortcut.ts   # Keyboard shortcuts
│   └── ...
│
└── public/                       # Static assets
    ├── sw.js                    # Service worker
    ├── manifest.json            # PWA manifest
    ├── offline.html             # Offline fallback
    └── icons/                   # App icons
```

### Key Components

#### AudioPlayer Component
Location: `frontend/components/AudioPlayer.tsx`

The main audio player with playback controls, volume management, and queue navigation.

**Features:**
- Play/pause, next/previous controls
- Volume slider with mute
- Seek bar with time display
- Queue management
- Keyboard shortcuts
- Full accessibility (ARIA labels)

**Usage:**
```tsx
import AudioPlayer from '@/components/AudioPlayer';

<AudioPlayer song={currentSong} onSongChange={handleSongChange} />
```

#### SearchOverlay Component
Location: `frontend/components/SearchOverlay.tsx`

Global search overlay with keyboard navigation and filtering.

**Features:**
- Real-time search across songs, artists, albums, playlists
- Filter tabs
- Keyboard navigation (arrow keys, Enter, Escape)
- Search history
- Debounced API calls

**Usage:**
```tsx
import { SearchOverlay } from '@/components/SearchOverlay';
import { useSearchContext } from '@/contexts/SearchContext';

const { isOpen, closeSearch } = useSearchContext();
<SearchOverlay opened={isOpen} onClose={closeSearch} />
```

### State Management

#### AudioPlayerContext
Manages global audio player state and playback queue.

**State:**
```typescript
{
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Song[];
  currentIndex: number;
  loading: boolean;
}
```

**Actions:**
- `play()` - Start playback
- `pause()` - Pause playback
- `seek(time)` - Seek to position
- `setVolume(volume)` - Set volume (0-1)
- `toggleMute()` - Toggle mute
- `next()` - Play next song
- `previous()` - Play previous song
- `loadSong(song)` - Load and play song
- `setQueue(songs, index)` - Set playback queue

#### AuthContext
Manages authentication state and user session.

**State:**
```typescript
{
  user: User | null;
  loading: boolean;
}
```

**Actions:**
- `signUp(email, password)` - Register new user
- `signIn(email, password)` - Login user
- `signInWithGoogle()` - Google OAuth login
- `signOut()` - Logout user

#### SearchContext
Manages global search state and history.

**State:**
```typescript
{
  query: string;
  isOpen: boolean;
  activeFilter: 'all' | 'songs' | 'artists' | 'albums' | 'playlists';
  results: SearchResults;
  isLoading: boolean;
  searchHistory: SearchHistoryItem[];
}
```

**Actions:**
- `openSearch()` - Open search overlay
- `closeSearch()` - Close search overlay
- `setQuery(query)` - Update search query
- `setActiveFilter(filter)` - Change filter
- `performSearch()` - Execute search
- `clearHistory()` - Clear search history

## Backend Architecture

### Directory Structure

```
backend/
├── src/
│   ├── controllers/              # Request handlers
│   │   ├── authController.ts
│   │   ├── songController.ts
│   │   ├── playlistController.ts
│   │   ├── favoritesController.ts
│   │   ├── searchController.ts
│   │   └── userController.ts
│   │
│   ├── models/                   # Mongoose models
│   │   ├── User.ts
│   │   ├── Song.ts
│   │   ├── Playlist.ts
│   │   └── Favorite.ts
│   │
│   ├── routes/                   # Express routes
│   │   ├── auth.ts
│   │   ├── songs.ts
│   │   ├── playlists.ts
│   │   ├── favorites.ts
│   │   ├── search.ts
│   │   └── users.ts
│   │
│   ├── services/                 # Business logic
│   │   ├── fingerprintService.ts
│   │   ├── storageService.ts
│   │   ├── metadataService.ts
│   │   └── searchService.ts
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts              # JWT verification
│   │   ├── errorHandler.ts      # Error handling
│   │   └── playlistPermissions.ts
│   │
│   ├── config/                   # Configuration
│   │   ├── db.ts                # MongoDB connection
│   │   ├── firebase.ts          # Firebase Admin
│   │   └── storage.ts           # R2 client
│   │
│   └── index.ts                  # Entry point
│
└── package.json
```

### Key Services

#### FingerprintService
Generates audio fingerprints for duplicate detection.

**Methods:**
- `generateFingerprint(buffer)` - Generate acoustic fingerprint using Chromaprint
- `checkDuplicate(fingerprint)` - Check if fingerprint exists in database

**Implementation:**
```typescript
// Uses Chromaprint (fpcalc) for acoustic fingerprinting
// Falls back to SHA-256 hash if fpcalc fails
```

#### StorageService
Manages file uploads and retrieval from Cloudflare R2.

**Methods:**
- `uploadFile(buffer, key, mimeType)` - Upload file to R2
- `getFile(key)` - Retrieve file from R2
- `deleteFile(key)` - Delete file from R2

#### MetadataService
Extracts metadata from audio files.

**Methods:**
- `extractMetadata(buffer)` - Extract title, artist, album, year, genre, duration
- `cleanMetadata(metadata)` - Remove URLs and clean text

**Uses:** `music-metadata` library

#### SearchService
Implements search functionality across all content types.

**Methods:**
- `searchSongs(query, userId, limit, offset)` - Search songs
- `searchArtists(query, userId)` - Search and group by artist
- `searchAlbums(query, userId)` - Search and group by album
- `searchPlaylists(query, userId, limit, offset)` - Search playlists

## PWA Implementation

### Service Worker
Location: `frontend/public/sw.js`

**Caching Strategies:**

1. **Cache-First** (Static Assets & Audio)
   - Static files: HTML, CSS, JS, images
   - Audio files: MP3, FLAC, WAV, etc.
   - Serves from cache, updates in background

2. **Network-First** (API Requests)
   - API calls to backend
   - Falls back to cache when offline
   - 5-minute cache TTL

3. **Stale-While-Revalidate** (Dynamic Content)
   - Page content
   - Returns cached version immediately
   - Updates cache in background

**Background Sync:**
- Queues offline actions (favorites, playlist changes)
- Syncs automatically when connection restored
- Retry logic with exponential backoff

### IndexedDB Schema
Location: `frontend/lib/offline/indexedDB.ts`

**Object Stores:**

1. **songs** - Song metadata
   ```typescript
   {
     id: string;
     title: string;
     artist: string;
     album?: string;
     fileUrl: string;
     isOffline: boolean;
     downloadedAt?: number;
     playCount: number;
   }
   ```

2. **offlineSongs** - Audio file blobs
   ```typescript
   {
     id: string;
     audioBlob: Blob;
     downloadedAt: number;
     size: number;
   }
   ```

3. **playlists** - Playlist data
   ```typescript
   {
     id: string;
     name: string;
     songs: string[];
     isOffline: boolean;
   }
   ```

4. **favorites** - Favorite songs
   ```typescript
   {
     songId: string;
     addedAt: number;
     synced: boolean;
   }
   ```

5. **syncQueue** - Pending sync actions
   ```typescript
   {
     id: string;
     type: 'favorite' | 'unfavorite' | 'playlist-update';
     data: any;
     timestamp: number;
     retryCount: number;
   }
   ```

### Download Manager
Location: `frontend/lib/offline/downloadManager.ts`

**Features:**
- Concurrent download management (max 3 simultaneous)
- Progress tracking with callbacks
- Queue prioritization
- Storage quota checking
- LRU cache eviction
- Retry logic for failed downloads

**Usage:**
```typescript
import { downloadManager } from '@/lib/offline/downloadManager';

// Download a song
await downloadManager.queueDownload(
  songId,
  title,
  artist,
  fileUrl,
  priority,
  (progress) => {
    console.log(`Progress: ${progress.progress}%`);
  }
);

// Check if song is offline
const isOffline = await downloadManager.isSongOffline(songId);

// Get storage stats
const stats = await downloadManager.getStorageStats();
```

## Database Schema

### User Model
```typescript
{
  uid: string;              // Firebase UID (unique)
  email: string;            // User email (unique)
  displayName?: string;     // Display name
  bio?: string;             // User bio
  avatarUrl?: string;       // Avatar URL
  googleId?: string;        // Google account ID
  googleEmail?: string;     // Google email
  authProviders: string[];  // ['email', 'google']
  createdAt: Date;
  updatedAt: Date;
}
```

### Song Model
```typescript
{
  title: string;
  artist: string;
  album?: string;
  year?: number;
  genre?: string[];
  duration?: number;
  fileKey: string;          // R2 storage key (unique)
  mimeType: string;
  fingerprint: string;      // Audio fingerprint (indexed)
  uploadedBy: ObjectId;     // User reference
  createdAt: Date;
}
```

### Playlist Model
```typescript
{
  name: string;
  description?: string;
  ownerId: string;          // User UID
  userId: string;           // User UID (for backwards compatibility)
  songIds: ObjectId[];      // Song references
  visibility: 'private' | 'shared' | 'public';
  collaborators: string[];  // User UIDs
  followers: string[];      // User UIDs
  createdAt: Date;
  updatedAt: Date;
}
```

### Favorite Model
```typescript
{
  userId: string;           // User UID
  songId: ObjectId;         // Song reference
  createdAt: Date;
}
// Compound unique index on (userId, songId)
```

## API Reference

### Authentication Endpoints

**POST /auth/register**
```typescript
Request: { email: string; password: string }
Response: { user: User; token: string }
```

**POST /auth/login**
```typescript
Request: { email: string; password: string }
Response: { user: User; token: string }
```

### Song Endpoints

**POST /songs/upload**
```typescript
Headers: { Authorization: 'Bearer <token>' }
Body: FormData {
  file: File;
  title?: string;
  artist?: string;
  album?: string;
}
Response: { song: Song; metadata: AudioMetadata }
```

**GET /songs/:id/stream**
```typescript
Headers: { 
  Authorization: 'Bearer <token>';
  Range?: 'bytes=0-1023';
}
Response: Audio stream (206 Partial Content or 200 OK)
```

### Playlist Endpoints

**GET /playlists**
```typescript
Headers: { Authorization: 'Bearer <token>' }
Response: { playlists: Playlist[] }
```

**POST /playlists**
```typescript
Headers: { Authorization: 'Bearer <token>' }
Body: { name: string; description?: string }
Response: { playlist: Playlist }
```

**PUT /playlists/:id/visibility**
```typescript
Headers: { Authorization: 'Bearer <token>' }
Body: { visibility: 'private' | 'shared' | 'public' }
Response: { playlist: Playlist }
```

**POST /playlists/:id/collaborators**
```typescript
Headers: { Authorization: 'Bearer <token>' }
Body: { userId: string }
Response: { playlist: Playlist }
```

### Search Endpoint

**GET /search**
```typescript
Headers: { Authorization: 'Bearer <token>' }
Query: {
  q: string;
  filter?: 'all' | 'songs' | 'artists' | 'albums' | 'playlists';
  limit?: number;
  offset?: number;
}
Response: {
  songs: Song[];
  artists: { name: string; songCount: number }[];
  albums: { name: string; artist: string; songCount: number }[];
  playlists: Playlist[];
}
```

## Development Workflow

### Adding a New Feature

1. **Create Spec** (Optional but recommended)
   ```bash
   mkdir .kiro/specs/feature-name
   # Create requirements.md, design.md, tasks.md
   ```

2. **Backend Implementation**
   - Create model in `backend/src/models/`
   - Create controller in `backend/src/controllers/`
   - Create routes in `backend/src/routes/`
   - Add service logic if needed
   - Update `backend/src/index.ts`

3. **Frontend Implementation**
   - Create page in `frontend/app/`
   - Create components in `frontend/components/`
   - Add context if needed in `frontend/contexts/`
   - Update API client in `frontend/lib/api.ts`

4. **Testing**
   - Write unit tests
   - Test manually
   - Check accessibility

5. **Documentation**
   - Update README.md
   - Update DEVELOPER.md
   - Add JSDoc comments

### Code Style

**TypeScript**
- Use strict mode
- Explicit return types for functions
- Interface over type for objects
- Descriptive variable names

**React**
- Functional components with hooks
- Props interface for each component
- Use Context for global state
- Memoize expensive computations

**Naming Conventions**
- Components: PascalCase (`AudioPlayer.tsx`)
- Files: camelCase (`audioPlayer.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Functions: camelCase (`getUserProfile`)

## Testing

### Unit Tests
```bash
# Run all tests
pnpm test

# Run frontend tests
pnpm test:frontend

# Run backend tests
pnpm test:backend

# Watch mode
pnpm test:watch
```

### Manual Testing Checklist

- [ ] Upload song (single and bulk)
- [ ] Play/pause/seek
- [ ] Volume control and mute
- [ ] Create/edit/delete playlist
- [ ] Add/remove favorites
- [ ] Search functionality
- [ ] Offline download
- [ ] PWA installation
- [ ] Keyboard shortcuts
- [ ] Mobile responsiveness
- [ ] Accessibility (screen reader)

## Deployment

### Environment Variables

**Production Frontend**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

**Production Backend**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=...
R2_ACCOUNT_ID=...
```

### Deployment Steps

**Frontend (Vercel)**
1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

**Backend (Render)**
1. Create Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && pnpm install && pnpm build`
4. Set start command: `cd backend && pnpm start`
5. Configure environment variables
6. Deploy

### Monitoring

- Check Vercel analytics for frontend
- Monitor Render logs for backend
- Set up error tracking (Sentry)
- Monitor MongoDB Atlas metrics
- Check R2 storage usage

## Troubleshooting

### Common Issues

**Service Worker not updating**
```javascript
// Force update
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
});
```

**IndexedDB quota exceeded**
```javascript
// Check quota
navigator.storage.estimate().then(estimate => {
  console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
});
```

**Audio not playing**
- Check CORS headers on R2
- Verify Firebase token is valid
- Check browser console for errors

**Build errors**
- Clear `.next` folder
- Delete `node_modules` and reinstall
- Check TypeScript errors

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Write tests
5. Update documentation
6. Submit pull request

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Mantine UI](https://mantine.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Last Updated:** November 2025
