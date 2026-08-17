import mongoose, { Schema, Document, Types } from 'mongoose';

export type InspectionType = 'PRE_HANDOVER' | 'RETURN';
export type InspectionStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';

export interface IInspectionPhotoItem {
  category: 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT' | 'INTERIOR' | 'DASHBOARD' | 'ODOMETER' | 'FUEL' | 'DAMAGE' | 'OTHER';
  fileId: string;
  url: string;
  capturedAt: Date;
  capturedBy?: string;
  notes?: string;
}

export interface IVehicleInspection extends Document {
  bookingId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  type: InspectionType;
  performedBy: Types.ObjectId;
  performedByName: string;
  performedAt: Date;
  odometerKm: number;
  fuelLevelPercent: number;
  batteryLevelPercent?: number;
  cleanliness: 'Clean' | 'Moderate' | 'Dirty';
  checklist: Record<string, { condition: 'good' | 'minor_issue' | 'major_issue'; notes?: string }>;
  photos: any[];
  damageIds: Types.ObjectId[];
  customerAcknowledged: boolean;
  customerAcknowledgedAt?: Date;
  acknowledgementCheckboxes?: {
    reviewedCondition: boolean;
    acknowledgedDamage: boolean;
    agreedTerms: boolean;
  };
  keysHandedOver: boolean;
  documentsHandedOver: boolean;
  status: InspectionStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleInspectionSchema = new Schema<IVehicleInspection>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'RentalBooking', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: {
      type: String,
      enum: ['PRE_HANDOVER', 'RETURN'],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String, default: 'VITO Fleet Inspector' },
    performedAt: { type: Date, default: Date.now },
    odometerKm: { type: Number, required: true, min: 0 },
    fuelLevelPercent: { type: Number, required: true, min: 0, max: 100 },
    batteryLevelPercent: { type: Number, min: 0, max: 100 },
    cleanliness: {
      type: String,
      enum: ['Clean', 'Moderate', 'Dirty'],
      default: 'Clean',
    },
    checklist: { type: Schema.Types.Mixed, default: {} },
    photos: { type: [Object], default: [] },
    damageIds: [{ type: Schema.Types.ObjectId, ref: 'VehicleDamage' }],
    customerAcknowledged: { type: Boolean, default: false },
    customerAcknowledgedAt: { type: Date },
    acknowledgementCheckboxes: {
      reviewedCondition: { type: Boolean, default: false },
      acknowledgedDamage: { type: Boolean, default: false },
      agreedTerms: { type: Boolean, default: false },
    },
    keysHandedOver: { type: Boolean, default: true },
    documentsHandedOver: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'],
      default: 'SUBMITTED',
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

VehicleInspectionSchema.index({ bookingId: 1, type: 1 });
VehicleInspectionSchema.index({ vehicleId: 1 });

const VehicleInspection = mongoose.model<IVehicleInspection>('VehicleInspection', VehicleInspectionSchema);
export default VehicleInspection;
