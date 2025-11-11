import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  email: string;
  createdAt: Date;
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = model<IUser>('User', userSchema);
