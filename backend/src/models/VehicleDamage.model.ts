import mongoose, { Schema, Document, Types } from 'mongoose';

export type DamageType = 'SCRATCH' | 'DENT' | 'CRACK' | 'PAINT_DAMAGE' | 'TEAR' | 'OTHER';
export type DamageSeverity = 'MINOR' | 'MODERATE' | 'MAJOR';
export type DamageStatus = 'EXISTING' | 'REPORTED' | 'UNDER_REVIEW' | 'CONFIRMED' | 'REJECTED' | 'RESOLVED';

export interface IVehicleDamage extends Document {
  bookingId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  inspectionId?: Types.ObjectId;
  location: string;               // e.g. "Front Bumper", "Left Rear Door", "Windshield", "Roof"
  damageType: DamageType;
  severity: DamageSeverity;
  description: string;
  photoUrl?: string;
  photoFileId?: string;
  estimatedCost: number;
  confirmedCost?: number;
  status: DamageStatus;
  detectedStage: 'PRE_HANDOVER' | 'RETURN';
  isPreExisting: boolean;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleDamageSchema = new Schema<IVehicleDamage>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'RentalBooking', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    inspectionId: { type: Schema.Types.ObjectId, ref: 'VehicleInspection' },
    location: { type: String, required: true, trim: true },
    damageType: {
      type: String,
      enum: ['SCRATCH', 'DENT', 'CRACK', 'PAINT_DAMAGE', 'TEAR', 'OTHER'],
      default: 'SCRATCH',
    },
    severity: {
      type: String,
      enum: ['MINOR', 'MODERATE', 'MAJOR'],
      default: 'MINOR',
    },
    description: { type: String, default: '', trim: true },
    photoUrl: { type: String, default: '' },
    photoFileId: { type: String, default: '' },
    estimatedCost: { type: Number, default: 0, min: 0 },
    confirmedCost: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['EXISTING', 'REPORTED', 'UNDER_REVIEW', 'CONFIRMED', 'REJECTED', 'RESOLVED'],
      default: 'REPORTED',
    },
    detectedStage: {
      type: String,
      enum: ['PRE_HANDOVER', 'RETURN'],
      default: 'PRE_HANDOVER',
    },
    isPreExisting: { type: Boolean, default: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

VehicleDamageSchema.index({ bookingId: 1, status: 1 });
VehicleDamageSchema.index({ vehicleId: 1 });

const VehicleDamage = mongoose.model<IVehicleDamage>('VehicleDamage', VehicleDamageSchema);
export default VehicleDamage;
