import mongoose, { Schema, Document, Types } from 'mongoose';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'fuel'
  | 'tickets'
  | 'shopping'
  | 'other';

export type SplitType = 'equal' | 'percentage' | 'custom' | 'no_split';

export interface ISplitDetails {
  participantName: string;
  amount: number;
  percentage?: number;
}

export interface IExpense extends Document {
  tripId: Types.ObjectId;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidBy: Types.ObjectId;
  paidByName: string;
  splitType: SplitType;
  splits: ISplitDetails[];
  createdAt: Date;
  updatedAt: Date;
}

const SplitDetailsSchema = new Schema<ISplitDetails>(
  {
    participantName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: {
        values: ['food', 'transport', 'accommodation', 'fuel', 'tickets', 'shopping', 'other'],
        message: '{VALUE} is not a valid expense category',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'PaidBy user is required'],
    },
    paidByName: {
      type: String,
      required: [true, 'PaidByName is required'],
      trim: true,
    },
    splitType: {
      type: String,
      enum: {
        values: ['equal', 'percentage', 'custom', 'no_split'],
        message: '{VALUE} is not a valid split type',
      },
      default: 'equal',
    },
    splits: {
      type: [SplitDetailsSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ExpenseSchema.index({ tripId: 1 });
ExpenseSchema.index({ paidBy: 1 });
ExpenseSchema.index({ category: 1 });

const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
