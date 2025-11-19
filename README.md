# 🎵 Naada

A modern, full-featured Progressive Web App (PWA) for managing and streaming your personal music collection with offline support.

**Naada** (ನಾದ) means "sound" or "music" in Sanskrit and Kannada.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎼 Core Music Features

- **Music Library Management** - Upload, organize, and manage your music collection
- **Smart Playback** - Queue management, next/previous, shuffle, and repeat
- **Favorites** - Mark songs as favorites for quick access
- **Playlists** - Create, edit, and manage custom playlists (up to 25 per user)
- **Volume Control** - Precise volume control with mute functionality
- **Audio Fingerprinting** - Automatic duplicate detection on upload

### 🔍 Discovery & Search

- **Global Search** - Search across songs, artists, albums, and playlists
- **Keyboard Shortcuts** - Quick search with Ctrl/Cmd+K
- **Filter by Artist/Album** - Browse your library by artist or album
- **Discover Page** - Explore public playlists from other users
- **Search History** - Quick access to recent searches

### 👥 Sharing & Collaboration

- **Playlist Sharing** - Share playlists as private, shared, or public
- **Collaborators** - Add collaborators to edit playlists together
- **Follow Playlists** - Follow public playlists from other users
- **User Profiles** - Customize your profile with avatar and bio

### 📱 Progressive Web App (PWA)

- **Offline Mode** - Download songs for offline playback
- **Install as App** - Install on any device (desktop, mobile, tablet)
- **Background Sync** - Automatic sync when connection restored
- **Push Notifications** - Get notified of updates
- **App Shortcuts** - Quick access to Library, Playlists, Favorites

### ⌨️ Keyboard Shortcuts

- **Space** - Play/Pause
- **→** - Next song
- **←** - Previous song
- **↑** - Increase volume
- **↓** - Decrease volume
- **M** - Mute/Unmute
- **Ctrl/Cmd+K** - Open search
- **Ctrl/Cmd+/** - Show all shortcuts
- **Esc** - Close modals/overlays

### 🔐 Authentication

- **Email/Password** - Traditional authentication
- **Google Sign-In** - Quick OAuth authentication
- **Account Linking** - Link Google account to existing account

### ♿ Accessibility

- **Screen Reader Support** - Full ARIA labels and live regions
- **Keyboard Navigation** - Complete keyboard accessibility
- **High Contrast** - Readable colors and proper contrast ratios
- **Focus Indicators** - Clear focus states for all interactive elements

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB database
- Firebase project (for authentication)
- Cloudflare R2 or S3-compatible storage
- Chromaprint (fpcalc) for audio fingerprinting

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd music-player
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env)**

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/music-player
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
```

**Frontend (.env.local)**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

4. **Start the development servers**

```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm dev:backend  # Backend on port 3001
pnpm dev:frontend # Frontend on port 3000
```

5. **Access the application**

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:3001>

## 📖 User Guide

### Getting Started

1. **Sign Up/Login**
   - Create an account with email/password or Google
   - Access your personalized music library

2. **Upload Music**
   - Click "Upload" in the Library page
   - Select audio files (MP3, FLAC, WAV, etc.)
   - Metadata is automatically extracted
   - Duplicates are detected automatically

3. **Play Music**
   - Click any song to start playback
   - Use the player controls at the bottom
   - Queue is automatically managed

### Managing Your Library

**Library Page** (`/library`)

- View all your uploaded songs
- Search and filter by artist/album
- Play songs, add to playlists, mark as favorites
- Bulk upload multiple songs

**Favorites Page** (`/favorites`)

- Quick access to your favorite songs
- Click the heart icon on any song to add/remove

**Playlists Page** (`/playlists`)

- Create up to 25 playlists
- View your playlists and followed playlists
- Manage playlist visibility (private/shared/public)

### Search & Discovery

**Global Search** (Ctrl/Cmd+K)

- Search across all your music
- Filter by Songs, Artists, Albums, or Playlists
- Navigate with arrow keys, select with Enter
- View search history

**Discover Page** (`/discover`)

- Explore public playlists from other users
- Follow playlists you like
- Search public playlists

### Offline Mode

**Download for Offline**

1. Click the download icon next to any song
2. Wait for download to complete
3. Song is now available offline

**Manage Offline Storage** (`/offline`)

- View all downloaded songs
- Check storage usage
- Remove songs to free up space
- Clear all offline data

**Install as App**

- Click "Install" when prompted
- Or use browser menu: "Install Music Player"
- Access from home screen/desktop

### Sharing & Collaboration

**Share a Playlist**

1. Open playlist details
2. Click "Share" button
3. Set visibility (Private/Shared/Public)
4. Add collaborators by email
5. Copy share link

**Follow a Playlist**

1. Go to Discover page
2. Find a public playlist
3. Click "Follow"
4. Access from "Followed Playlists" tab

### Profile & Settings

**Profile Page** (`/profile`)

- Update display name and bio
- Change avatar
- View your statistics
- See your public playlists

**Settings Page** (`/settings`)

- Theme preferences (Light/Dark/System)
- Notification settings
- Privacy settings
- Account management

## 🏗️ Architecture

### Tech Stack

**Frontend**

- Next.js 14 (App Router)
- React 18
- TypeScript
- Mantine UI v7
- Firebase Authentication
- Service Workers (PWA)
- IndexedDB (Offline Storage)

**Backend**

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Firebase Admin SDK
- Cloudflare R2 (S3-compatible)
- Chromaprint (Audio Fingerprinting)

### Project Structure

```
music-player/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   │   ├── library/        # Library page
│   │   ├── playlists/      # Playlists pages
│   │   ├── favorites/      # Favorites page
│   │   ├── discover/       # Discover page
│   │   ├── offline/        # Offline management
│   │   ├── profile/        # User profile
│   │   └── settings/       # Settings page
│   ├── components/          # React components
│   │   ├── AudioPlayer.tsx
│   │   ├── Navigation.tsx
│   │   ├── SearchOverlay.tsx
│   │   ├── InstallPrompt.tsx
│   │   ├── OfflineIndicator.tsx
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── AudioPlayerContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── SearchContext.tsx
│   │   └── FavoritesContext.tsx
│   ├── lib/                 # Utilities and services
│   │   ├── api.ts          # API client
│   │   ├── firebase.ts     # Firebase config
│   │   ├── offline/        # Offline functionality
│   │   │   ├── indexedDB.ts
│   │   │   ├── offlineStorage.ts
│   │   │   ├── downloadManager.ts
│   │   │   └── syncManager.ts
│   │   └── sw/             # Service worker utilities
│   └── public/
│       ├── sw.js           # Service worker
│       ├── manifest.json   # PWA manifest
│       └── icons/          # App icons
│
├── backend/                 # Express backend application
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── index.ts        # Entry point
│   └── package.json
│
└── .kiro/                   # Spec-driven development
    └── specs/              # Feature specifications
```

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start both frontend and backend
pnpm dev:frontend     # Start frontend only
pnpm dev:backend      # Start backend only

# Build
pnpm build            # Build both applications
pnpm build:frontend   # Build frontend
pnpm build:backend    # Build backend

# Production
pnpm start            # Start production servers
```

### API Endpoints

**Authentication**

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

**Songs**

- `POST /songs/upload` - Upload song
- `GET /songs` - Get all songs
- `GET /songs/:id` - Get song details
- `GET /songs/:id/stream` - Stream song audio
- `DELETE /songs/:id` - Delete song

**Playlists**

- `GET /playlists` - Get user playlists
- `POST /playlists` - Create playlist
- `GET /playlists/:id` - Get playlist details
- `PUT /playlists/:id` - Update playlist
- `DELETE /playlists/:id` - Delete playlist
- `PUT /playlists/:id/visibility` - Update visibility
- `POST /playlists/:id/collaborators` - Add collaborator
- `DELETE /playlists/:id/collaborators/:userId` - Remove collaborator
- `POST /playlists/:id/follow` - Follow playlist
- `DELETE /playlists/:id/follow` - Unfollow playlist

**Favorites**

- `GET /favorites` - Get user favorites
- `POST /favorites/:songId` - Add to favorites
- `DELETE /favorites/:songId` - Remove from favorites

**Search**

- `GET /search?q=query&filter=all` - Search music

**User**

- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/:id` - Get user by ID
- `GET /users/search?q=query` - Search users

## 🚢 Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure environment variables
4. Set build command: `cd backend && pnpm install && pnpm build`
5. Set start command: `cd backend && pnpm start`

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, React, and TypeScript**
