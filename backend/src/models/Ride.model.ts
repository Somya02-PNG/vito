import mongoose, { Schema, Document, Types } from 'mongoose';

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface IRideLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface IRide extends Document {
  pickup: IRideLocation;
  drop: IRideLocation;
  driverId: Types.ObjectId;
  riderId: Types.ObjectId;
  otp: string;
  status: RideStatus;
  fare: number;
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
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null, // Assigned after a driver accepts
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
        values: ['requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid ride status',
      },
      default: 'requested',
    },
    fare: {
      type: Number,
      required: [true, 'Fare is required'],
      min: [0, 'Fare cannot be negative'],
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
