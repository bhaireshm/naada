# 🚀 Quick Start Guide

Get the Music Player up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- MongoDB running (local or Atlas)
- Firebase project created
- Cloudflare R2 bucket (or S3-compatible storage)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd music-player

# Install dependencies
pnpm install
```

## Step 2: Configure Environment

### Backend Configuration

Create `backend/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/music-player
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=music-player-storage
```

### Frontend Configuration

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Step 3: Start Development Servers

```bash
# Start both frontend and backend
pnpm dev
```

This will start:
- Backend API on http://localhost:3001
- Frontend app on http://localhost:3000

## Step 4: Create Your First Account

1. Open http://localhost:3000
2. Click "Sign Up"
3. Enter email and password
4. You're in!

## Step 5: Upload Your First Song

1. Go to Library page
2. Click "Upload" button
3. Select an audio file (MP3, FLAC, WAV, etc.)
4. Metadata is extracted automatically
5. Click to play!

## 🎉 You're Ready!

### What's Next?

- **Create Playlists** - Organize your music
- **Mark Favorites** - Quick access to loved songs
- **Try Keyboard Shortcuts** - Press Ctrl/Cmd+/ to see all
- **Install as App** - Click install prompt for PWA
- **Download for Offline** - Click download icon on songs
- **Explore Discovery** - Find public playlists

### Common Commands

```bash
# Development
pnpm dev              # Start both servers
pnpm dev:frontend     # Frontend only
pnpm dev:backend      # Backend only

# Build
pnpm build            # Build both
pnpm build:frontend   # Build frontend
pnpm build:backend    # Build backend

# Production
pnpm start            # Start production servers
```

### Keyboard Shortcuts

- **Space** - Play/Pause
- **→** - Next song
- **←** - Previous song
- **↑/↓** - Volume up/down
- **M** - Mute
- **Ctrl/Cmd+K** - Search
- **Ctrl/Cmd+/** - Show shortcuts
- **Esc** - Close modals

### Troubleshooting

**Port already in use?**
```bash
# Change ports in .env files
# Backend: PORT=3002
# Frontend: (Next.js will auto-increment)
```

**MongoDB connection failed?**
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/music-player
```

**Firebase errors?**
- Check Firebase console for correct credentials
- Enable Email/Password and Google auth providers
- Add localhost to authorized domains

**Audio not playing?**
- Check R2 CORS settings
- Verify file was uploaded successfully
- Check browser console for errors

### Need Help?

- 📖 Read the full [README.md](README.md)
- 🛠️ Check [DEVELOPER.md](DEVELOPER.md) for technical details
- 🐛 Open an issue on GitHub
- 💬 Check existing issues for solutions

---

**Happy Listening! 🎵**
