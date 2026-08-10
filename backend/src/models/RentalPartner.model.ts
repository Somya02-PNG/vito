import mongoose, { Schema, Document, Types } from 'mongoose';

export type RentalPartnerVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface IRentalPartner extends Document {
  userId: Types.ObjectId;
  businessName: string;
  city: string;
  fleetCount: number;
  profileImage: string;
  verificationStatus: RentalPartnerVerificationStatus;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const RentalPartnerSchema = new Schema<IRentalPartner>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    fleetCount: {
      type: Number,
      default: 0,
      min: [0, 'Fleet count cannot be negative'],
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
    walletBalance: {
      type: Number,
      default: 0,
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
RentalPartnerSchema.index({ verificationStatus: 1 });
RentalPartnerSchema.index({ city: 1 });

const RentalPartner = mongoose.model<IRentalPartner>('RentalPartner', RentalPartnerSchema);
export default RentalPartner;
