import { Schema, model, Document, Types } from 'mongoose';

export interface ISong extends Document {
  title: string;
  artist: string;
  fileKey: string;
  mimeType: string;
  uploadedBy: Types.ObjectId;
  fingerprint: string;
  createdAt: Date;
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
    type: Schema.Types.ObjectId,
    ref: 'User',
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
});

export const Song = model<ISong>('Song', songSchema);
