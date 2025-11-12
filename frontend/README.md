# Online Music Player - Frontend

Next.js frontend application for the Online Music Player.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project configured
- Backend API running

### Local Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create `firebase-config.json` in the frontend root with your Firebase credentials:
```json
{
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "your-sender-id",
  "appId": "your-app-id",
  "measurementId": "your-measurement-id"
}
```

3. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel.

### Quick Deployment Steps

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Required Environment Variables for Production

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID

## Project Structure

```
frontend/
├── app/              # Next.js app directory (pages and layouts)
├── components/       # React components
├── lib/             # Utility functions and Firebase config
├── public/          # Static assets
├── firebase-config.json  # Firebase config (local only, not committed)
└── DEPLOYMENT.md    # Deployment guide
```

## Features

- User authentication with Firebase
- Music player interface
- Playlist management
- Song upload and management
- Responsive design with Tailwind CSS

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Firebase Authentication
- Tailwind CSS

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Deployment Guide](./DEPLOYMENT.md)
