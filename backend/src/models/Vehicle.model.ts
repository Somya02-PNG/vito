import mongoose, { Schema, Document, Types } from 'mongoose';

export type VehicleCategory = 'sedan' | 'suv' | 'hatchback' | 'bike' | 'luxury' | 'van' | 'ev' | 'muv' | 'other';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
export type TransmissionType = 'manual' | 'automatic';
export type VehicleOwnershipType = 'OWNED_BY_PARTNER' | 'OWNED_BY_AGENCY' | 'LEASED' | 'AUTHORIZED_USE';
export type VehicleVerificationStatus =
  | 'DRAFT'
  | 'DOCUMENTS_PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'MAINTENANCE';

export type VehicleAvailabilityStatus =
  | 'AVAILABLE'
  | 'BOOKED'
  | 'UNDER_MAINTENANCE'
  | 'UNAVAILABLE'
  | 'SUSPENDED'
  | 'VERIFICATION_REQUIRED';

export interface IVehicleLocation {
  lat: number;
  lng: number;
}

export interface IVehiclePhotoItem {
  category: 'front' | 'rear' | 'left' | 'right' | 'interior' | 'dashboard' | 'odometer' | 'additional';
  url: string;
  storagePath?: string;
  originalFileName?: string;
  uploadedAt?: Date;
}

export interface ICustomAvailabilityBlock {
  startDate: Date;
  endDate: Date;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
  reason?: string;
}

export interface IVehicle extends Document {
  vehicleId: string;
  make: string;
  vehicleModel: string;
  variant: string;
  year: number;
  name: string;
  registrationNumber: string;
  color: string;

  // Ownership
  ownershipType: VehicleOwnershipType;
  registeredOwnerName: string;
  authorizationLetterDocId?: string;

  // Specs
  category: VehicleCategory;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  seatingCapacity: number;

  // Pricing & Deposit
  pricePerDay: number;
  depositAmount: number;
  mileagePolicy: string;

  // Media
  images: string[];
  photos: IVehiclePhotoItem[];

  // Location & availability
  location: IVehicleLocation;
  city: string;
  address?: string;
  hubId?: Types.ObjectId;
  hubCode?: string;
  hubName?: string;
  status: VehicleVerificationStatus;
  availabilityStatus: VehicleAvailabilityStatus;
  customAvailabilityBlocks: ICustomAvailabilityBlock[];
  deliveryAvailable: boolean;
  oneWayRentalSupported: boolean;
  isDemo: boolean;

  // Ratings & social proof
  rating: number;
  totalRatings: number;
  totalRentals: number;

  // Inspection
  lastInspectionDate: Date;
  features: string[];

  // Host/Fleet info
  ownerId: Types.ObjectId;
  partnerId?: Types.ObjectId;
  hostName: string;
  hostRating: number;
  hostCompletedRentals: number;

  rejectionReason?: string;
  verifiedAt?: Date;
  verifiedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

const VehiclePhotoItemSchema = new Schema<IVehiclePhotoItem>(
  {
    category: {
      type: String,
      enum: ['front', 'rear', 'left', 'right', 'interior', 'dashboard', 'odometer', 'additional'],
      required: true,
    },
    url: { type: String, required: true },
    storagePath: { type: String },
    originalFileName: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CustomAvailabilityBlockSchema = new Schema<ICustomAvailabilityBlock>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'],
      default: 'UNAVAILABLE',
    },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const VehicleSchema = new Schema<IVehicle>(
  {
    vehicleId: { type: String, unique: true, sparse: true },
    make: { type: String, trim: true, default: '' },
    vehicleModel: { type: String, trim: true, default: '' },
    variant: { type: String, trim: true, default: '' },
    year: { type: Number, default: 2023 },
    name: { type: String, trim: true, default: '' },
    registrationNumber: { type: String, trim: true, uppercase: true, default: '' },
    color: { type: String, trim: true, default: 'Silver' },

    ownershipType: {
      type: String,
      enum: ['OWNED_BY_PARTNER', 'OWNED_BY_AGENCY', 'LEASED', 'AUTHORIZED_USE'],
      default: 'OWNED_BY_PARTNER',
    },
    registeredOwnerName: { type: String, trim: true, default: '' },
    authorizationLetterDocId: { type: String, default: '' },

    category: {
      type: String,
      required: [true, 'Vehicle category is required'],
      enum: {
        values: ['sedan', 'suv', 'hatchback', 'bike', 'luxury', 'van', 'ev', 'muv', 'other'],
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
      default: 5,
    },
    seatingCapacity: {
      type: Number,
      default: 5,
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative'],
    },
    depositAmount: { type: Number, default: 3000, min: 0 },
    mileagePolicy: { type: String, default: '200 km/day free, ₹10/km beyond' },

    images: { type: [String], default: [] },
    photos: { type: [VehiclePhotoItemSchema], default: [] },

    location: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.209 },
    },
    city: { type: String, default: 'Delhi NCR' },
    address: { type: String, default: '' },
    hubId: { type: Schema.Types.ObjectId, ref: 'RentalHub' },
    hubCode: { type: String, default: '' },
    hubName: { type: String, default: '' },

    status: {
      type: String,
      enum: ['DRAFT', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'EXPIRED', 'ARCHIVED', 'MAINTENANCE'],
      default: 'DRAFT',
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'BOOKED', 'UNDER_MAINTENANCE', 'UNAVAILABLE', 'SUSPENDED', 'VERIFICATION_REQUIRED'],
      default: 'AVAILABLE',
    },
    customAvailabilityBlocks: { type: [CustomAvailabilityBlockSchema], default: [] },

    deliveryAvailable: { type: Boolean, default: false },
    oneWayRentalSupported: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
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
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'RentalPartner',
    },
    hostName: { type: String, default: 'VITO Fleet' },
    hostRating: { type: Number, default: 4.8 },
    hostCompletedRentals: { type: Number, default: 0 },

    rejectionReason: { type: String, default: '' },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, default: '' },
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
VehicleSchema.index({ partnerId: 1 });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ availabilityStatus: 1 });
VehicleSchema.index({ city: 1 });
VehicleSchema.index({ registrationNumber: 1 });
VehicleSchema.index({ 'location.lat': 1, 'location.lng': 1 });

const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
export default Vehicle;
