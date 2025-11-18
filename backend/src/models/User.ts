import { Schema, model, Document } from 'mongoose';

export interface IUserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: boolean;
}

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  googleId?: string;
  authProviders: ('email' | 'google')[];
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: false,
  },
  bio: {
    type: String,
    required: false,
    maxlength: 500,
  },
  avatarUrl: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    required: false,
    sparse: true, // Allows multiple null values but unique non-null values
  },
  authProviders: {
    type: [String],
    enum: ['email', 'google'],
    default: ['email'],
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      default: 'en',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index for searching users
userSchema.index({ displayName: 1 });
// Note: email index is already created by unique: true constraint

export const User = model<IUser>('User', userSchema);
