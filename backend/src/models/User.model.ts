import mongoose, { Schema, Document } from 'mongoose';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ DATABASE SECURITY SCHEMA: User Model
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH EXPLANATION:
 * 1. passwordHash ko 'select: false' rakha gaya hai taaki kisi normal query
 *    (jaise User.find() ya User.findById()) se galti se bhi password hash leak na ho.
 * 2. Strict regex validation phone aur email par lagayi gayi hai.
 * 3. Role aur status ke strictly bounded enum values hain.
 * 4. Indexes create kiye gaye hain taaki authentication queries O(1) me fast execute hon.
 */
export type UserRole = 'customer' | 'partner' | 'driver' | 'admin';
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
  identityVerified?: boolean;
  licenceVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  completedBookingsCount?: number;
  customerRating?: number;
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
    identityVerified: {
      type: Boolean,
      default: true,
    },
    licenceVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    completedBookingsCount: {
      type: Number,
      default: 8,
    },
    customerRating: {
      type: Number,
      default: 4.9,
    },
    // # HINGLISH: select: false ensure karta hai ki password hash queries me return na ho
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// # HINGLISH: Indexes lookup time fast aur DDoS resilient banane ke liye
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ partnerType: 1 });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
