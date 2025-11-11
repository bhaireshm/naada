import { Schema, model, Document, Types } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  userId: Types.ObjectId;
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
    type: Schema.Types.ObjectId,
    ref: 'User',
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

export const Playlist = model<IPlaylist>('Playlist', playlistSchema);
