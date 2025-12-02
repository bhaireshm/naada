import { Schema, model, Document } from 'mongoose';

export interface ISong extends Document {
  title: string;
  artist: string; // Primary artist (for display)
  artists?: string[]; // All artists (for search and filtering)
  album?: string;
  year?: string;
  genre?: string;
  albumArt?: string;
  duration?: number;
  lyrics?: string;
  fileKey: string;
  mimeType: string;
  uploadedBy: string; // Firebase UID
  fingerprint: string;
  createdAt: Date;
  // AI-enhanced metadata (optional)
  mood?: string; // AI-detected mood (e.g., 'happy', 'sad', 'energetic')
  aiGenres?: string[]; // AI-detected genres (can be more accurate than tags)
  energy?: number; // Energy level 0-1 (0 = calm, 1 = energetic)
}

const songSchema = new Schema<ISong>({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
  },
  artists: {
    type: [String],
    required: false,
  },
  album: {
    type: String,
    required: false,
  },
  year: {
    type: String,
    required: false,
  },
  genre: {
    type: String,
    required: false,
  },
  albumArt: {
    type: String,
    required: false,
  },
  duration: {
    type: Number,
    required: false,
  },
  lyrics: {
    type: String,
    required: false,
  },
  fileKey: {
    type: String,
    required: true,
    unique: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: String, // Firebase UID
    required: true,
  },
  fingerprint: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // AI-enhanced metadata fields (optional)
  mood: {
    type: String,
    required: false,
  },
  aiGenres: {
    type: [String],
    required: false,
  },
  energy: {
    type: Number,
    required: false,
    min: 0,
    max: 1,
  },
});

// Add indexes for search optimization
songSchema.index({ title: 1 });
songSchema.index({ artist: 1 });
songSchema.index({ artists: 1 });
songSchema.index({ album: 1 });
songSchema.index({ artist: 1, album: 1 });

export const Song = model<ISong>('Song', songSchema);
