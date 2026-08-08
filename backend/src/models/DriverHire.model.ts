import mongoose, { Schema, Document, Types } from 'mongoose';

export type DriverHireStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface IDriverHire extends Document {
  userId: Types.ObjectId;
  driverName: string;
  driverPhone: string;
  hourlyRate: number;
  pickupLocation: string;
  bookingDate: Date;
  startTime: string;
  hours: number;
  isOutstation: boolean;
  baseFare: number;
  nightCharge: number;
  outstationAllowance: number;
  totalFare: number;
  status: DriverHireStatus;
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
    isOutstation: {
      type: Boolean,
      default: false,
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
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid hire status',
      },
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
DriverHireSchema.index({ userId: 1 });
DriverHireSchema.index({ status: 1 });

const DriverHire = mongoose.model<IDriverHire>('DriverHire', DriverHireSchema);
export default DriverHire;
