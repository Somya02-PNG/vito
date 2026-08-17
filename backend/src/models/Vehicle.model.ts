import mongoose, { Schema, Document, Types } from 'mongoose';

export type VehicleCategory = 'sedan' | 'suv' | 'hatchback' | 'bike' | 'luxury' | 'van' | 'ev' | 'muv';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
export type TransmissionType = 'manual' | 'automatic';
export type VehicleStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'MAINTENANCE';

export interface IVehicleLocation {
  lat: number;
  lng: number;
}

export interface IVehicle extends Document {
  // Core identity
  make: string;
  vehicleModel: string;
  year: number;
  name: string;
  registrationNumber: string;

  // Specs
  category: VehicleCategory;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;

  // Pricing
  pricePerDay: number;
  depositAmount: number;
  mileagePolicy: string;

  // Media
  images: string[];

  // Location & availability
  location: IVehicleLocation;
  city: string;
  hubId?: Types.ObjectId;
  hubCode?: string;
  hubName?: string;
  status: VehicleStatus;
  deliveryAvailable: boolean;
  oneWayRentalSupported: boolean;
  isDemo: boolean;

  // Ratings & social proof
  rating: number;
  totalRatings: number;
  totalRentals: number;

  // Inspection
  lastInspectionDate: Date;

  // Features
  features: string[];

  // Host/Fleet info
  ownerId: Types.ObjectId;
  hostName: string;
  hostRating: number;
  hostCompletedRentals: number;

  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    make: { type: String, trim: true, default: '' },
    vehicleModel: { type: String, trim: true, default: '' },
    year: { type: Number, default: 2023 },
    name: { type: String, trim: true, default: '' },
    registrationNumber: { type: String, trim: true, default: '' },

    category: {
      type: String,
      required: [true, 'Vehicle category is required'],
      enum: {
        values: ['sedan', 'suv', 'hatchback', 'bike', 'luxury', 'van', 'ev', 'muv'],
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
    depositAmount: { type: Number, default: 3000, min: 0 },
    mileagePolicy: { type: String, default: '200 km/day free, ₹10/km beyond' },

    images: { type: [String], default: [] },

    location: {
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
    city: { type: String, default: 'Delhi NCR' },
    hubId: { type: Schema.Types.ObjectId, ref: 'RentalHub' },
    hubCode: { type: String, default: '' },
    hubName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'MAINTENANCE'],
      default: 'PENDING_VERIFICATION',
    },
    deliveryAvailable: { type: Boolean, default: false },
    oneWayRentalSupported: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: true },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalRentals: { type: Number, default: 0 },
    lastInspectionDate: { type: Date, default: Date.now },
    features: { type: [String], default: [] },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vehicle owner is required'],
    },
    hostName: { type: String, default: 'VITO Fleet' },
    hostRating: { type: Number, default: 4.8 },
    hostCompletedRentals: { type: Number, default: 0 },
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
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ city: 1 });
VehicleSchema.index({ 'location.lat': 1, 'location.lng': 1 });

const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
export default Vehicle;




