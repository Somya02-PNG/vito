import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'customer' | 'driver' | 'admin';

export interface IUser extends Document {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[1-9]\d{6,14}$/, 'Please provide a valid phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'driver', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'customer',
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Exclude from queries by default
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
