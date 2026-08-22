import mongoose, { Schema, Document, Types } from 'mongoose';

export type VehicleDocType =
  | 'RC'
  | 'INSURANCE'
  | 'PUC'
  | 'FITNESS'
  | 'PERMIT'
  | 'OWNERSHIP_PROOF'
  | 'AUTHORIZATION_LETTER'
  | 'OTHER';

export type VehicleDocVerificationStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface IVehicleDocument extends Document {
  vehicleId: Types.ObjectId;
  partnerId: Types.ObjectId;
  documentType: VehicleDocType;
  documentName: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
  expiresAt?: Date;
  verificationStatus: VehicleDocVerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  maskedIdentifier?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleDocumentSchema = new Schema<IVehicleDocument>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'RentalPartner',
      required: [true, 'Partner reference is required'],
    },
    documentType: {
      type: String,
      enum: ['RC', 'INSURANCE', 'PUC', 'FITNESS', 'PERMIT', 'OWNERSHIP_PROOF', 'AUTHORIZATION_LETTER', 'OTHER'],
      required: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    verificationStatus: {
      type: String,
      enum: ['UPLOADED', 'PROCESSING', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    maskedIdentifier: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

VehicleDocumentSchema.index({ vehicleId: 1, documentType: 1 });
VehicleDocumentSchema.index({ partnerId: 1 });
VehicleDocumentSchema.index({ verificationStatus: 1 });
VehicleDocumentSchema.index({ expiresAt: 1 });

const VehicleDocument = mongoose.model<IVehicleDocument>('VehicleDocument', VehicleDocumentSchema);
export default VehicleDocument;
