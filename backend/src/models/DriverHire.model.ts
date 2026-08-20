import mongoose, { Schema, Document, Types } from 'mongoose';

export type DriverHireStatus =
  | 'DRAFT'
  | 'SEARCHING'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'SERVICE_STARTED'
  | 'SERVICE_IN_PROGRESS'
  | 'SERVICE_COMPLETED'
  | 'PAYMENT_COMPLETED'
  | 'RATED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface IDriverHire extends Document {
  userId: Types.ObjectId;
  driverId?: Types.ObjectId | string | null;
  driverName: string;
  driverPhone: string;
  driverAvatar?: string;
  driverRating?: number;
  serviceType: 'hourly' | 'full_day' | 'outstation' | 'airport' | 'event';
  tripType?: 'ONE_WAY' | 'ROUND_TRIP' | string;
  outboundDistanceKm?: number;
  outboundDurationStr?: string;
  returnDistanceKm?: number;
  returnDurationStr?: string;
  expectedStayDurationHours?: number;
  totalDrivingDistanceKm?: number;
  totalDrivingDurationStr?: string;
  totalDriverCommitmentHours?: number;
  isFlexibleRoundTrip?: boolean;
  estimatedEarnings?: number;
  timeline?: any;
  hourlyRate: number;
  pickupLocation: string;
  approximatePickupArea?: string;
  pickupCoords?: { lat: number; lng: number };
  destinationLocation?: string;
  destinationCoords?: { lat: number; lng: number };
  bookingDate: Date;
  startTime: string;
  hours: number;
  durationDays?: number;
  returnRequired?: boolean;
  isOutstation: boolean;
  vehicleDetails?: {
    type: string;
    makeModel: string;
    transmission: string;
    fuel: string;
  };
  requirements?: {
    minExperience: number;
    languages: string[];
    experienceTags: string[];
    preferences: string[];
    specialNotes?: string;
  };
  fareBreakdown?: {
    baseFare: number;
    durationCharge: number;
    outstationAllowance: number;
    nightCharge: number;
    platformFee: number;
    taxes: number;
    totalFare: number;
    extraHoursFee?: number;
  };
  baseFare: number;
  nightCharge: number;
  outstationAllowance: number;
  totalFare: number;
  servicePin: string;
  status: DriverHireStatus;
  startedAt?: Date;
  completedAt?: Date;
  actualHours?: number;
  extraHours?: number;
  extraHoursConfirmed?: boolean;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'completed' | 'refunded';
  multiRating?: {
    driving: number;
    professionalism: number;
    punctuality: number;
    vehicleHandling: number;
    averageRating: number;
    comment?: string;
  };
  cancellationFee?: number;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverHireSchema = new Schema<IDriverHire>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    driverId: {
      type: Schema.Types.Mixed,
      ref: 'Driver',
      default: null,
    },
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    driverPhone: {
      type: String,
      required: [true, 'Driver phone is required'],
      trim: true,
    },
    driverAvatar: {
      type: String,
      default: 'DP',
    },
    driverRating: {
      type: Number,
      default: 4.9,
    },
    serviceType: {
      type: String,
      enum: ['hourly', 'full_day', 'outstation', 'airport', 'event'],
      default: 'full_day',
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
    },
    pickupCoords: {
      lat: { type: Number, default: 28.6315 },
      lng: { type: Number, default: 77.2167 },
    },
    destinationLocation: {
      type: String,
      trim: true,
      default: '',
    },
    destinationCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    hours: {
      type: Number,
      required: [true, 'Number of hours is required'],
      min: [1, 'Must book at least 1 hour'],
    },
    durationDays: {
      type: Number,
      default: 1,
    },
    tripType: {
      type: String,
      enum: ['ONE_WAY', 'ROUND_TRIP', 'one_way', 'round_trip', 'One Way', 'Round Trip'],
      default: 'ONE_WAY',
    },
    outboundDistanceKm: { type: Number },
    outboundDurationStr: { type: String },
    returnDistanceKm: { type: Number },
    returnDurationStr: { type: String },
    expectedStayDurationHours: { type: Number },
    totalDrivingDistanceKm: { type: Number },
    totalDrivingDurationStr: { type: String },
    totalDriverCommitmentHours: { type: Number },
    isFlexibleRoundTrip: { type: Boolean, default: false },
    estimatedEarnings: { type: Number },
    timeline: { type: Schema.Types.Mixed },
    returnRequired: {
      type: Boolean,
      default: true,
    },
    isOutstation: {
      type: Boolean,
      default: false,
    },
    vehicleDetails: {
      type: { type: String, default: 'Sedan' },
      makeModel: { type: String, default: 'Honda City' },
      transmission: { type: String, default: 'Automatic' },
      fuel: { type: String, default: 'Petrol' },
    },
    requirements: {
      minExperience: { type: Number, default: 3 },
      languages: [{ type: String }],
      experienceTags: [{ type: String }],
      preferences: [{ type: String }],
      specialNotes: { type: String, default: '' },
    },
    fareBreakdown: {
      type: Schema.Types.Mixed,
      default: {},
    },
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },
    nightCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstationAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFare: {
      type: Number,
      required: true,
      min: 0,
    },
    servicePin: {
      type: String,
      default: '4829',
    },
    status: {
      type: String,
      default: 'CONFIRMED',
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    actualHours: { type: Number },
    extraHours: { type: Number, default: 0 },
    extraHoursConfirmed: { type: Boolean, default: false },
    paymentMethod: { type: String, default: 'UPI' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'refunded'],
      default: 'pending',
    },
    multiRating: {
      driving: { type: Number },
      professionalism: { type: Number },
      punctuality: { type: Number },
      vehicleHandling: { type: Number },
      averageRating: { type: Number },
      comment: { type: String },
    },
    cancellationFee: { type: Number, default: 0 },
    cancellationReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
DriverHireSchema.index({ userId: 1 });
DriverHireSchema.index({ driverId: 1 });
DriverHireSchema.index({ status: 1 });
DriverHireSchema.index({ bookingDate: 1 });

const DriverHire = mongoose.model<IDriverHire>('DriverHire', DriverHireSchema);
export default DriverHire;
