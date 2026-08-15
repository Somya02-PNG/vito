import mongoose, { Schema, Document, Types } from 'mongoose';

export type RideStatus =
  | 'requested'
  | 'searching'
  | 'accepted'
  | 'driver_assigned'
  | 'arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface IRideLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface IFareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surgeMultiplier: number;
  bookingFee: number;
  taxes: number;
  total: number;
}

export interface IRideDriverInfo {
  id?: string;
  name?: string;
  phone?: string;
  rating?: number;
  totalTrips?: number;
  vehicleModel?: string;
  vehicleNo?: string;
  category?: string;
  avatar?: string;
  experience?: number;
}

export interface IRide extends Document {
  pickup: IRideLocation;
  drop: IRideLocation;
  stops?: IRideLocation[];
  category?: string;
  driverId: Types.ObjectId | null;
  riderId: Types.ObjectId;
  otp: string;
  status: RideStatus;
  fare: number;
  fareBreakdown?: IFareBreakdown;
  distance?: number;
  duration?: number;
  scheduledFor?: Date | null;
  rating?: number;
  feedbackTags?: string[];
  feedbackComment?: string;
  cancellationFee?: number;
  driverInfo?: IRideDriverInfo;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const RideLocationSchema = new Schema<IRideLocation>(
  {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
  },
  { _id: false }
);

const FareBreakdownSchema = new Schema<IFareBreakdown>(
  {
    baseFare: { type: Number, default: 0 },
    distanceCharge: { type: Number, default: 0 },
    timeCharge: { type: Number, default: 0 },
    surgeMultiplier: { type: Number, default: 1 },
    bookingFee: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const DriverInfoSchema = new Schema<IRideDriverInfo>(
  {
    id: String,
    name: String,
    phone: String,
    rating: Number,
    totalTrips: Number,
    vehicleModel: String,
    vehicleNo: String,
    category: String,
    avatar: String,
    experience: Number,
  },
  { _id: false }
);

const RideSchema = new Schema<IRide>(
  {
    pickup: {
      type: RideLocationSchema,
      required: [true, 'Pickup location is required'],
    },
    drop: {
      type: RideLocationSchema,
      required: [true, 'Drop location is required'],
    },
    stops: {
      type: [RideLocationSchema],
      default: [],
    },
    category: {
      type: String,
      default: 'go',
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    riderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rider is required'],
    },
    otp: {
      type: String,
      required: [true, 'OTP is required for ride verification'],
      minlength: 4,
      maxlength: 6,
    },
    status: {
      type: String,
      enum: {
        values: [
          'requested',
          'searching',
          'accepted',
          'driver_assigned',
          'arriving',
          'arrived',
          'in_progress',
          'completed',
          'cancelled',
        ],
        message: '{VALUE} is not a valid ride status',
      },
      default: 'requested',
    },
    fare: {
      type: Number,
      required: [true, 'Fare is required'],
      min: [0, 'Fare cannot be negative'],
    },
    fareBreakdown: {
      type: FareBreakdownSchema,
      default: () => ({}),
    },
    distance: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    feedbackTags: {
      type: [String],
      default: [],
    },
    feedbackComment: {
      type: String,
      default: '',
    },
    cancellationFee: {
      type: Number,
      default: 0,
    },
    driverInfo: {
      type: DriverInfoSchema,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'upi',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
RideSchema.index({ riderId: 1 });
RideSchema.index({ driverId: 1 });
RideSchema.index({ status: 1 });
RideSchema.index({ createdAt: -1 });

const Ride = mongoose.model<IRide>('Ride', RideSchema);
export default Ride;

