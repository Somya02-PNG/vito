import mongoose, { Schema, Document, Types } from 'mongoose';

export type RentalStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled';

export type DepositStatus = 'pending' | 'paid' | 'refunded' | 'forfeited';

export type AddOnType = 'child_seat' | 'gps' | 'extra_driver' | 'insurance_upgrade';

export interface IRental extends Document {
  vehicleId: Types.ObjectId;
  userId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  deliveryRequired: boolean;
  deliveryAddress: string;
  deliveryCharge: number;
  depositAmount: number;
  depositStatus: DepositStatus;
  addOns: AddOnType[];
  couponCode: string;
  status: RentalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RentalSchema = new Schema<IRental>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: IRental, value: Date) {
          return value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    deliveryRequired: {
      type: Boolean,
      default: false,
    },
    deliveryAddress: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charge cannot be negative'],
    },
    depositAmount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0, 'Deposit cannot be negative'],
    },
    depositStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'refunded', 'forfeited'],
        message: '{VALUE} is not a valid deposit status',
      },
      default: 'pending',
    },
    addOns: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.every((a) => ['child_seat', 'gps', 'extra_driver', 'insurance_upgrade'].includes(a)),
        message: 'Invalid add-on type',
      },
    },
    couponCode: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid rental status',
      },
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
RentalSchema.index({ userId: 1 });
RentalSchema.index({ vehicleId: 1 });
RentalSchema.index({ status: 1 });
RentalSchema.index({ startDate: 1, endDate: 1 });

const Rental = mongoose.model<IRental>('Rental', RentalSchema);
export default Rental;
