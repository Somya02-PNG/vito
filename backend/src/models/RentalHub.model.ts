import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRentalHubLocation {
  lat: number;
  lng: number;
}

export interface IRentalHub extends Document {
  name: string;                   // e.g. "Kanpur Central Hub"
  code: string;                   // e.g. "HUB-KNP"
  city: string;                   // e.g. "Kanpur"
  state: string;                  // e.g. "Uttar Pradesh"
  country: string;                // "India"
  address: string;
  location: IRentalHubLocation;
  serviceRadiusKm: number;        // e.g. 35 km
  aliases: string[];              // e.g. ['kanpur', 'jajmau', 'kalyanpur', 'chakeri', 'civil lines', 'iit kanpur']
  pickupSupported: boolean;
  deliverySupported: boolean;
  oneWayReturnSupported: boolean;
  supportedOneWayReturnHubCodes: string[];
  isDemo: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  totalFleetCount: number;
  contactPhone: string;
  operatingHours: string;
  createdAt: Date;
  updatedAt: Date;
}

const RentalHubSchema = new Schema<IRentalHub>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: 'India' },
    address: { type: String, required: true, trim: true },
    location: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 },
    },
    serviceRadiusKm: { type: Number, default: 35 },
    aliases: { type: [String], default: [] },
    pickupSupported: { type: Boolean, default: true },
    deliverySupported: { type: Boolean, default: true },
    oneWayReturnSupported: { type: Boolean, default: true },
    supportedOneWayReturnHubCodes: { type: [String], default: [] },
    isDemo: { type: Boolean, default: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    totalFleetCount: { type: Number, default: 0 },
    contactPhone: { type: String, default: '+91 1800-8486-482' },
    operatingHours: { type: String, default: '24/7 (Open All Days)' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast lookup
RentalHubSchema.index({ city: 1 });
RentalHubSchema.index({ code: 1 });
RentalHubSchema.index({ 'location.lat': 1, 'location.lng': 1 });
RentalHubSchema.index({ status: 1 });

const RentalHub = mongoose.model<IRentalHub>('RentalHub', RentalHubSchema);
export default RentalHub;
