import mongoose, { Schema, Document, Types } from 'mongoose';

export type CustomerVehicleVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface ICustomerVehicleDocument {
  documentType: 'RC' | 'INSURANCE' | 'PUC' | 'OTHER';
  documentNumber?: string;
  storagePath: string;
  fileName: string;
  verificationStatus: CustomerVehicleVerificationStatus;
  uploadedAt: Date;
  expiresAt?: Date;
}

export interface ICustomerVehicle extends Document {
  customerId: Types.ObjectId;
  make: string;
  vehicleModel: string;
  variant?: string;
  registrationNumber: string;
  registrationState?: string;
  year?: number;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'cng' | 'hybrid';
  transmission: 'manual' | 'automatic';
  seatingCapacity: number;
  color?: string;
  imageUrl?: string;
  verificationStatus: CustomerVehicleVerificationStatus;
  isDefault: boolean;
  documents: ICustomerVehicleDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerVehicleDocumentSchema = new Schema<ICustomerVehicleDocument>(
  {
    documentType: {
      type: String,
      enum: ['RC', 'INSURANCE', 'PUC', 'OTHER'],
      required: true,
    },
    documentNumber: { type: String, trim: true },
    storagePath: { type: String, required: true },
    fileName: { type: String, default: 'document' },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'VERIFIED',
    },
    uploadedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { _id: true }
);

const CustomerVehicleSchema = new Schema<ICustomerVehicle>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      uppercase: true,
    },
    registrationState: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1990,
      max: new Date().getFullYear() + 1,
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'cng', 'hybrid'],
      default: 'petrol',
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic'],
      default: 'manual',
    },
    seatingCapacity: {
      type: Number,
      default: 5,
      min: 2,
      max: 12,
    },
    color: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'VERIFIED',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    documents: [CustomerVehicleDocumentSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of registration number per customer
CustomerVehicleSchema.index({ customerId: 1, registrationNumber: 1 });

const CustomerVehicle = mongoose.model<ICustomerVehicle>('CustomerVehicle', CustomerVehicleSchema);
export default CustomerVehicle;
