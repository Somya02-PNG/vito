import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedLocation extends Document {
  userId: Types.ObjectId;
  label: string; // 'HOME' | 'WORK' | 'GYM' | 'OTHER'
  customName?: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  createdAt: Date;
  updatedAt: Date;
}

const SavedLocationSchema = new Schema<ISavedLocation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: ['HOME', 'WORK', 'AIRPORT', 'OTHER'],
      default: 'OTHER',
    },
    customName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

SavedLocationSchema.index({ location: '2dsphere' });
SavedLocationSchema.index({ userId: 1, label: 1 });

const SavedLocation = mongoose.model<ISavedLocation>('SavedLocation', SavedLocationSchema);
export default SavedLocation;
