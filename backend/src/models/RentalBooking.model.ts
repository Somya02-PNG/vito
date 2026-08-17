import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── Full State Machine Status Enum ─────────────────────────────────────────
export type RentalBookingStatus =
  | 'DRAFT'
  | 'SEARCHING'
  | 'SELECTED'
  | 'VERIFICATION_PENDING'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'CUSTOMER_ARRIVING'
  | 'HANDOVER_PENDING'
  | 'HANDOVER_ACCEPTED'
  | 'ACTIVE'
  | 'EXTENSION_REQUESTED'
  | 'EXTENDED'
  | 'RETURN_PENDING'
  | 'RETURNED'
  | 'INSPECTION_PENDING'
  | 'INSPECTION_COMPLETED'
  | 'DAMAGE_REVIEW_PENDING'
  | 'FINAL_BILL_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'COMPLETED'
  | 'RATED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'VEHICLE_UNAVAILABLE'
  | 'DISPUTED';

export type PickupMethod = 'self_pickup' | 'doorstep_delivery';
export type DepositRefundStatus = 'PENDING' | 'PROCESSING' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FORFEITED';

export interface IPricingBreakdown {
  baseRental: number;
  durationAdjustment: number;     // discount for longer duration
  deliveryFee: number;
  oneWayFee: number;
  protectionFee: number;
  platformFee: number;
  tax: number;
  securityDeposit: number;        // MUST be shown as separate line, never merged into rental
  discount: number;
  totalPayable: number;           // excludes deposit
  totalWithDeposit: number;       // includes deposit
}

export interface IInspectionPanel {
  condition: 'good' | 'minor_damage' | 'major_damage' | 'not_checked';
  notes: string;
}

export interface IInspectionRecord {
  completedAt: Date;
  odometerKm: number;
  fuelLevelPercent: number;
  exteriorFront: IInspectionPanel;
  exteriorRear: IInspectionPanel;
  exteriorLeft: IInspectionPanel;
  exteriorRight: IInspectionPanel;
  exteriorRoof: IInspectionPanel;
  exteriorWheels: IInspectionPanel;
  interiorDashboard: IInspectionPanel;
  interiorSeats: IInspectionPanel;
  interiorAC: IInspectionPanel;
  interiorInfotainment: IInspectionPanel;
  existingDamageNotes: string;
  newDamageDetected: boolean;
}

export interface IExtensionRecord {
  requestedAt: Date;
  confirmedAt: Date;
  previousEndDate: Date;
  newEndDate: Date;
  additionalHours: number;
  priceDelta: number;
}

export interface ISupportTicket {
  ticketId: string;
  category: 'Breakdown' | 'Flat tyre' | 'Battery issue' | 'Accident' | 'Mechanical issue' | 'Other';
  description: string;
  createdAt: Date;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface IRentalRating {
  vehicleCondition: number;
  vehicleQuality: number;
  pickupExperience: number;
  returnExperience: number;
  hostService: number;
  overall: number;
  comment: string;
  submittedAt: Date;
}

export interface IRentalBooking extends Document {
  // ─── Identity ───────────────────────────────────────────────────────────────
  bookingId: string;              // VR-XXXXXX — generated on payment success ONLY
  userId: Types.ObjectId;
  vehicleId: Types.ObjectId;

  // ─── Rental Details ──────────────────────────────────────────────────────────
  pickupLocation: string;
  pickupCoords: { lat: number; lng: number };
  pickupHubId?: Types.ObjectId;
  returnLocation: string;
  returnCoords: { lat: number; lng: number };
  returnHubId?: Types.ObjectId;
  tripDestination?: string;
  isOneWay: boolean;
  searchTier?: string;
  isDemo: boolean;
  pickupMethod: PickupMethod;
  deliveryAddress: string;
  pickupDateTime: Date;
  returnDateTime: Date;

  // ─── Pricing (all components, deposit always separate) ───────────────────────
  pricing: IPricingBreakdown;

  // ─── State Machine ──────────────────────────────────────────────────────────
  status: RentalBookingStatus;

  // ─── Verification ───────────────────────────────────────────────────────────
  licenceVerifiedAtBooking: boolean;
  identityVerifiedAtBooking: boolean;
  agreementAcceptedAt: Date | null;

  // ─── Inspection Records & Handover ──────────────────────────────────────────
  preRentalInspection: IInspectionRecord | null;
  postRentalInspection: IInspectionRecord | null;
  preInspectionId?: Types.ObjectId;
  postInspectionId?: Types.ObjectId;
  handoverAcceptedAt?: Date;
  customerAcknowledgement?: {
    reviewedCondition: boolean;
    acknowledgedDamage: boolean;
    agreedTerms: boolean;
    acceptedAt: Date;
  };

  // ─── Extensions ─────────────────────────────────────────────────────────────
  extensionHistory: any[];
  currentReturnDateTime: Date;    // Updated on each extension

  // ─── Charges (final settlement) ─────────────────────────────────────────────
  lateFeeCharge: number;
  fuelAdjustmentCharge: number;   // fuel deficit charge
  damageCharge: number;
  confirmedDamageCharge: number;  // ONLY charges approved/confirmed by admin
  depositRefundStatus: DepositRefundStatus;
  depositRefundAmount: number;

  // ─── Timeline ───────────────────────────────────────────────────────────────
  timeline: Array<{
    event: string;
    timestamp: Date;
    description: string;
    actor: string;
  }>;

  // ─── Support ────────────────────────────────────────────────────────────────
  supportTickets: any[];

  // ─── Rating ─────────────────────────────────────────────────────────────────
  rating: IRentalRating | null;

  // ─── Cancellation ───────────────────────────────────────────────────────────
  cancellationReason: string;
  cancellationFeeApplied: number;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-document schemas ────────────────────────────────────────────────────
const InspectionPanelSchema = new Schema<IInspectionPanel>({
  condition: { type: String, enum: ['good', 'minor_damage', 'major_damage', 'not_checked'], default: 'not_checked' },
  notes: { type: String, default: '' },
}, { _id: false });

const InspectionRecordSchema = new Schema<IInspectionRecord>({
  completedAt: { type: Date },
  odometerKm: { type: Number, default: 0 },
  fuelLevelPercent: { type: Number, default: 100 },
  exteriorFront: { type: InspectionPanelSchema, default: () => ({}) },
  exteriorRear: { type: InspectionPanelSchema, default: () => ({}) },
  exteriorLeft: { type: InspectionPanelSchema, default: () => ({}) },
  exteriorRight: { type: InspectionPanelSchema, default: () => ({}) },
  exteriorRoof: { type: InspectionPanelSchema, default: () => ({}) },
  exteriorWheels: { type: InspectionPanelSchema, default: () => ({}) },
  interiorDashboard: { type: InspectionPanelSchema, default: () => ({}) },
  interiorSeats: { type: InspectionPanelSchema, default: () => ({}) },
  interiorAC: { type: InspectionPanelSchema, default: () => ({}) },
  interiorInfotainment: { type: InspectionPanelSchema, default: () => ({}) },
  existingDamageNotes: { type: String, default: '' },
  newDamageDetected: { type: Boolean, default: false },
}, { _id: false });

const PricingSchema = new Schema<IPricingBreakdown>({
  baseRental: { type: Number, default: 0 },
  durationAdjustment: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  oneWayFee: { type: Number, default: 0 },
  protectionFee: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  securityDeposit: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalPayable: { type: Number, default: 0 },
  totalWithDeposit: { type: Number, default: 0 },
}, { _id: false });

// ─── Main Schema ─────────────────────────────────────────────────────────────
const RentalBookingSchema = new Schema<IRentalBooking>(
  {
    bookingId: { type: String, default: '' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },

    pickupLocation: { type: String, default: '' },
    pickupCoords: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    pickupHubId: { type: Schema.Types.ObjectId, ref: 'RentalHub' },
    returnLocation: { type: String, default: '' },
    returnCoords: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    returnHubId: { type: Schema.Types.ObjectId, ref: 'RentalHub' },
    tripDestination: { type: String, default: '' },
    isOneWay: { type: Boolean, default: false },
    searchTier: { type: String, default: 'exact' },
    isDemo: { type: Boolean, default: true },
    pickupMethod: {
      type: String,
      enum: ['self_pickup', 'doorstep_delivery'],
      default: 'self_pickup',
    },
    deliveryAddress: { type: String, default: '' },
    pickupDateTime: { type: Date, required: true },
    returnDateTime: { type: Date, required: true },
    currentReturnDateTime: { type: Date },

    pricing: { type: PricingSchema, default: () => ({}) },

    status: {
      type: String,
      enum: [
        'DRAFT', 'SEARCHING', 'SELECTED', 'VERIFICATION_PENDING', 'PAYMENT_PENDING',
        'CONFIRMED', 'READY_FOR_PICKUP', 'CUSTOMER_ARRIVING', 'HANDOVER_PENDING',
        'HANDOVER_ACCEPTED', 'ACTIVE', 'EXTENSION_REQUESTED', 'EXTENDED', 'RETURN_PENDING', 'RETURNED',
        'INSPECTION_PENDING', 'INSPECTION_COMPLETED', 'DAMAGE_REVIEW_PENDING', 'FINAL_BILL_PENDING',
        'PAYMENT_COMPLETED', 'COMPLETED', 'RATED',
        'CANCELLED', 'PAYMENT_FAILED', 'EXPIRED', 'NO_SHOW', 'VEHICLE_UNAVAILABLE', 'DISPUTED',
      ],
      default: 'DRAFT',
    },

    licenceVerifiedAtBooking: { type: Boolean, default: false },
    identityVerifiedAtBooking: { type: Boolean, default: false },
    agreementAcceptedAt: { type: Date, default: null },

    preRentalInspection: { type: InspectionRecordSchema, default: null },
    postRentalInspection: { type: InspectionRecordSchema, default: null },
    preInspectionId: { type: Schema.Types.ObjectId, ref: 'VehicleInspection' },
    postInspectionId: { type: Schema.Types.ObjectId, ref: 'VehicleInspection' },
    handoverAcceptedAt: { type: Date },
    customerAcknowledgement: {
      reviewedCondition: { type: Boolean, default: false },
      acknowledgedDamage: { type: Boolean, default: false },
      agreedTerms: { type: Boolean, default: false },
      acceptedAt: { type: Date },
    },

    extensionHistory: { type: [Object], default: [] },

    lateFeeCharge: { type: Number, default: 0 },
    fuelAdjustmentCharge: { type: Number, default: 0 },
    damageCharge: { type: Number, default: 0 },
    confirmedDamageCharge: { type: Number, default: 0 },
    depositRefundStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FORFEITED'],
      default: 'PENDING',
    },
    depositRefundAmount: { type: Number, default: 0 },

    timeline: { type: [Object], default: [] },

    supportTickets: { type: [Object], default: [] },

    rating: { type: Schema.Types.Mixed, default: null },

    cancellationReason: { type: String, default: '' },
    cancellationFeeApplied: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for availability queries
RentalBookingSchema.index({ vehicleId: 1, status: 1, pickupDateTime: 1, currentReturnDateTime: 1 });
RentalBookingSchema.index({ userId: 1, status: 1 });
RentalBookingSchema.index({ bookingId: 1 }, { unique: true, sparse: true });

const RentalBooking = mongoose.model<IRentalBooking>('RentalBooking', RentalBookingSchema);
export default RentalBooking;
