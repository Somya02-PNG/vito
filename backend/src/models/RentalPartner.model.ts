import mongoose, { Schema, Document, Types } from 'mongoose';

export type PartnerBusinessModelType = 'INDIVIDUAL_OWNER' | 'RENTAL_AGENCY' | 'FLEET_OPERATOR';
export type RentalPartnerVerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';

export interface IRentalPartner extends Document {
  partnerId: string;
  userId: Types.ObjectId;
  partnerType: PartnerBusinessModelType;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  businessRegistrationNumber?: string;
  panNumber?: string;
  gstNumber?: string;
  identityProofDocId?: string;
  businessProofDocId?: string;
  verificationStatus: RentalPartnerVerificationStatus;
  rejectionReason?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  fleetCount: number;
  walletBalance: number;
  totalEarnings: number;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RentalPartnerSchema = new Schema<IRentalPartner>(
  {
    partnerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    partnerType: {
      type: String,
      enum: ['INDIVIDUAL_OWNER', 'RENTAL_AGENCY', 'FLEET_OPERATOR'],
      default: 'INDIVIDUAL_OWNER',
    },
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: 'Delhi NCR',
    },
    state: {
      type: String,
      trim: true,
      default: 'Delhi',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    businessRegistrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    panNumber: {
      type: String,
      trim: true,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    identityProofDocId: {
      type: String,
      default: '',
    },
    businessProofDocId: {
      type: String,
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
      enum: ['pending', 'under_review', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: String,
      default: '',
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
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
