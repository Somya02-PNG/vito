import mongoose, { Schema, Document, Types } from 'mongoose';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface IDriver extends Document {
  userId: Types.ObjectId;
  licenseNumber: string;
  experience: number; // years
  city: string;
  profileImage: string;
  verificationStatus: VerificationStatus;
  rating: number;
  hourlyRate: number;
  availability: boolean;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Experience (in years) is required'],
      min: [0, 'Experience cannot be negative'],
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'rejected', 'suspended'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'pending',
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    walletBalance: {
      type: Number,
      default: 12480,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
DriverSchema.index({ verificationStatus: 1 });
DriverSchema.index({ availability: 1 });
DriverSchema.index({ rating: -1 });
DriverSchema.index({ city: 1 });

const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
export default Driver;
