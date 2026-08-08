import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmergencyContact extends Document {
  userId: Types.ObjectId;
  contactName: string;
  phone: string;
  relationship?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      minlength: [2, 'Contact name must be at least 2 characters'],
      maxlength: [100, 'Contact name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[1-9]\d{6,14}$/, 'Please provide a valid phone number'],
    },
    relationship: {
      type: String,
      trim: true,
      default: 'Contact',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
EmergencyContactSchema.index({ userId: 1 });

const EmergencyContact = mongoose.model<IEmergencyContact>(
  'EmergencyContact',
  EmergencyContactSchema
);
export default EmergencyContact;
