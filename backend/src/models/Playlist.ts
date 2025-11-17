import { Schema, model, Document, Types } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  userId: string; // Firebase UID
  songIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: String, // Firebase UID
    required: true,
  },
  songIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Song',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add compound index for search optimization
playlistSchema.index({ name: 1, userId: 1 });

export const Playlist = model<IPlaylist>('Playlist', playlistSchema);
