import mongoose, { Schema, Document, Types } from 'mongoose';

export type RideStatus =
  | 'requested'
<<<<<<< HEAD
  | 'searching'
  | 'accepted'
  | 'driver_assigned'
  | 'arriving'
  | 'arrived'
=======
  | 'searching_driver'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
>>>>>>> somya
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_driver_available'
  | 'accepted'
  | 'arriving';

export interface IRideLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface IFareBreakdown {
  baseFare: number;
<<<<<<< HEAD
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
=======
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  cancellationFee?: number;
>>>>>>> somya
}

export interface IRide extends Document {
  pickup: IRideLocation;
  drop: IRideLocation;
  stops?: IRideLocation[];
<<<<<<< HEAD
  category?: string;
  driverId: Types.ObjectId | null;
=======
  vehicleType?: string;
  driverId?: Types.ObjectId;
>>>>>>> somya
  riderId: Types.ObjectId;
  otp: string;
  status: RideStatus;
  fare: number;
  fareBreakdown?: IFareBreakdown;
<<<<<<< HEAD
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
=======
  cancellationFee?: number;
  rating?: number;
  comment?: string;
  tip?: number;
>>>>>>> somya
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
<<<<<<< HEAD
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
=======
    baseFare: { type: Number, default: 50 },
    distanceFare: { type: Number, default: 0 },
    timeFare: { type: Number, default: 0 },
    surgeMultiplier: { type: Number, default: 1.0 },
    cancellationFee: { type: Number, default: 0 },
>>>>>>> somya
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
<<<<<<< HEAD
    category: {
      type: String,
      default: 'go',
=======
    vehicleType: {
      type: String,
      enum: ['Mini', 'Sedan', 'SUV', 'Premium'],
      default: 'Sedan',
>>>>>>> somya
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
<<<<<<< HEAD
          'searching',
          'accepted',
          'driver_assigned',
          'arriving',
          'arrived',
          'in_progress',
          'completed',
          'cancelled',
=======
          'searching_driver',
          'driver_assigned',
          'driver_arriving',
          'driver_arrived',
          'in_progress',
          'completed',
          'cancelled',
          'no_driver_available',
          'accepted',
          'arriving',
>>>>>>> somya
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
<<<<<<< HEAD
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
=======
      default: null,
    },
    cancellationFee: {
      type: Number,
      default: 0,
    },
>>>>>>> somya
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
<<<<<<< HEAD
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
=======
    comment: {
      type: String,
      default: '',
    },
    tip: {
      type: Number,
      default: 0,
    },
>>>>>>> somya
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

