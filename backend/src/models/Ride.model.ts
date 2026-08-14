import mongoose, { Schema, Document, Types } from 'mongoose';

export type RideStatus =
  | 'requested'
  | 'searching_driver'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
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
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  cancellationFee?: number;
}

export interface IRide extends Document {
  pickup: IRideLocation;
  drop: IRideLocation;
  stops?: IRideLocation[];
  vehicleType?: string;
  driverId?: Types.ObjectId;
  riderId: Types.ObjectId;
  otp: string;
  status: RideStatus;
  fare: number;
  fareBreakdown?: IFareBreakdown;
  cancellationFee?: number;
  rating?: number;
  comment?: string;
  tip?: number;
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
    baseFare: { type: Number, default: 50 },
    distanceFare: { type: Number, default: 0 },
    timeFare: { type: Number, default: 0 },
    surgeMultiplier: { type: Number, default: 1.0 },
    cancellationFee: { type: Number, default: 0 },
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
    vehicleType: {
      type: String,
      enum: ['Mini', 'Sedan', 'SUV', 'Premium'],
      default: 'Sedan',
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
      default: null,
    },
    cancellationFee: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      default: '',
    },
    tip: {
      type: Number,
      default: 0,
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

