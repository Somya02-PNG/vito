import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'customer' | 'partner' | 'driver' | 'admin';
// NOTE: 'driver' is kept for backward compatibility with existing seeded data.
// New partner registrations use role='partner' + partnerType.

export type UserStatus = 'active' | 'pending' | 'suspended' | 'blocked';
export type PartnerType = 'driver' | 'rental_partner';

export interface IUser extends Document {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  partnerType: PartnerType | null;
  status: UserStatus;
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
        values: ['customer', 'partner', 'driver', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'customer',
    },
    partnerType: {
      type: String,
      enum: {
        values: ['driver', 'rental_partner'],
        message: '{VALUE} is not a valid partner type',
      },
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'pending', 'suspended', 'blocked'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
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
UserSchema.index({ status: 1 });
UserSchema.index({ partnerType: 1 });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
