
# Online Music Player – Implementation Plan & System Design

This document outlines the full technical implementation and architecture for a Spotify-like music streaming web app using a JavaScript-based stack.

---

## 🌐 Tech Stack

### Frontend

- **Framework**: Next.js (React + SSR)
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Audio Playback**: HTML5 `<audio>` tag

### Backend

- **Server**: Node.js with Express.js
- **Database**: MongoDB Atlas (via Mongoose)
- **Authentication Verification**: Firebase Admin SDK
- **Audio Fingerprinting**: Chromaprint + fpcalc
- **Cloud Storage**: Cloudflare R2 (S3-compatible)
- **File Upload**: multer middleware

### Dev Tools

- **TypeScript**
- **ESLint & Prettier**
- **Nodemon** for development

---

## 🔐 Authentication Flow

- Users register/login using Firebase Auth.
- On successful login, frontend receives a Firebase ID Token.
- Token is sent with each backend request in headers.
- Backend verifies token using Firebase Admin SDK.

---

## 🧠 Core Features & Endpoints

### 1. User Auth (Firebase)

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| POST   | /auth/signup     | Register a new user      |
| POST   | /auth/verify     | Verify ID token from client |

### 2. Songs

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| POST   | /songs/upload    | Upload song (local file) |
| GET    | /songs/:id       | Stream song by ID        |

- On upload:
  - Generate audio fingerprint.
  - Check for duplicates in DB.
  - Upload to Cloudflare R2 if unique.
  - Store metadata + fingerprint.

### 3. Playlists

| Method | Endpoint             | Description                    |
|--------|----------------------|--------------------------------|
| GET    | /playlists           | Fetch user playlists           |
| POST   | /playlists           | Create new playlist            |
| PUT    | /playlists/:id       | Update playlist songs          |
| DELETE | /playlists/:id       | Delete playlist                |

---

## 🧰 File Upload & Storage Flow

1. Client uploads audio via form (multipart).
2. Server uses `multer` to read file buffer.
3. Run `fpcalc` on buffer to get fingerprint.
4. Check MongoDB for duplicate fingerprint.
5. If unique:
    - Upload to Cloudflare R2 using AWS SDK.
    - Save song metadata + fingerprint to MongoDB.

---

## 🧪 Audio Streaming Flow

- Audio files stored in R2 are streamed via:
  - `GET /songs/:id`
  - Server fetches object from R2 using AWS SDK.
  - Sends `206 Partial Content` for HTML5 streaming support.
- Client uses `<audio src="/songs/:id" controls />`

---

## 🗃️ Data Models

### User

```ts
{
  uid: string,
  email: string,
  createdAt: Date
}
```

### Song

```ts
{
  _id: ObjectId,
  title: string,
  artist: string,
  fileKey: string,
  mimeType: string,
  uploadedBy: ObjectId,
  fingerprint: string
}
```

### Playlist

```ts
{
  _id: ObjectId,
  name: string,
  userId: ObjectId,
  songIds: ObjectId[],
  createdAt: Date
}
```

---

## 🚀 Deployment Plan

### Backend

- Host on **Render** (Free Plan)
- Environment variables for DB, R2, Firebase
- Auto-deploy via GitHub

### Frontend

- Host on **Vercel**
- Connect to backend via environment URL
- Auto-deploy from GitHub repo

---

## 🔒 Optional: Admin Role

- Add `role` field to user
- Use middleware to restrict access to admin-only routes (e.g. song deletion)

---

## ⚙️ Scalability Notes

- Stateless API design (JWT-based)
- CDN-backed audio via R2
- MongoDB Atlas scales vertically
- Frontend served globally via Vercel CDN

---

## 📁 Folder Structure

```
spotify-clone-backend/
├── config/
│   ├── db.js
│   └── firebase.js
├── src/
│   ├── index.js
│   ├── routes/
│   ├── controllers/
│   └── models/
├── .env.example
├── package.json
└── README.md
```

---

## ✅ MVP Milestones

- [ ] Project setup with Express + TypeScript
- [ ] Firebase Auth integration
- [ ] File upload & fingerprinting
- [ ] Song storage on Cloudflare R2
- [ ] Basic playlist management
- [ ] Frontend audio player UI
- [ ] Full integration & deployment

---
