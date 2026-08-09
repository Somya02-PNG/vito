import mongoose, { Schema, Document, Types } from 'mongoose';

export type BookingType = 'cab' | 'rental' | 'driver_hire';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cash';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface IPayment extends Document {
  bookingId: string;
  bookingType: BookingType;
  payerId: Types.ObjectId;
  driverId?: Types.ObjectId;
  totalFare: number;
  commissionRate: number;
  platformCommission: number;
  driverPayout: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionRef: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: String,
      required: [true, 'Booking ID is required'],
    },
    bookingType: {
      type: String,
      enum: ['cab', 'rental', 'driver_hire'],
      required: [true, 'Booking type is required'],
    },
    payerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer user ID is required'],
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    totalFare: {
      type: Number,
      required: [true, 'Total fare is required'],
      min: [0, 'Total fare cannot be negative'],
    },
    commissionRate: {
      type: Number,
      default: 0.18, // 18%
    },
    platformCommission: {
      type: Number,
      required: true,
      min: 0,
    },
    driverPayout: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'cash'],
      default: 'upi',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PaymentSchema.index({ payerId: 1 });
PaymentSchema.index({ bookingId: 1 });

const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
