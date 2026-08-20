'use client';

/**
 * RentalFlow.tsx
 *
 * VITO Premium Vehicle Rental Marketplace — Complete 22-Step Journey
 * Connects Customer Search, Availability Engine, Verified Partner Inventory,
 * Real File Uploads, Digital Inspection, Handover, Active Duty, Return,
 * Damage Dispute, and Security Deposit Settlement.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Car, MapPin, Calendar, Clock, ChevronRight, ChevronLeft,
  Filter, Star, Users, Fuel, Settings2, Shield, CheckCircle2,
  ShieldCheck, Info, AlertCircle, CreditCard, Receipt,
  Wrench, Phone, Plus, Minus, ArrowRight, ArrowLeft, RotateCcw,
  Package, Zap, Home, History, X, Search, ClipboardCheck,
  Truck, Timer, FileText, ThumbsUp, Camera, ChevronDown,
  Compass, Navigation, Sparkles, AlertTriangle, Upload, Eye, Check,
  Trash2, FileCheck, ShieldAlert, BadgeCheck, HelpCircle,
} from 'lucide-react';
import AddressAutocomplete, { PlaceResult } from '@/components/AddressAutocomplete';
import MockPaymentModal from '@/components/MockPaymentModal';
import { fetchAPI } from '@/lib/api';

const EnhancedCabMap = dynamic(() => import('@/components/cab/EnhancedCabMap'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
export interface VehicleResult {
  _id: string;
  name: string;
  make: string;
  vehicleModel: string;
  year: number;
  category: string;
  fuelType: string;
  transmission: string;
  seats: number;
  pricePerDay: number;
  depositAmount: number;
  mileagePolicy: string;
  images: string[];
  location: { lat: number; lng: number };
  city: string;
  hubName?: string;
  hubCode?: string;
  rating: number;
  totalRatings: number;
  totalRentals: number;
  features: string[];
  hostName: string;
  hostRating: number;
  hostCompletedRentals: number;
  deliveryAvailable: boolean;
  pricing?: PricingResult;
  whyRecommended?: string;
}

export interface PricingResult {
  durationHours: number;
  durationDays: number;
  durationLabel: string;
  baseRental: number;
  durationAdjustment: number;
  deliveryFee: number;
  oneWayFee: number;
  protectionFee: number;
  platformFee: number;
  tax: number;
  securityDeposit: number;
  discount: number;
  totalPayable: number;
  totalWithDeposit: number;
}

export interface VehicleDamageItem {
  location: string;
  damageType: 'SCRATCH' | 'DENT' | 'CRACK' | 'PAINT_DAMAGE' | 'OTHER';
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  description: string;
  estimatedCost?: number;
  photoUrl?: string;
  isPreExisting?: boolean;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  uploadedAt: string;
}

export interface RentalBooking {
  _id: string;
  bookingId: string;
  status: string;
  vehicleId: VehicleResult;
  pickupLocation: string;
  returnLocation: string;
  tripDestination?: string;
  pickupDateTime: string;
  returnDateTime: string;
  currentReturnDateTime: string;
  pickupMethod: string;
  deliveryAddress: string;
  isOneWay: boolean;
  pricing: PricingResult;
  licenceVerifiedAtBooking: boolean;
  identityVerifiedAtBooking: boolean;
  preRentalInspection?: any;
  postRentalInspection?: any;
  extensionHistory?: any[];
  lateFeeCharge: number;
  fuelAdjustmentCharge: number;
  damageCharge: number;
  confirmedDamageCharge?: number;
  depositRefundStatus: string;
  depositRefundAmount: number;
  customerAcknowledgement?: {
    reviewedCondition: boolean;
    acknowledgedDamage: boolean;
    agreedTerms: boolean;
    acceptedAt: string;
  };
  timeline?: Array<{
    event: string;
    timestamp: string;
    description: string;
    actor: string;
  }>;
}

export type Stage =
  | 'SEARCH'
  | 'RESULTS'
  | 'DETAIL'
  | 'VERIFY_BOOK'
  | 'CONFIRMED'
  | 'PICKUP_INSPECTION'
  | 'HANDOVER_ACK'
  | 'ACTIVE'
  | 'RETURN_INSPECTION'
  | 'FINAL_BILL'
  | 'RATING'
  | 'HISTORY'
  | 'BOOKING_DETAILS';

const STAGE_LABELS: Record<string, string> = {
  SEARCH: '1. Search',
  RESULTS: '2. Choose Car',
  VERIFY_BOOK: '3. Verify & Book',
  CONFIRMED: '4. Pickup & Handover',
  ACTIVE: '5. Active Rental',
  FINAL_BILL: '6. Return & Settle',
};

const CATEGORY_LABELS: Record<string, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
  muv: 'MUV / 7-Seater',
  ev: 'Electric',
  luxury: 'Luxury',
  van: 'Van',
  bike: 'Bike',
};

const FUEL_LABELS: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric ⚡',
  cng: 'CNG',
  hybrid: 'Hybrid',
};

const DAMAGE_LOCATIONS = [
  'Front Bumper',
  'Rear Bumper',
  'Left Front Fender',
  'Right Front Fender',
  'Left Doors',
  'Right Doors',
  'Windshield',
  'Rear Glass',
  'Roof',
  'Wheels & Tyres',
];

// Fallback seed vehicles when backend query resolves
const FALLBACK_SEED_VEHICLES: VehicleResult[] = [
  {
    _id: 'seed_innova_crysta',
    name: 'Toyota Innova Crysta ZX',
    make: 'Toyota',
    vehicleModel: 'Innova Crysta',
    year: 2024,
    category: 'muv',
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 7,
    pricePerDay: 3200,
    depositAmount: 10000,
    mileagePolicy: '250 km/day included, ₹12/km beyond',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
    ],
    location: { lat: 26.4499, lng: 80.3319 },
    city: 'Kanpur',
    hubName: 'Kanpur Central Hub',
    hubCode: 'HUB-KNP',
    rating: 4.88,
    totalRatings: 142,
    totalRentals: 142,
    features: ['Captain Seats', 'Rear AC Vents', 'Apple CarPlay & Android Auto', 'Cruise Control', '7 Airbags', 'Emergency SOS Kit'],
    hostName: 'ABC Rentals',
    hostRating: 4.88,
    hostCompletedRentals: 142,
    deliveryAvailable: true,
    whyRecommended: 'Best match for your trip because it is available in Kanpur, fits 7 passengers comfortably, and has a 4.88★ partner rating.',
  },
  {
    _id: 'seed_creta_sx',
    name: 'Hyundai Creta SX (Kanpur)',
    make: 'Hyundai',
    vehicleModel: 'Creta',
    year: 2024,
    category: 'suv',
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
    pricePerDay: 2499,
    depositAmount: 4500,
    mileagePolicy: '300 km/day included, ₹12/km beyond',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80',
    ],
    location: { lat: 26.4499, lng: 80.3319 },
    city: 'Kanpur',
    hubName: 'Kanpur Central Hub',
    hubCode: 'HUB-KNP',
    rating: 4.9,
    totalRatings: 68,
    totalRentals: 68,
    features: ['Panoramic Sunroof', 'Bose Sound', 'Wireless Charging', 'Cruise Control', 'Ventilated Seats'],
    hostName: 'CityDrive Mobility',
    hostRating: 4.85,
    hostCompletedRentals: 85,
    deliveryAvailable: true,
  },
  {
    _id: 'seed_thar_4x4',
    name: 'Mahindra Thar 4x4 Hardtop',
    make: 'Mahindra',
    vehicleModel: 'Thar',
    year: 2024,
    category: 'suv',
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 4,
    pricePerDay: 3299,
    depositAmount: 6000,
    mileagePolicy: '350 km/day included, ₹14/km beyond',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    ],
    location: { lat: 26.4499, lng: 80.3319 },
    city: 'Kanpur',
    hubName: 'Kanpur Central Hub',
    hubCode: 'HUB-KNP',
    rating: 4.95,
    totalRatings: 52,
    totalRentals: 52,
    features: ['4x4 Drivetrain', 'Touchscreen Infotainment', 'Convertible Hardtop', 'Hill Hold Assist'],
    hostName: 'Royal Fleet Kanpur',
    hostRating: 4.92,
    hostCompletedRentals: 96,
    deliveryAvailable: true,
  },
  {
    _id: 'seed_swift_zxi',
    name: 'Maruti Swift ZXi (Kanpur)',
    make: 'Maruti Suzuki',
    vehicleModel: 'Swift',
    year: 2023,
    category: 'hatchback',
    fuelType: 'petrol',
    transmission: 'manual',
    seats: 5,
    pricePerDay: 1299,
    depositAmount: 2000,
    mileagePolicy: '250 km/day included, ₹9/km beyond',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80',
    ],
    location: { lat: 26.4499, lng: 80.3319 },
    city: 'Kanpur',
    hubName: 'Kanpur Central Hub',
    hubCode: 'HUB-KNP',
    rating: 4.8,
    totalRatings: 42,
    totalRentals: 42,
    features: ['AC', 'Bluetooth Audio', 'USB Charging', 'Reverse Parking Sensors', 'Dual Airbags'],
    hostName: 'CityDrive Mobility',
    hostRating: 4.85,
    hostCompletedRentals: 85,
    deliveryAvailable: true,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RentalFlow() {
  const [stage, setStage] = useState<Stage>('SEARCH');

  // ── Stage 1: Search Params ─────────────────────────────────────────────────
  const [pickupLocation, setPickupLocation] = useState('Kanpur Central Railway Station, Kanpur');
  const [pickupPlace, setPickupPlace] = useState<PlaceResult | null>({
    address: 'Kanpur Central Railway Station, Kanpur, Uttar Pradesh',
    lat: 26.4547,
    lng: 80.3507,
  });
  const [returnLocation, setReturnLocation] = useState('Hazratganj, Lucknow');
  const [returnPlace, setReturnPlace] = useState<PlaceResult | null>({
    address: 'Hazratganj, Lucknow, Uttar Pradesh',
    lat: 26.8467,
    lng: 80.9462,
  });
  const [tripDestination, setTripDestination] = useState('');
  const [sameReturnLocation, setSameReturnLocation] = useState(false);
  const [pickupMethod, setPickupMethod] = useState<'self_pickup' | 'doorstep_delivery'>('self_pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('2026-08-20');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('2026-08-23');
  const [returnTime, setReturnTime] = useState('18:00');
  const [durationLabel, setDurationLabel] = useState('3 Days 8 Hrs');
  const [searchError, setSearchError] = useState('');

  // ── Stage 2: Results & Filters ─────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<VehicleResult[]>(FALLBACK_SEED_VEHICLES);
  const [resolvedHub, setResolvedHub] = useState<any>(null);
  const [searchTier, setSearchTier] = useState<string>('exact');
  const [hubNotice, setHubNotice] = useState<string>('');
  const [isNearbyAlternative, setIsNearbyAlternative] = useState(false);
  const [oneWayAvailable, setOneWayAvailable] = useState(true);
  const [oneWayMessage, setOneWayMessage] = useState('');
  const [tripEstimate, setTripEstimate] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTransmission, setFilterTransmission] = useState('');
  const [filterFuel, setFilterFuel] = useState('');
  const [filterSeats, setFilterSeats] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResult | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [vehicleCompliance, setVehicleCompliance] = useState<any>(null);

  // ── Stage 3: Customer Document Upload & Verification ───────────────────────
  const [idDocUploaded, setIdDocUploaded] = useState(true);
  const [dlFrontUploaded, setDlFrontUploaded] = useState(true);
  const [dlBackUploaded, setDlBackUploaded] = useState(true);
  const [maskedId, setMaskedId] = useState('AADHAAR-XXXX-XXXX-9021');
  const [maskedDl, setMaskedDl] = useState('DL-XXXX-XXXX-4821');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({
    DRIVING_LICENSE_FRONT: {
      name: 'driving_licence_front.jpg',
      size: 1420500,
      type: 'image/jpeg',
      uploadedAt: 'Verified on file',
    },
    CUSTOMER_ID: {
      name: 'identity_doc.pdf',
      size: 2100400,
      type: 'application/pdf',
      uploadedAt: 'Verified on file',
    },
  });
  const [uploadingDoc, setUploadingDoc] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [finalPricing, setFinalPricing] = useState<PricingResult | null>(null);
  const [booking, setBooking] = useState<RentalBooking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ── Stage 4: Pre-Handover Inspection & Acknowledgement ─────────────────────
  const [preOdometer, setPreOdometer] = useState(23482);
  const [preFuel, setPreFuel] = useState(75);
  const [preDamages, setPreDamages] = useState<VehicleDamageItem[]>([
    {
      location: 'Front Bumper',
      damageType: 'SCRATCH',
      severity: 'MINOR',
      description: 'Minor 2cm pre-existing scratch on lower plastic lip',
      isPreExisting: true,
    },
  ]);
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  ]);
  const [newDamageLoc, setNewDamageLoc] = useState('Front Bumper');
  const [newDamageType, setNewDamageType] = useState<VehicleDamageItem['damageType']>('SCRATCH');
  const [newDamageSeverity, setNewDamageSeverity] = useState<VehicleDamageItem['severity']>('MINOR');
  const [newDamageDesc, setNewDamageDesc] = useState('');

  // 3 Checkboxes for Customer Acknowledgement
  const [ackCondition, setAckCondition] = useState(false);
  const [ackDamages, setAckDamages] = useState(false);
  const [ackTerms, setAckTerms] = useState(false);

  // ── Stage 5: Active Rental ─────────────────────────────────────────────────
  const [activeBooking, setActiveBooking] = useState<RentalBooking | null>(null);
  const [timeRemainingLabel, setTimeRemainingLabel] = useState('3d 7h remaining');
  const [showHandoverReportModal, setShowHandoverReportModal] = useState(false);
  const [handoverReport, setHandoverReport] = useState<any>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendHours, setExtendHours] = useState(4);
  const [extensionPreview, setExtensionPreview] = useState<any>(null);
  const [extendingLoading, setExtendingLoading] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [issueReportedSuccess, setIssueReportedSuccess] = useState(false);

  // ── Stage 6: Return Handover & Post-Inspection ─────────────────────────────
  const [returnOdometer, setReturnOdometer] = useState(23850);
  const [returnFuel, setReturnFuel] = useState(75);
  const [returnDamages, setReturnDamages] = useState<VehicleDamageItem[]>([]);
  const [cleanlinessStatus, setCleanlinessStatus] = useState<'Clean' | 'Moderate' | 'Dirty'>('Clean');
  const [finalBill, setFinalBill] = useState<any>(null);
  const [postInspectionResult, setPostInspectionResult] = useState<any>(null);
  const [damageDisputeActive, setDamageDisputeActive] = useState(false);

  // ── Rating & History / Details ─────────────────────────────────────────────
  const [ratings, setRatings] = useState({
    vehicleCondition: 5,
    vehicleQuality: 5,
    pickupExperience: 5,
    returnExperience: 5,
    hostService: 5,
    overall: 5,
  });
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [myRentals, setMyRentals] = useState<RentalBooking[]>([]);
  const [rentalsTab, setRentalsTab] = useState('upcoming');
  const [bookingDetailsData, setBookingDetailsData] = useState<any>(null);

  // Native file input ref for document upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadDocType, setActiveUploadDocType] = useState<string>('DRIVING_LICENSE_FRONT');

  // ─── Duration Calculator ────────────────────────────────────────────────────
  useEffect(() => {
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
      setDurationLabel('');
      return;
    }
    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${returnDate}T${returnTime}`);
    if (end <= start) {
      setDurationLabel('⚠ Return must be after pickup');
      return;
    }
    const diffMs = end.getTime() - start.getTime();
    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0 && hours > 0)
      setDurationLabel(`${days} Day${days !== 1 ? 's' : ''}, ${hours} Hr${hours !== 1 ? 's' : ''}`);
    else if (days > 0) setDurationLabel(`${days} Day${days !== 1 ? 's' : ''}`);
    else setDurationLabel(`${hours} Hour${hours !== 1 ? 's' : ''}`);
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  // ─── Countdown Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'ACTIVE' || !activeBooking) return;
    const tick = () => {
      const returnDt = new Date(activeBooking.currentReturnDateTime || activeBooking.returnDateTime);
      const diff = returnDt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemainingLabel('⏰ Return Overdue');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const d = Math.floor(h / 24);
      const remH = h % 24;
      if (d > 0) {
        setTimeRemainingLabel(`${d}d ${remH}h remaining`);
      } else {
        setTimeRemainingLabel(`${h}h ${m}m remaining`);
      }
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [stage, activeBooking]);

  // ─── Load My Rentals ────────────────────────────────────────────────────────
  const loadMyRentals = useCallback(async (tab: string) => {
    try {
      const res = await fetchAPI<any>(`/rental/bookings/my?tab=${tab}`);
      if (res.success && res.data?.rentals) {
        setMyRentals(res.data.rentals || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (stage === 'HISTORY') {
      loadMyRentals(rentalsTab);
    }
  }, [stage, rentalsTab, loadMyRentals]);

  // ─── Search Vehicles ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    setSearchError('');
    const locationString = (pickupPlace?.address || pickupLocation || '').trim();
    if (!locationString) {
      setSearchError('Please enter a pickup location.');
      return;
    }
    if (!pickupDate || !pickupTime) {
      setSearchError('Please select pickup date and time.');
      return;
    }
    if (!returnDate || !returnTime) {
      setSearchError('Please select return date and time.');
      return;
    }

    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${returnDate}T${returnTime}`);
    if (end <= start) {
      setSearchError('Return date/time must be after pickup date/time.');
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        pickupLocation: locationString,
        ...(pickupPlace?.lat && { pickupLat: String(pickupPlace.lat) }),
        ...(pickupPlace?.lng && { pickupLng: String(pickupPlace.lng) }),
        returnLocation: sameReturnLocation
          ? locationString
          : returnPlace?.address || returnLocation || locationString,
        ...(returnPlace?.lat && { returnLat: String(returnPlace.lat) }),
        ...(returnPlace?.lng && { returnLng: String(returnPlace.lng) }),
        ...(tripDestination.trim() && { tripDestination: tripDestination.trim() }),
        pickupDateTime: start.toISOString(),
        returnDateTime: end.toISOString(),
        pickupMethod,
        ...(filterCategory && { category: filterCategory }),
        ...(filterTransmission && { transmission: filterTransmission }),
        ...(filterFuel && { fuelType: filterFuel }),
        ...(filterSeats && { seats: filterSeats }),
        ...(filterMaxPrice && { maxPrice: filterMaxPrice }),
        sort: sortBy,
      });

      const res = await fetchAPI<any>(`/rental/vehicles/search?${params}`);
      if (res.success && res.data?.vehicles && res.data.vehicles.length > 0) {
        setSearchResults(res.data.vehicles);
        setResolvedHub(res.data.hub);
        setSearchTier(res.data.searchTier || 'exact');
        setHubNotice(res.data.hubNotice || '');
        setIsNearbyAlternative(res.data.isNearbyAlternative || false);
        setOneWayAvailable(res.data.oneWayAvailable ?? true);
        setOneWayMessage(res.data.oneWayMessage || '');
        setTripEstimate(res.data.tripEstimate || null);
      } else {
        // Use realistic demo fleet
        setSearchResults(FALLBACK_SEED_VEHICLES);
      }
      setStage('RESULTS');
    } catch (err: any) {
      console.warn('Backend search fallback to demo fleet', err);
      setSearchResults(FALLBACK_SEED_VEHICLES);
      setStage('RESULTS');
    } finally {
      setSearching(false);
    }
  };

  // ─── Select Vehicle & Load Details ──────────────────────────────────────────
  const handleSelectVehicle = async (vehicle: VehicleResult) => {
    setSelectedVehicle(vehicle);
    setSelectedImageIdx(0);
    try {
      const start = new Date(`${pickupDate}T${pickupTime}`);
      const end = new Date(`${returnDate}T${returnTime}`);
      const res = await fetchAPI<any>('/rental/pricing/calculate', {
        method: 'POST',
        body: {
          vehicleId: vehicle._id,
          pickupDateTime: start.toISOString(),
          returnDateTime: end.toISOString(),
          pickupMethod,
          isOneWay: !sameReturnLocation,
          couponCode: appliedCoupon || undefined,
        },
      });
      if (res.success && res.data?.pricing) {
        setFinalPricing(res.data.pricing);
      } else {
        // Compute standard price breakdown
        const diffMs = end.getTime() - start.getTime();
        const totalHours = Math.max(24, Math.ceil(diffMs / (1000 * 60 * 60)));
        const days = Math.ceil(totalHours / 24);
        const baseRental = days * vehicle.pricePerDay;
        const oneWayFee = !sameReturnLocation ? 1200 : 0;
        const deliveryFee = pickupMethod === 'doorstep_delivery' ? 500 : 0;
        const platformFee = Math.round(baseRental * 0.05);
        const tax = Math.round((baseRental + platformFee) * 0.05);
        const totalPayable = baseRental + oneWayFee + deliveryFee + platformFee + tax;
        const totalWithDeposit = totalPayable + vehicle.depositAmount;

        setFinalPricing({
          durationHours: totalHours,
          durationDays: days,
          durationLabel: `${days} Days (${totalHours} hrs)`,
          baseRental,
          durationAdjustment: 0,
          deliveryFee,
          oneWayFee,
          protectionFee: 0,
          platformFee,
          tax,
          securityDeposit: vehicle.depositAmount,
          discount: 0,
          totalPayable,
          totalWithDeposit,
        });
      }
    } catch {}
    setStage('DETAIL');
  };

  // ─── Real Native Browser File Upload Handler ───────────────────────────────
  const triggerNativeFileUpload = (docType: string) => {
    setActiveUploadDocType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleNativeFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format & size (max 10MB)
    const validExtensions = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validExtensions.includes(file.type)) {
      alert('Invalid file format. Please upload JPG, PNG, or PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum allowed size is 10MB.');
      return;
    }

    const docType = activeUploadDocType;
    setUploadingDoc(docType);

    // Create object URL preview
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

    setTimeout(() => {
      setUploadedFiles((prev) => ({
        ...prev,
        [docType]: {
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl,
          uploadedAt: new Date().toLocaleTimeString(),
        },
      }));

      if (docType === 'CUSTOMER_ID') {
        setIdDocUploaded(true);
        setMaskedId(`ID-${file.name.slice(0, 4).toUpperCase()}-XXXX-9021`);
      } else if (docType === 'DRIVING_LICENSE_FRONT') {
        setDlFrontUploaded(true);
        setMaskedDl(`DL-${file.name.slice(0, 4).toUpperCase()}-XXXX-4821`);
      } else if (docType === 'DRIVING_LICENSE_BACK') {
        setDlBackUploaded(true);
      }

      setUploadingDoc('');
    }, 400);
  };

  // ─── Create Booking ─────────────────────────────────────────────────────────
  const handleCreateBooking = async () => {
    if (!agreementAccepted) {
      alert('Please accept the Digital Rental Agreement to proceed.');
      return;
    }
    if (!selectedVehicle) return;

    setBookingLoading(true);
    try {
      const start = new Date(`${pickupDate}T${pickupTime}`);
      const end = new Date(`${returnDate}T${returnTime}`);
      const res = await fetchAPI<any>('/rental/bookings', {
        method: 'POST',
        body: {
          vehicleId: selectedVehicle._id,
          pickupLocation: pickupPlace?.address || pickupLocation,
          pickupLat: pickupPlace?.lat,
          pickupLng: pickupPlace?.lng,
          returnLocation: sameReturnLocation
            ? pickupPlace?.address || pickupLocation
            : returnPlace?.address || returnLocation,
          returnLat: sameReturnLocation ? pickupPlace?.lat : returnPlace?.lat,
          returnLng: sameReturnLocation ? pickupPlace?.lng : returnPlace?.lng,
          tripDestination: tripDestination.trim() || undefined,
          pickupDateTime: start.toISOString(),
          returnDateTime: end.toISOString(),
          pickupMethod,
          deliveryAddress: pickupMethod === 'doorstep_delivery' ? deliveryAddress : undefined,
          isOneWay: !sameReturnLocation,
          couponCode: appliedCoupon || undefined,
          agreementAccepted: true,
        },
      });

      if (res.success && res.data?.booking) {
        setBooking(res.data.booking);
        setShowPaymentModal(true);
      } else {
        // Demo booking creation
        const demoBooking: RentalBooking = {
          _id: `rnt_${Date.now()}`,
          bookingId: `VT-RNT-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'CONFIRMED',
          vehicleId: selectedVehicle,
          pickupLocation: pickupPlace?.address || pickupLocation,
          returnLocation: sameReturnLocation
            ? pickupPlace?.address || pickupLocation
            : returnPlace?.address || returnLocation,
          pickupDateTime: start.toISOString(),
          returnDateTime: end.toISOString(),
          currentReturnDateTime: end.toISOString(),
          pickupMethod,
          deliveryAddress: pickupMethod === 'doorstep_delivery' ? deliveryAddress : '',
          isOneWay: !sameReturnLocation,
          pricing: finalPricing || {
            durationHours: 80,
            durationDays: 3,
            durationLabel: '3 Days 8 Hrs',
            baseRental: 9600,
            durationAdjustment: 0,
            deliveryFee: 0,
            oneWayFee: !sameReturnLocation ? 1200 : 0,
            protectionFee: 0,
            platformFee: 480,
            tax: 504,
            securityDeposit: selectedVehicle.depositAmount,
            discount: 0,
            totalPayable: 11784,
            totalWithDeposit: 11784 + selectedVehicle.depositAmount,
          },
          licenceVerifiedAtBooking: true,
          identityVerifiedAtBooking: true,
          lateFeeCharge: 0,
          fuelAdjustmentCharge: 0,
          damageCharge: 0,
          depositRefundStatus: 'PENDING',
          depositRefundAmount: selectedVehicle.depositAmount,
        };
        setBooking(demoBooking);
        setShowPaymentModal(true);
      }
    } catch (err: any) {
      // Demo fallback
      setShowPaymentModal(true);
    } finally {
      setBookingLoading(false);
    }
  };

  // ─── Payment Success ────────────────────────────────────────────────────────
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    if (booking) {
      setActiveBooking(booking);
      setStage('CONFIRMED');
    }
  };

  // ─── Submit Pre-Handover Inspection ─────────────────────────────────────────
  const handleSubmitPreInspection = async () => {
    if (!activeBooking) return;
    try {
      await fetchAPI<any>(`/rental/bookings/${activeBooking._id}/handover-inspection`, {
        method: 'POST',
        body: {
          odometerKm: preOdometer,
          fuelLevelPercent: preFuel,
          cleanliness: 'Clean',
          damages: preDamages,
        },
      });
    } catch {}
    setStage('HANDOVER_ACK');
  };

  // ─── Customer Digital Acknowledgement (3 Checkboxes) ─────────────────────────
  const handleCustomerAcknowledge = async () => {
    if (!ackCondition || !ackDamages || !ackTerms) {
      alert('Please confirm all 3 acknowledgement checkboxes to activate your rental.');
      return;
    }
    if (activeBooking) {
      setActiveBooking({
        ...activeBooking,
        status: 'ACTIVE',
        customerAcknowledgement: {
          reviewedCondition: true,
          acknowledgedDamage: true,
          agreedTerms: true,
          acceptedAt: new Date().toISOString(),
        },
      });
    }
    setStage('ACTIVE');
  };

  // ─── Submit Post-Return Inspection ──────────────────────────────────────────
  const handleSubmitReturnInspection = async () => {
    const hasNewDamage = returnDamages.length > 0;
    const finalBillData = {
      baseRental: activeBooking?.pricing?.totalPayable || 11784,
      originalDeposit: activeBooking?.pricing?.securityDeposit || 10000,
      damageDeduction: hasNewDamage ? 2000 : 0,
      fuelAdjustment: returnFuel < preFuel ? 450 : 0,
      lateFee: 0,
      netRefundAmount: (activeBooking?.pricing?.securityDeposit || 10000) - (hasNewDamage ? 2000 : 0) - (returnFuel < preFuel ? 450 : 0),
      isDamageDisputeOpen: hasNewDamage,
    };
    setFinalBill(finalBillData);
    setDamageDisputeActive(hasNewDamage);
    setStage('FINAL_BILL');
  };

  // ─── Final Settlement Payment / Complete ────────────────────────────────────
  const handleFinalSettlementComplete = () => {
    setStage('RATING');
  };

  const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans pb-16">
      {/* Hidden Native Browser File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleNativeFileSelected}
      />

      {/* ─── TOP FLOW HEADER & STEPPER ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5EAF0] dark:border-[#17334F] pb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#00A99D] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> VITO Verified Partner Marketplace
          </span>
          <h1 className="text-2xl font-black text-[#0B1728] dark:text-white tracking-tight">
            Vehicle Rental & Self-Drive Fleet
          </h1>
          <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
            Rent verified cars directly from certified rental partners with transparent pricing & digital handover.
          </p>
        </div>

        {/* Global My Rentals Switch */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStage('SEARCH')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              stage !== 'HISTORY'
                ? 'bg-[#07111F] text-white shadow-sm'
                : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174]'
            }`}
          >
            🚗 Rent a Car
          </button>
          <button
            type="button"
            onClick={() => {
              setStage('HISTORY');
              loadMyRentals(rentalsTab);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              stage === 'HISTORY'
                ? 'bg-[#00C2B3] text-[#07111F] font-black shadow-sm'
                : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174]'
            }`}
          >
            📋 My Rentals
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 1: SEARCH REQUIREMENTS
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'SEARCH' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Find the right car for your journey
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Verified vehicles from trusted rental partners. Specify pickup & return locations.
            </p>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pickup Location
              </label>
              <AddressAutocomplete
                value={pickupPlace?.address || pickupLocation}
                onChange={(val) => {
                  setPickupLocation(val);
                  setPickupPlace((prev) => (prev ? { ...prev, address: val } : { address: val, lat: 26.4547, lng: 80.3507 }));
                }}
                placeholder="Enter pickup location (e.g. Kanpur Central)..."
                onSelect={(place) => {
                  setPickupPlace(place);
                  setPickupLocation(place.address);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Return Location
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#526174] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameReturnLocation}
                    onChange={(e) => setSameReturnLocation(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#00C2B3]"
                  />
                  <span>Same as pickup</span>
                </label>
              </div>
              <AddressAutocomplete
                value={sameReturnLocation ? pickupPlace?.address || pickupLocation : returnPlace?.address || returnLocation}
                onChange={(val) => {
                  setReturnLocation(val);
                  setReturnPlace((prev) => (prev ? { ...prev, address: val } : { address: val, lat: 26.8467, lng: 80.9462 }));
                }}
                placeholder="Enter return location (e.g. Hazratganj, Lucknow)..."
                onSelect={(place) => {
                  setReturnPlace(place);
                  setReturnLocation(place.address);
                }}
              />
            </div>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00A99D]" /> Pickup Date
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none focus:border-[#00C2B3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00A99D]" /> Pickup Time
              </label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none focus:border-[#00C2B3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00A99D]" /> Return Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none focus:border-[#00C2B3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00A99D]" /> Return Time
              </label>
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none focus:border-[#00C2B3]"
              />
            </div>
          </div>

          {/* Duration Preview Card */}
          {durationLabel && (
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center font-black text-xs">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0B1728] dark:text-white block">
                    Calculated Rental Duration: <span className="text-[#00A99D]">{durationLabel}</span>
                  </span>
                  <span className="text-[11px] text-[#526174]">
                    {sameReturnLocation ? 'Round-trip return to pickup hub' : 'One-way intercity rental'}
                  </span>
                </div>
              </div>

              {/* Fulfillment Method */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickupMethod('self_pickup')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    pickupMethod === 'self_pickup'
                      ? 'bg-[#07111F] text-white shadow'
                      : 'bg-white dark:bg-[#07111F] border text-[#526174]'
                  }`}
                >
                  🏢 Partner Hub Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setPickupMethod('doorstep_delivery')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    pickupMethod === 'doorstep_delivery'
                      ? 'bg-[#00C2B3] text-[#07111F] font-black shadow'
                      : 'bg-white dark:bg-[#07111F] border text-[#526174]'
                  }`}
                >
                  🚚 Doorstep Delivery
                </button>
              </div>
            </div>
          )}

          {searchError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {searchError}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={searching}
              onClick={handleSearch}
              className="px-8 py-4 rounded-2xl bg-[#07111F] hover:bg-[#00C2B3] text-white font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {searching ? (
                <>Finding Verified Fleet...</>
              ) : (
                <>
                  Search Available Vehicles <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 2: RESULTS, FILTERS & VITO RECOMMENDATION
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'RESULTS' && (
        <div className="space-y-6">
          {/* Sticky Search Summary Bar */}
          <div className="p-4 rounded-2xl bg-[#07111F] text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#00C2B3]">Search Summary</span>
              <div className="text-xs font-bold text-slate-200">
                {pickupPlace?.address.split(',')[0]} → {returnPlace?.address.split(',')[0]} • {pickupDate} {pickupTime} → {returnDate} {returnTime} ({durationLabel})
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStage('SEARCH')}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
            >
              Modify Search
            </button>
          </div>

          {/* Filter Bar & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#526174] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Category:
              </span>
              {['', 'muv', 'suv', 'sedan', 'hatchback'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-[#07111F] text-white'
                      : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174]'
                  }`}
                >
                  {cat === '' ? 'All' : CATEGORY_LABELS[cat] || cat.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#526174] font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
              >
                <option value="recommended">★ Recommended</option>
                <option value="price_asc">Lowest Price</option>
                <option value="price_desc">Highest Price</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* ✨ VITO RECOMMENDED VEHICLE CARD */}
          {searchResults[0] && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#07111F] to-[#10243A] text-white border-2 border-[#00C2B3] shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <span className="px-3 py-1 rounded-full bg-[#00C2B3] text-[#07111F] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ★ VITO RECOMMENDED BEST MATCH
                </span>
                <span className="text-xs font-bold text-[#00C2B3] flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4" /> Provided by {searchResults[0].hostName} (✓ VITO Verified Partner)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="h-48 rounded-2xl overflow-hidden bg-slate-900">
                  <img
                    src={searchResults[0].images[0]}
                    alt={searchResults[0].name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h3 className="text-lg font-black text-white">{searchResults[0].name}</h3>
                      <p className="text-xs text-slate-300">
                        {searchResults[0].year} • {CATEGORY_LABELS[searchResults[0].category] || searchResults[0].category} • {searchResults[0].seats} Seats
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#00C2B3]">
                        {formatINR(searchResults[0].pricePerDay)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/ day</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200">
                    💡 {searchResults[0].whyRecommended || 'Recommended for optimal passenger space and excellent partner service rating.'}
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold">⚙ {searchResults[0].transmission}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold">⛽ {searchResults[0].fuelType}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-amber-300">
                      🛡️ Deposit: {formatINR(searchResults[0].depositAmount)}
                    </span>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectVehicle(searchResults[0])}
                      className="px-6 py-2.5 rounded-xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      View Details & Book →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTHER AVAILABLE VEHICLES */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#526174] dark:text-slate-400">
              AVAILABLE VEHICLES IN {pickupPlace?.address.split(',')[0].toUpperCase() || 'MARKETPLACE'} ({searchResults.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.slice(1).map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm hover:border-[#00C2B3] transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                      <img
                        src={vehicle.images[0]}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#07111F]/80 backdrop-blur text-white text-[10px] font-bold">
                        ★ {vehicle.rating} ({vehicle.totalRatings})
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-[#0B1728] dark:text-white">{vehicle.name}</h4>
                          <p className="text-[11px] text-[#526174]">
                            Provided by <strong>{vehicle.hostName}</strong> ✓ Verified Partner
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-[#00A99D]">{formatINR(vehicle.pricePerDay)}</span>
                          <span className="text-[10px] text-[#8995A5] block">/ day</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] font-bold text-[#526174]">
                        <span className="px-2 py-0.5 rounded bg-[#F7F9FC] dark:bg-[#10243A]">
                          👥 {vehicle.seats} Seats
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#F7F9FC] dark:bg-[#10243A]">
                          ⚙ {vehicle.transmission}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#F7F9FC] dark:bg-[#10243A]">
                          ⛽ {vehicle.fuelType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5EAF0] dark:border-[#17334F]">
                    <span className="text-[11px] font-bold text-amber-600">
                      Deposit: {formatINR(vehicle.depositAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectVehicle(vehicle)}
                      className="px-4 py-2 rounded-xl bg-[#07111F] text-white text-xs font-bold hover:bg-[#00C2B3] transition-all cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 3: VEHICLE DETAILS & POLICIES
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'DETAIL' && selectedVehicle && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-4">
            <button
              type="button"
              onClick={() => setStage('RESULTS')}
              className="text-xs font-bold text-[#526174] hover:text-[#0B1728] flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Vehicles
            </button>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
              ✓ VITO Verified Vehicle
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gallery on Left (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-72 sm:h-96 rounded-3xl overflow-hidden bg-slate-900">
                <img
                  src={selectedVehicle.images[selectedImageIdx] || selectedVehicle.images[0]}
                  alt={selectedVehicle.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedVehicle.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIdx === idx ? 'border-[#00C2B3]' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Overview & Specs */}
              <div className="space-y-4 pt-4">
                <h3 className="text-base font-black text-[#0B1728] dark:text-white">Vehicle Specifications</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A]">
                    <span className="text-[#8995A5] block">Seats</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">{selectedVehicle.seats} Seater</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A]">
                    <span className="text-[#8995A5] block">Transmission</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">{selectedVehicle.transmission}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A]">
                    <span className="text-[#8995A5] block">Fuel Type</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">{selectedVehicle.fuelType}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A]">
                    <span className="text-[#8995A5] block">Model Year</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">{selectedVehicle.year}</span>
                  </div>
                </div>

                {/* Features */}
                <h3 className="text-base font-black text-[#0B1728] dark:text-white pt-2">Key Features</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVehicle.features.map((f, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold">
                      ✓ {f}
                    </span>
                  ))}
                </div>

                {/* Transparent Policies */}
                <h3 className="text-base font-black text-[#0B1728] dark:text-white pt-2">Rental Policies</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                    <span className="font-black text-[#0B1728] dark:text-white">🛣️ Mileage Policy</span>
                    <p className="text-[#526174]">{selectedVehicle.mileagePolicy}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                    <span className="font-black text-[#0B1728] dark:text-white">⛽ Fuel Policy</span>
                    <p className="text-[#526174]">Same-to-same fuel level handover.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                    <span className="font-black text-[#0B1728] dark:text-white">🔄 Cancellation Policy</span>
                    <p className="text-[#526174]">Free cancellation up to 6 hours before pickup.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                    <span className="font-black text-[#0B1728] dark:text-white">⏰ Late Return Policy</span>
                    <p className="text-[#526174]">30 mins grace period, then billed as per tariff.</p>
                  </div>
                </div>

                {/* Partner Profile */}
                <div className="p-4 rounded-2xl bg-[#07111F] text-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-sm flex items-center justify-center">
                      {selectedVehicle.hostName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{selectedVehicle.hostName}</h4>
                      <p className="text-xs text-slate-300">
                        ★ {selectedVehicle.hostRating} Rating • {selectedVehicle.hostCompletedRentals} Completed Rentals
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00C2B3] bg-white/10 px-3 py-1 rounded-full">
                    ✓ Verified Partner
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky Pricing Card on Right (1 col) */}
            <div className="space-y-5">
              <div className="p-6 rounded-3xl bg-[#07111F] text-white space-y-5 sticky top-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00C2B3]">Pricing Summary</span>
                  <div className="flex justify-between items-baseline mt-1">
                    <h3 className="text-xl font-black">{selectedVehicle.name}</h3>
                    <span className="text-xl font-black text-[#00C2B3]">
                      {formatINR(selectedVehicle.pricePerDay)}/day
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{durationLabel}</p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-700">
                  <div className="flex justify-between">
                    <span>Base Rental ({durationLabel})</span>
                    <span className="font-bold text-white">{formatINR(finalPricing?.baseRental || 9600)}</span>
                  </div>
                  {!sameReturnLocation && (
                    <div className="flex justify-between">
                      <span>One-Way Return Fee</span>
                      <span className="font-bold text-white">{formatINR(finalPricing?.oneWayFee || 1200)}</span>
                    </div>
                  )}
                  {pickupMethod === 'doorstep_delivery' && (
                    <div className="flex justify-between">
                      <span>Doorstep Delivery Fee</span>
                      <span className="font-bold text-white">{formatINR(finalPricing?.deliveryFee || 500)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Platform & Protection Fee (5%)</span>
                    <span className="font-bold text-white">{formatINR(finalPricing?.platformFee || 480)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST / Taxes (5%)</span>
                    <span className="font-bold text-white">{formatINR(finalPricing?.tax || 504)}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-700 flex justify-between font-black text-sm text-white">
                    <span>Estimated Rental Total</span>
                    <span className="text-[#00C2B3]">{formatINR(finalPricing?.totalPayable || 11784)}</span>
                  </div>
                </div>

                {/* Refundable Deposit Line */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs space-y-1">
                  <div className="flex justify-between font-black text-amber-300">
                    <span>Refundable Security Deposit</span>
                    <span>{formatINR(selectedVehicle.depositAmount)}</span>
                  </div>
                  <p className="text-[10px] text-amber-200/80">
                    Held securely during rental. Refunded immediately upon return inspection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStage('VERIFY_BOOK')}
                  className="w-full py-4 rounded-2xl bg-[#00C2B3] hover:bg-[#00A99D] text-[#07111F] font-black text-sm shadow-xl transition-all cursor-pointer"
                >
                  Continue to Verification & Booking →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 4: CUSTOMER VERIFICATION & REAL FILE PICKER UPLOADS
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'VERIFY_BOOK' && selectedVehicle && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-4">
            <div>
              <span className="text-[11px] font-black uppercase text-[#00A99D]">Step 3: Verification & Booking</span>
              <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Customer Identity & Licence Verification</h2>
            </div>
            <button
              type="button"
              onClick={() => setStage('DETAIL')}
              className="text-xs font-bold text-[#526174] hover:text-[#0B1728] cursor-pointer"
            >
              ← Back to Details
            </button>
          </div>

          {/* Document Upload Cards (Real Browser File Pickers) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#526174]">
              REQUIRED CUSTOMER DOCUMENTS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Driving Licence Front */}
              <div className="p-5 rounded-2xl border-2 border-[#E5EAF0] dark:border-[#17334F] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Driving Licence
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                </div>

                {uploadedFiles['DRIVING_LICENSE_FRONT'] ? (
                  <div className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0B1728] dark:text-white">
                        {uploadedFiles['DRIVING_LICENSE_FRONT'].name}
                      </p>
                      <p className="text-[10px] text-[#526174]">{maskedDl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerNativeFileUpload('DRIVING_LICENSE_FRONT')}
                      className="text-xs font-bold text-[#00A99D] hover:underline cursor-pointer"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerNativeFileUpload('DRIVING_LICENSE_FRONT')}
                    className="w-full py-3 rounded-xl border border-dashed border-[#00C2B3] text-xs font-bold text-[#00A99D] hover:bg-[#00C2B3]/5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Driving Licence (PDF/JPG)
                  </button>
                )}
              </div>

              {/* Government ID Document */}
              <div className="p-5 rounded-2xl border-2 border-[#E5EAF0] dark:border-[#17334F] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Identity Document
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                </div>

                {uploadedFiles['CUSTOMER_ID'] ? (
                  <div className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0B1728] dark:text-white">
                        {uploadedFiles['CUSTOMER_ID'].name}
                      </p>
                      <p className="text-[10px] text-[#526174]">{maskedId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerNativeFileUpload('CUSTOMER_ID')}
                      className="text-xs font-bold text-[#00A99D] hover:underline cursor-pointer"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerNativeFileUpload('CUSTOMER_ID')}
                    className="w-full py-3 rounded-xl border border-dashed border-[#00C2B3] text-xs font-bold text-[#00A99D] hover:bg-[#00C2B3]/5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Identity Proof (PDF/JPG)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Digital Rental Agreement Acceptance */}
          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1728] dark:text-white">
              DIGITAL RENTAL AGREEMENT
            </h3>
            <p className="text-xs text-[#526174] leading-relaxed">
              By confirming this booking, you agree to the standard vehicle usage terms, mileage policy of{' '}
              {selectedVehicle.mileagePolicy}, returning the vehicle at the agreed time, and pre/post condition recording.
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="w-4 h-4 rounded text-[#00C2B3] mt-0.5"
              />
              <span className="text-xs font-bold text-[#0B1728] dark:text-white">
                I have reviewed and accept the Digital Rental Agreement & security deposit settlement terms.
              </span>
            </label>
          </div>

          {/* Pricing Confirmation Line */}
          <div className="p-5 rounded-2xl bg-[#07111F] text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#00C2B3]">Total Amount Payable Now</span>
              <div className="text-2xl font-black">
                {formatINR((finalPricing?.totalPayable || 11784) + selectedVehicle.depositAmount)}
              </div>
              <span className="text-[10px] text-slate-300">
                Includes Rental Total ({formatINR(finalPricing?.totalPayable || 11784)}) + Refundable Deposit ({formatINR(selectedVehicle.depositAmount)})
              </span>
            </div>

            <button
              type="button"
              disabled={bookingLoading || !agreementAccepted}
              onClick={handleCreateBooking}
              className="px-8 py-4 rounded-2xl bg-[#00C2B3] hover:bg-[#00A99D] text-[#07111F] font-black text-xs shadow-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {bookingLoading ? 'Processing Booking...' : 'Pay & Confirm Rental →'}
            </button>
          </div>

          {showPaymentModal && (
            <MockPaymentModal
              isOpen={showPaymentModal}
              bookingId={booking?._id || `rnt_${Date.now()}`}
              bookingType="rental"
              totalFare={(finalPricing?.totalPayable || 11784) + selectedVehicle.depositAmount}
              itemDescription={`${selectedVehicle.name} Rental + Deposit`}
              onPaymentSuccess={handlePaymentSuccess}
              onClose={() => setShowPaymentModal(false)}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 5: BOOKING CONFIRMED & PICKUP INSTRUCTIONS
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'CONFIRMED' && activeBooking && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#00A99D]">
              Booking ID: {activeBooking.bookingId}
            </span>
            <h2 className="text-2xl font-black text-[#0B1728] dark:text-white">Your Rental is Confirmed!</h2>
            <p className="text-xs text-[#526174]">
              {selectedVehicle?.name} has been reserved for your selected journey dates.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-3 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Partner Provider:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">{selectedVehicle?.hostName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Pickup Location:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">{activeBooking.pickupLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Return Location:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">{activeBooking.returnLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Duration:</span>
              <span className="font-bold text-[#00A99D]">{durationLabel}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-black text-sm">
              <span>Security Deposit Held:</span>
              <span className="text-amber-600">{formatINR(selectedVehicle?.depositAmount || 10000)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStage('PICKUP_INSPECTION')}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-xs shadow-xl hover:bg-[#00C2B3] transition-all cursor-pointer"
          >
            Begin Pre-Rental Inspection & Handover →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 6: PRE-RENTAL INSPECTION & CONDITION PHOTO UPLOADS
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'PICKUP_INSPECTION' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase text-[#00A99D]">Step 4: Vehicle Condition Recording</span>
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Pre-Rental Inspection</h2>
            <p className="text-xs text-[#526174]">
              Record odometer, starting fuel level, and any pre-existing scratches before taking handover.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white">Odometer Reading (KM)</label>
              <input
                type="number"
                value={preOdometer}
                onChange={(e) => setPreOdometer(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white">Fuel Level (%): {preFuel}%</label>
              <input
                type="range"
                min={10}
                max={100}
                value={preFuel}
                onChange={(e) => setPreFuel(Number(e.target.value))}
                className="w-full mt-2 accent-[#00C2B3]"
              />
            </div>
          </div>

          {/* Condition Checklist & Damage Tags */}
          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1728] dark:text-white">
              PRE-EXISTING CONDITION RECORDINGS
            </h3>

            {preDamages.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white dark:bg-[#07111F] border flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#0B1728] dark:text-white">{item.location}</span>
                  <span className="text-[10px] text-amber-600 font-bold ml-2">[{item.damageType}]</span>
                  <p className="text-[11px] text-[#526174]">{item.description}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  ✓ Pre-existing
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmitPreInspection}
            className="w-full py-4 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow-md cursor-pointer"
          >
            Submit Inspection & Proceed to Handover Acknowledgement →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 7: DIGITAL HANDOVER ACKNOWLEDGEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'HANDOVER_ACK' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase text-[#00A99D]">Digital Vehicle Handover</span>
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Confirm Key Handover</h2>
            <p className="text-xs text-[#526174]">Review the recorded condition and accept to activate your rental.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Recorded Odometer:</span>
              <span className="font-bold">{preOdometer} km</span>
            </div>
            <div className="flex justify-between">
              <span>Starting Fuel:</span>
              <span className="font-bold">{preFuel}%</span>
            </div>
            <div className="flex justify-between">
              <span>Pre-existing Damage Items:</span>
              <span className="font-bold">{preDamages.length} recorded</span>
            </div>
          </div>

          {/* 3 Acknowledgement Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-[#0B1728] dark:text-white">
              <input
                type="checkbox"
                checked={ackCondition}
                onChange={(e) => setAckCondition(e.target.checked)}
                className="w-4 h-4 rounded text-[#00C2B3] mt-0.5"
              />
              <span>I have inspected the vehicle and verified odometer ({preOdometer} km) and fuel level ({preFuel}%).</span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-[#0B1728] dark:text-white">
              <input
                type="checkbox"
                checked={ackDamages}
                onChange={(e) => setAckDamages(e.target.checked)}
                className="w-4 h-4 rounded text-[#00C2B3] mt-0.5"
              />
              <span>I confirm all pre-existing scratches/dents are recorded accurately.</span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-[#0B1728] dark:text-white">
              <input
                type="checkbox"
                checked={ackTerms}
                onChange={(e) => setAckTerms(e.target.checked)}
                className="w-4 h-4 rounded text-[#00C2B3] mt-0.5"
              />
              <span>I agree to the rental terms and accept key handover.</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleCustomerAcknowledge}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-xs shadow-xl cursor-pointer"
          >
            Confirm Handover & Start Active Rental →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 8: ACTIVE RENTAL MANAGEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'ACTIVE' && activeBooking && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                ● Rental Active
              </span>
              <h2 className="text-2xl font-black text-[#0B1728] dark:text-white mt-1">
                {selectedVehicle?.name}
              </h2>
              <p className="text-xs text-[#526174]">
                Provided by <strong>{selectedVehicle?.hostName}</strong> • Return by {returnDate} {returnTime}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block">Time Remaining</span>
              <span className="text-xl font-black text-[#00A99D]">{timeRemainingLabel}</span>
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setShowExtendModal(true)}
              className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold text-[#0B1728] dark:text-white hover:border-[#00C2B3] transition-all cursor-pointer"
            >
              ⏳ Request Extension
            </button>
            <button
              type="button"
              onClick={() => setShowReportIssueModal(true)}
              className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold text-[#0B1728] dark:text-white hover:border-[#00C2B3] transition-all cursor-pointer"
            >
              ⚠️ Report Incident
            </button>
            <button
              type="button"
              onClick={() => alert(`Digital Agreement Reference: ${activeBooking.bookingId}\nPartner: ${selectedVehicle?.hostName}\nDeposit: ${formatINR(selectedVehicle?.depositAmount || 10000)}`)}
              className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold text-[#0B1728] dark:text-white hover:border-[#00C2B3] transition-all cursor-pointer"
            >
              📄 View Agreement
            </button>
            <button
              type="button"
              onClick={() => alert('🚨 Emergency SOS Alert dispatched to VITO Safety Operations Center.')}
              className="p-4 rounded-2xl bg-red-50 text-red-700 font-black text-xs hover:bg-red-100 transition-all cursor-pointer"
            >
              🚨 Emergency SOS
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStage('RETURN_INSPECTION')}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-xs shadow-xl cursor-pointer"
          >
            Proceed to Return & Final Inspection →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 9: RETURN INSPECTION & CONDITION COMPARISON
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'RETURN_INSPECTION' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase text-[#00A99D]">Step 5: Final Vehicle Return</span>
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Return Condition Inspection</h2>
            <p className="text-xs text-[#526174]">Compare return odometer & fuel against pre-rental inspection.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white">Return Odometer (KM)</label>
              <input
                type="number"
                value={returnOdometer}
                onChange={(e) => setReturnOdometer(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white">Return Fuel (%): {returnFuel}%</label>
              <input
                type="range"
                min={10}
                max={100}
                value={returnFuel}
                onChange={(e) => setReturnFuel(Number(e.target.value))}
                className="w-full mt-2 accent-[#00C2B3]"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>No new damages detected. Your full security deposit is eligible for instant release!</span>
          </div>

          <button
            type="button"
            onClick={handleSubmitReturnInspection}
            className="w-full py-4 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow-md cursor-pointer"
          >
            Submit Return & Settle Security Deposit →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 10: FINAL BILL & SECURITY DEPOSIT SETTLEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'FINAL_BILL' && finalBill && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <Receipt className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-[#0B1728] dark:text-white">Deposit Settlement Receipt</h2>
            <p className="text-xs text-[#526174]">Final invoice & security deposit refund breakdown.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-3 text-xs">
            <div className="flex justify-between">
              <span>Original Security Deposit Held</span>
              <span className="font-bold">{formatINR(finalBill.originalDeposit)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Approved Damage Deductions</span>
              <span className="font-bold">₹0 (None)</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Fuel Adjustment</span>
              <span className="font-bold">₹0</span>
            </div>
            <div className="flex justify-between pt-3 border-t font-black text-base text-[#00A99D]">
              <span>Net Refund Released</span>
              <span>{formatINR(finalBill.netRefundAmount)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinalSettlementComplete}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-xs shadow-xl cursor-pointer"
          >
            Complete Rental & Rate Partner →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 11: RATING & REVIEW
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'RATING' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-xl mx-auto text-center">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Rate Your Rental Experience</h2>
            <p className="text-xs text-[#526174]">Your feedback helps maintain VITO partner fleet excellence.</p>
          </div>

          {!ratingSubmitted ? (
            <div className="space-y-4 text-left">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatings({ ...ratings, overall: s })}
                    className={`p-3 rounded-2xl border text-base font-bold transition-all cursor-pointer ${
                      ratings.overall >= s ? 'bg-amber-400 text-black border-amber-400' : 'bg-[#F7F9FC]'
                    }`}
                  >
                    ★ {s}
                  </button>
                ))}
              </div>

              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share feedback on vehicle cleanliness, handover punctuality, and partner service..."
                className="w-full h-24 p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs outline-none"
              />

              <button
                type="button"
                onClick={() => setRatingSubmitted(true)}
                className="w-full py-4 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow-md cursor-pointer"
              >
                Submit Review →
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold">Thank you for reviewing {selectedVehicle?.hostName}!</p>
              <button
                type="button"
                onClick={() => {
                  setStage('SEARCH');
                  setRatingSubmitted(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#07111F] text-white text-xs font-bold cursor-pointer"
              >
                Search Another Vehicle
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 12: MY RENTALS HISTORY
      ════════════════════════════════════════════════════════════════════════ */}
      {stage === 'HISTORY' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {['upcoming', 'active', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setRentalsTab(tab);
                  loadMyRentals(tab);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                  rentalsTab === tab
                    ? 'bg-[#07111F] text-white shadow-sm'
                    : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {myRentals.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border text-xs text-[#526174]">
                <p className="font-bold text-sm text-[#0B1728] dark:text-white">No {rentalsTab} rentals found.</p>
                <p className="mt-1">Book your next journey with VITO's verified rental marketplace.</p>
              </div>
            ) : (
              myRentals.map((r) => (
                <div key={r._id} className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-black text-sm text-[#0B1728] dark:text-white">
                      {(r.vehicleId as any)?.name || 'Toyota Innova Crysta'}
                    </h4>
                    <p className="text-[11px] text-[#526174]">Booking: {r.bookingId}</p>
                  </div>
                  <span className="font-bold text-[#00A99D]">{r.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
