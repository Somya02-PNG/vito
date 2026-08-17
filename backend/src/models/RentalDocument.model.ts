import mongoose, { Schema, Document, Types } from 'mongoose';

export type DocumentOwnerType = 'CUSTOMER' | 'VEHICLE' | 'BOOKING';

export type RentalDocumentType =
  | 'CUSTOMER_ID'
  | 'DRIVING_LICENSE_FRONT'
  | 'DRIVING_LICENSE_BACK'
  | 'VEHICLE_RC'
  | 'VEHICLE_INSURANCE'
  | 'PUC'
  | 'FITNESS'
  | 'PERMIT'
  | 'RENTAL_AGREEMENT'
  | 'HANDOVER_REPORT'
  | 'RETURN_REPORT'
  | 'FINAL_INVOICE';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRING_SOON' | 'EXPIRED';

export interface IRentalDocument extends Document {
  ownerType: DocumentOwnerType;
  ownerId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  vehicleId?: Types.ObjectId;
  documentType: RentalDocumentType;
  documentName: string;
  fileId: string;
  fileUrl?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  status: DocumentStatus;
  issuedAt?: Date;
  expiresAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationMethod: 'DEMO_AI' | 'MANUAL_OPERATOR' | 'DIGITAL_ID' | 'SYSTEM_AUTO';
  maskedIdentifier: string;        // e.g. "DL-XXXX-XXXX-4821", "AADHAAR-XXXX-XXXX-9021"
  rejectionReason?: string;
  isDemo: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const RentalDocumentSchema = new Schema<IRentalDocument>(
  {
    ownerType: {
      type: String,
      enum: ['CUSTOMER', 'VEHICLE', 'BOOKING'],
      required: true,
    },
    ownerId: { type: Schema.Types.ObjectId, required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'RentalBooking' },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    documentType: {
      type: String,
      enum: [
        'CUSTOMER_ID',
        'DRIVING_LICENSE_FRONT',
        'DRIVING_LICENSE_BACK',
        'VEHICLE_RC',
        'VEHICLE_INSURANCE',
        'PUC',
        'FITNESS',
        'PERMIT',
        'RENTAL_AGREEMENT',
        'HANDOVER_REPORT',
        'RETURN_REPORT',
        'FINAL_INVOICE',
      ],
      required: true,
    },
    documentName: { type: String, required: true, trim: true },
    fileId: { type: String, required: true },
    fileUrl: { type: String, default: '' },
    mimeType: { type: String, default: 'image/jpeg' },
    fileSizeBytes: { type: Number, default: 245000 },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRING_SOON', 'EXPIRED'],
      default: 'PENDING',
    },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, default: 'VITO Instant Verify AI' },
    verificationMethod: {
      type: String,
      enum: ['DEMO_AI', 'MANUAL_OPERATOR', 'DIGITAL_ID', 'SYSTEM_AUTO'],
      default: 'DEMO_AI',
    },
    maskedIdentifier: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    isDemo: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

RentalDocumentSchema.index({ ownerType: 1, ownerId: 1, documentType: 1 });
RentalDocumentSchema.index({ vehicleId: 1, status: 1 });
RentalDocumentSchema.index({ expiresAt: 1 });

const RentalDocument = mongoose.model<IRentalDocument>('RentalDocument', RentalDocumentSchema);
export default RentalDocument;
