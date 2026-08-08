import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IParticipant {
  userId: Types.ObjectId;
  name: string;
  email?: string;
}

export interface ITrip extends Document {
  userId: Types.ObjectId;
  participants: IParticipant[];
  aiPlanData: Record<string, any>; // Flexible AI-generated plan payload
  linkedExpenses: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant userId is required'],
    },
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false }
);

const TripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trip owner (userId) is required'],
    },
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    aiPlanData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    linkedExpenses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Expense',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
TripSchema.index({ userId: 1 });
TripSchema.index({ createdAt: -1 });

const Trip = mongoose.model<ITrip>('Trip', TripSchema);
export default Trip;
