import { Schema, model, Document, Types } from 'mongoose';

export interface IFavorite extends Document {
  userId: string; // Firebase UID
  songId: Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
  userId: {
    type: String, // Firebase UID
    required: true,
    index: true,
  },
  songId: {
    type: Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index to prevent duplicate favorites
favoriteSchema.index({ userId: 1, songId: 1 }, { unique: true });

// Index for efficient queries (get user favorites sorted by date)
favoriteSchema.index({ userId: 1, createdAt: -1 });

// Index for favorite count queries
favoriteSchema.index({ songId: 1 });

export const Favorite = model<IFavorite>('Favorite', favoriteSchema);
