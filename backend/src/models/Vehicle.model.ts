import mongoose, { Schema, Document, Types } from 'mongoose';

export type VehicleCategory = 'sedan' | 'suv' | 'hatchback' | 'bike' | 'luxury' | 'van';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
export type TransmissionType = 'manual' | 'automatic';

export interface IVehicleLocation {
  lat: number;
  lng: number;
}

export interface IVehicle extends Document {
  category: VehicleCategory;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  pricePerDay: number;
  images: string[];
  location: IVehicleLocation;
  ownerId: Types.ObjectId;
  rating: number;
  deliveryAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    category: {
      type: String,
      required: [true, 'Vehicle category is required'],
      enum: {
        values: ['sedan', 'suv', 'hatchback', 'bike', 'luxury', 'van'],
        message: '{VALUE} is not a valid vehicle category',
      },
    },
    fuelType: {
      type: String,
      required: [true, 'Fuel type is required'],
      enum: {
        values: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
        message: '{VALUE} is not a valid fuel type',
      },
    },
    transmission: {
      type: String,
      required: [true, 'Transmission type is required'],
      enum: {
        values: ['manual', 'automatic'],
        message: '{VALUE} is not a valid transmission type',
      },
    },
    seats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'Must have at least 1 seat'],
      max: [50, 'Seats cannot exceed 50'],
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: 'Cannot upload more than 10 images',
      },
    },
    location: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vehicle owner is required'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
VehicleSchema.index({ category: 1 });
VehicleSchema.index({ pricePerDay: 1 });
VehicleSchema.index({ ownerId: 1 });
VehicleSchema.index({ 'location.lat': 1, 'location.lng': 1 });

const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
export default Vehicle;
