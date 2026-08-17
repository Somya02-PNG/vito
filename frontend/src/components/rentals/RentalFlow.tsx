'use client';

/**
 * RentalFlow.tsx
 *
 * VITO Vehicle Rental — Complete Flow with Digital Handover, Document Verification,
 * and Safety-Compliant Damage Reconciliation.
 *
 * COMPONENT REUSE AUDIT (zero duplicates):
 * - Location picker: AddressAutocomplete (same as Cab & Hire a Driver)
 * - Map: EnhancedCabMap (same as Cab & Hire a Driver)
 * - Payment: MockPaymentModal (same as Cab & Hire a Driver)
 * - User model: existing User, no duplicate customer model
 * - Auth: fetchAPI with credentials: 'include'
 *
 * PRIVACY RULE: Document identifiers are ALWAYS masked in UI (e.g. DL-XXXX-XXXX-4821).
 * SAFETY RULE: Flagged damages require operator review; only confirmed damages can be charged.
 */

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Car, MapPin, Calendar, Clock, ChevronRight, ChevronLeft,
  Filter, Star, Users, Fuel, Settings2, Shield, CheckCircle2,
  ShieldCheck, Info, AlertCircle, CreditCard, Receipt,
  Wrench, Phone, Plus, Minus, ArrowRight, RotateCcw,
  Package, Zap, Home, History, X, Search, ClipboardCheck,
  Truck, Timer, FileText, ThumbsUp, Camera, ChevronDown,
  Compass, Navigation, Sparkles, AlertTriangle, Upload, Eye, Check,
} from 'lucide-react';
import AddressAutocomplete, { PlaceResult } from '@/components/AddressAutocomplete';
import MockPaymentModal from '@/components/MockPaymentModal';
import { fetchAPI } from '@/lib/api';

const EnhancedCabMap = dynamic(() => import('@/components/cab/EnhancedCabMap'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface VehicleResult {
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
  pricing: PricingResult;
}

interface PricingResult {
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

interface VehicleDamageItem {
  location: string;
  damageType: 'SCRATCH' | 'DENT' | 'CRACK' | 'PAINT_DAMAGE' | 'OTHER';
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  description: string;
  estimatedCost?: number;
  photoUrl?: string;
  isPreExisting?: boolean;
}

interface RentalBooking {
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
  preRentalInspection: any;
  postRentalInspection: any;
  extensionHistory: any[];
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

type Stage =
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
  SEARCH: '1. Search', RESULTS: '2. Choose Car', VERIFY_BOOK: '3. Verify & Book',
  CONFIRMED: '4. Pickup & Handover', ACTIVE: '5. Active Rental', FINAL_BILL: '6. Return & Settle',
};

const CATEGORY_LABELS: Record<string, string> = {
  hatchback: 'Hatchback', sedan: 'Sedan', suv: 'SUV', muv: 'MUV',
  ev: 'Electric', luxury: 'Luxury', van: 'Van', bike: 'Bike',
};

const FUEL_LABELS: Record<string, string> = {
  petrol: 'Petrol', diesel: 'Diesel', electric: 'Electric ⚡', cng: 'CNG', hybrid: 'Hybrid',
};

const DAMAGE_LOCATIONS = [
  'Front Bumper', 'Rear Bumper', 'Left Front Fender', 'Right Front Fender',
  'Left Doors', 'Right Doors', 'Windshield', 'Rear Glass', 'Roof', 'Wheels & Tyres',
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RentalFlow() {
  const [stage, setStage] = useState<Stage>('SEARCH');

  // ── Stage 1: Search Params ─────────────────────────────────────────────────
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupPlace, setPickupPlace] = useState<PlaceResult | null>(null);
  const [returnLocation, setReturnLocation] = useState('');
  const [returnPlace, setReturnPlace] = useState<PlaceResult | null>(null);
  const [tripDestination, setTripDestination] = useState('');
  const [sameReturnLocation, setSameReturnLocation] = useState(true);
  const [pickupMethod, setPickupMethod] = useState<'self_pickup' | 'doorstep_delivery'>('self_pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('10:00');
  const [durationLabel, setDurationLabel] = useState('');
  const [searchError, setSearchError] = useState('');

  // ── Stage 2: Results & Filters ─────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<VehicleResult[]>([]);
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
  const [vehicleCompliance, setVehicleCompliance] = useState<any>(null);

  // ── Stage 3: Customer Document Upload & Verification ───────────────────────
  const [idDocUploaded, setIdDocUploaded] = useState(false);
  const [dlFrontUploaded, setDlFrontUploaded] = useState(false);
  const [dlBackUploaded, setDlBackUploaded] = useState(false);
  const [maskedId, setMaskedId] = useState('AADHAAR-XXXX-XXXX-9021');
  const [maskedDl, setMaskedDl] = useState('DL-XXXX-XXXX-4821');
  const [uploadingDoc, setUploadingDoc] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [finalPricing, setFinalPricing] = useState<PricingResult | null>(null);
  const [booking, setBooking] = useState<RentalBooking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ── Stage 4: Pre-Handover Inspection & Acknowledgement ─────────────────────
  const [preOdometer, setPreOdometer] = useState(12500);
  const [preFuel, setPreFuel] = useState(100);
  const [preDamages, setPreDamages] = useState<VehicleDamageItem[]>([]);
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
  const [timeRemainingLabel, setTimeRemainingLabel] = useState('');
  const [showHandoverReportModal, setShowHandoverReportModal] = useState(false);
  const [handoverReport, setHandoverReport] = useState<any>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [extensionPreview, setExtensionPreview] = useState<any>(null);
  const [extendingLoading, setExtendingLoading] = useState(false);

  // ── Stage 6: Return Handover & Post-Inspection ─────────────────────────────
  const [returnOdometer, setReturnOdometer] = useState(12820);
  const [returnFuel, setReturnFuel] = useState(95);
  const [returnDamages, setReturnDamages] = useState<VehicleDamageItem[]>([]);
  const [cleanlinessStatus, setCleanlinessStatus] = useState<'Clean' | 'Moderate' | 'Dirty'>('Clean');
  const [finalBill, setFinalBill] = useState<any>(null);
  const [postInspectionResult, setPostInspectionResult] = useState<any>(null);

  // ── Rating & History / Details ─────────────────────────────────────────────
  const [ratings, setRatings] = useState({ vehicleCondition: 5, vehicleQuality: 5, pickupExperience: 5, returnExperience: 5, hostService: 5, overall: 5 });
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [myRentals, setMyRentals] = useState<RentalBooking[]>([]);
  const [rentalsTab, setRentalsTab] = useState('upcoming');
  const [bookingDetailsData, setBookingDetailsData] = useState<any>(null);

  // ─── Duration Calculator ────────────────────────────────────────────────────
  useEffect(() => {
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
      setDurationLabel('');
      return;
    }
    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${returnDate}T${returnTime}`);
    if (end <= start) { setDurationLabel('⚠ Return must be after pickup'); return; }
    const diffMs = end.getTime() - start.getTime();
    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0 && hours > 0) setDurationLabel(`${days} Day${days !== 1 ? 's' : ''} ${hours} Hr${hours !== 1 ? 's' : ''}`);
    else if (days > 0) setDurationLabel(`${days} Day${days !== 1 ? 's' : ''}`);
    else setDurationLabel(`${hours} Hour${hours !== 1 ? 's' : ''}`);
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  // ─── Countdown Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'ACTIVE' || !activeBooking) return;
    const tick = () => {
      const returnDt = new Date(activeBooking.currentReturnDateTime);
      const diff = returnDt.getTime() - Date.now();
      if (diff <= 0) { setTimeRemainingLabel('⏰ Time elapsed'); return; }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemainingLabel(`${h}h ${m}m remaining`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [stage, activeBooking]);

  // ─── Load My Rentals ────────────────────────────────────────────────────────
  const loadMyRentals = useCallback(async (tab: string) => {
    try {
      const res = await fetchAPI(`/api/rental/bookings/my?tab=${tab}`);
      if (res.success) setMyRentals(res.data.rentals || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (stage === 'HISTORY') {
      loadMyRentals(rentalsTab);
    }
  }, [stage, rentalsTab, loadMyRentals]);

  // ─── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    setSearchError('');
    const locationString = (pickupPlace?.address || pickupLocation || '').trim();
    if (!locationString) { setSearchError('Please enter a pickup location.'); return; }
    if (!pickupDate || !pickupTime) { setSearchError('Please select pickup date and time.'); return; }
    if (!returnDate || !returnTime) { setSearchError('Please select return date and time.'); return; }

    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${returnDate}T${returnTime}`);
    if (end <= start) { setSearchError('Return date/time must be after pickup date/time.'); return; }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        pickupLocation: locationString,
        ...(pickupPlace?.lat && { pickupLat: String(pickupPlace.lat) }),
        ...(pickupPlace?.lng && { pickupLng: String(pickupPlace.lng) }),
        returnLocation: sameReturnLocation ? locationString : (returnPlace?.address || returnLocation || locationString),
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

      const res = await fetchAPI(`/api/rental/vehicles/search?${params}`);
      if (res.success) {
        setSearchResults(res.data.vehicles || []);
        setResolvedHub(res.data.hub);
        setSearchTier(res.data.searchTier || 'exact');
        setHubNotice(res.data.hubNotice || '');
        setIsNearbyAlternative(res.data.isNearbyAlternative || false);
        setOneWayAvailable(res.data.oneWayAvailable ?? true);
        setOneWayMessage(res.data.oneWayMessage || '');
        setTripEstimate(res.data.tripEstimate || null);
        setStage('RESULTS');
      } else {
        setSearchError('Search failed. Please try again.');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Search failed. Please check connection.');
    } finally {
      setSearching(false);
    }
  };

  // ─── Select Vehicle & Load Vehicle Document Compliance ──────────────────────
  const handleSelectVehicle = async (vehicle: VehicleResult) => {
    setSelectedVehicle(vehicle);
    try {
      // Fetch vehicle document compliance
      const compRes = await fetchAPI(`/api/rental/vehicles/${vehicle._id}/documents`);
      if (compRes.success) setVehicleCompliance(compRes.data);

      const start = new Date(`${pickupDate}T${pickupTime}`);
      const end = new Date(`${returnDate}T${returnTime}`);
      const res = await fetchAPI('/api/rental/pricing/calculate', {
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
      if (res.success) setFinalPricing(res.data.pricing);
    } catch {}
    setStage('DETAIL');
  };

  // ─── Document Upload (Customer ID & Licence) ───────────────────────────────
  const handleDocumentUpload = async (docType: string) => {
    setUploadingDoc(docType);
    try {
      const res = await fetchAPI('/api/rental/documents/upload', {
        method: 'POST',
        body: {
          documentType: docType,
          rawIdentifier: Math.floor(1000 + Math.random() * 9000).toString(),
        },
      });

      if (res.success) {
        if (docType === 'CUSTOMER_ID') {
          setIdDocUploaded(true);
          setMaskedId(res.data.document.maskedIdentifier);
        } else if (docType === 'DRIVING_LICENSE_FRONT') {
          setDlFrontUploaded(true);
          setMaskedDl(res.data.document.maskedIdentifier);
        } else if (docType === 'DRIVING_LICENSE_BACK') {
          setDlBackUploaded(true);
        }
      }
    } catch {}
    setUploadingDoc('');
  };

  // ─── Create Booking ─────────────────────────────────────────────────────────
  const handleCreateBooking = async () => {
    if (!agreementAccepted) { alert('Please accept the rental agreement to proceed.'); return; }
    if (!selectedVehicle) return;

    setBookingLoading(true);
    try {
      const start = new Date(`${pickupDate}T${pickupTime}`);
      const end = new Date(`${returnDate}T${returnTime}`);
      const res = await fetchAPI('/api/rental/bookings', {
        method: 'POST',
        body: {
          vehicleId: selectedVehicle._id,
          pickupLocation: pickupPlace?.address || pickupLocation,
          pickupLat: pickupPlace?.lat,
          pickupLng: pickupPlace?.lng,
          returnLocation: sameReturnLocation ? (pickupPlace?.address || pickupLocation) : (returnPlace?.address || returnLocation),
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

      if (res.success) {
        setBooking(res.data.booking);
        setShowPaymentModal(true);
      }
    } catch (err: any) {
      alert(err.message || 'Booking creation failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // ─── Payment Success ────────────────────────────────────────────────────────
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    if (!booking) return;
    try {
      const res = await fetchAPI(`/api/rental/bookings/${booking._id}/payment`, { method: 'POST' });
      if (res.success) {
        setActiveBooking(res.data.booking);
        setStage('CONFIRMED');
      }
    } catch {}
  };

  // ─── Add Pre-Handover Damage Marker ─────────────────────────────────────────
  const handleAddDamageMarker = (isPre: boolean = true) => {
    if (!newDamageDesc.trim()) return;
    const item: VehicleDamageItem = {
      location: newDamageLoc,
      damageType: newDamageType,
      severity: newDamageSeverity,
      description: newDamageDesc.trim(),
      estimatedCost: isPre ? 0 : 800,
      isPreExisting: isPre,
    };
    if (isPre) setPreDamages([...preDamages, item]);
    else setReturnDamages([...returnDamages, item]);
    setNewDamageDesc('');
  };

  // ─── Submit Pre-Handover Inspection ─────────────────────────────────────────
  const handleSubmitPreInspection = async () => {
    if (!activeBooking) return;
    try {
      const res = await fetchAPI(`/api/rental/bookings/${activeBooking._id}/handover-inspection`, {
        method: 'POST',
        body: {
          odometerKm: preOdometer,
          fuelLevelPercent: preFuel,
          cleanliness: 'Clean',
          damages: preDamages,
        },
      });

      if (res.success) {
        setStage('HANDOVER_ACK');
      }
    } catch {}
  };

  // ─── Customer Digital Acknowledgement (3 Checkboxes) ─────────────────────────
  const handleCustomerAcknowledge = async () => {
    if (!ackCondition || !ackDamages || !ackTerms) {
      alert('Please confirm all 3 acknowledgement checkboxes to begin your rental.');
      return;
    }
    if (!activeBooking) return;

    try {
      const res = await fetchAPI(`/api/rental/bookings/${activeBooking._id}/customer-acknowledge`, {
        method: 'POST',
        body: {
          reviewedCondition: ackCondition,
          acknowledgedDamage: ackDamages,
          agreedTerms: ackTerms,
        },
      });

      if (res.success) {
        setActiveBooking(res.data.booking);
        setStage('ACTIVE');
      }
    } catch (err: any) {
      alert(err.message || 'Acknowledgement failed.');
    }
  };

  // ─── View Handover Report Modal ─────────────────────────────────────────────
  const handleViewHandoverReport = async () => {
    if (!activeBooking) return;
    try {
      const res = await fetchAPI(`/api/rental/bookings/${activeBooking._id}/handover-report`);
      if (res.success) {
        setHandoverReport(res.data.report);
        setShowHandoverReportModal(true);
      }
    } catch {}
  };

  // ─── Submit Post-Return Inspection (Safety Rule: Flagged damage pending review) 
  const handleSubmitReturnInspection = async () => {
    if (!activeBooking) return;
    try {
      const res = await fetchAPI(`/api/rental/bookings/${activeBooking._id}/return-inspection`, {
        method: 'POST',
        body: {
          odometerKm: returnOdometer,
          fuelLevelPercent: returnFuel,
          cleanliness: cleanlinessStatus,
          newDamages: returnDamages,
        },
      });

      if (res.success) {
        setPostInspectionResult(res.data);
        const billRes = await fetchAPI(`/api/rental/bookings/${activeBooking._id}/final-bill`);
        if (billRes.success) setFinalBill(billRes.data.finalBill);
        setStage('FINAL_BILL');
      }
    } catch {}
  };

  // ─── Final Settlement Payment ───────────────────────────────────────────────
  const handleFinalPaymentSuccess = async () => {
    if (!activeBooking) return;
    try {
      await fetchAPI(`/api/rental/bookings/${activeBooking._id}/final-payment`, { method: 'POST' });
      setStage('RATING');
    } catch {}
  };

  // ─── View 13-Section Booking Details ────────────────────────────────────────
  const handleViewBookingDetails = async (bookingId: string) => {
    try {
      const res = await fetchAPI(`/api/rental/bookings/${bookingId}/details`);
      if (res.success) {
        setBookingDetailsData(res.data);
        setStage('BOOKING_DETAILS');
      }
    } catch {}
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const STAGE_ORDER = ['SEARCH', 'RESULTS', 'VERIFY_BOOK', 'CONFIRMED', 'ACTIVE', 'FINAL_BILL', 'RATING', 'HISTORY'];
  const currentStageIdx = STAGE_ORDER.indexOf(stage);

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C2B3]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#00A99D]">VITO Self-Drive Rental</p>
          </div>
          <h1 className="text-3xl font-black text-[#0B1728] dark:text-white">Rent a Verified Vehicle</h1>
          <p className="text-sm text-[#526174] dark:text-slate-400 mt-0.5">
            Digital Handover & Evidence Protection • Privacy-Masked Verification • Zero Hidden Deductions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStage('HISTORY')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${stage === 'HISTORY' ? 'bg-[#07111F] text-white' : 'bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-[#526174] dark:text-slate-300'}`}
          >
            <History className="w-3.5 h-3.5" /> My Rentals
          </button>
        </div>
      </div>

      {/* ── Progress Indicators ────────────────────────────────────────────── */}
      {!['HISTORY', 'RATING', 'BOOKING_DETAILS'].includes(stage) && (
        <div className="hidden sm:flex items-center gap-1">
          {Object.entries(STAGE_LABELS).map(([key, label], idx, arr) => {
            const stageIdx = STAGE_ORDER.indexOf(key);
            const active = stage === key || (key === 'CONFIRMED' && ['CONFIRMED', 'PICKUP_INSPECTION', 'HANDOVER_ACK'].includes(stage))
              || (key === 'ACTIVE' && stage === 'ACTIVE')
              || (key === 'FINAL_BILL' && ['RETURN_INSPECTION', 'FINAL_BILL'].includes(stage));
            const done = stageIdx < currentStageIdx;
            return (
              <React.Fragment key={key}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${active ? 'bg-[#07111F] text-white' : done ? 'bg-[#00C2B3]/10 text-[#00A99D]' : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#8995A5]'}`}>
                  {done && <CheckCircle2 className="w-3 h-3" />}
                  {label}
                </div>
                {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 text-[#8995A5] shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 1 — SEARCH
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'SEARCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-5">
            <h2 className="text-base font-black text-[#0B1728] dark:text-white">Search Available Cars</h2>

            <div>
              <label className="text-xs font-bold text-[#526174] uppercase tracking-wider mb-2 block">
                Pickup Location <span className="text-[#3984E8] font-normal lowercase">(e.g. Jajmau Kanpur, Delhi, Mumbai...)</span>
              </label>
              <AddressAutocomplete
                value={pickupLocation}
                onChange={setPickupLocation}
                onSelect={(p) => {
                  setPickupPlace(p);
                  if (sameReturnLocation) { setReturnPlace(p); setReturnLocation(p.address); }
                }}
                placeholder="Search city, area, station, airport..."
                label="Pickup Location"
              />
            </div>

            <div className="flex gap-2">
              {(['self_pickup', 'doorstep_delivery'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPickupMethod(m)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${pickupMethod === m ? 'bg-[#07111F] text-white border-transparent' : 'bg-[#F7F9FC] dark:bg-[#10243A] border-[#E5EAF0] dark:border-[#17334F] text-[#526174]'}`}
                >
                  {m === 'self_pickup' ? '🏢 Self Pickup (Hub)' : '🚚 Doorstep Delivery'}
                </button>
              ))}
            </div>

            {pickupMethod === 'doorstep_delivery' && (
              <div>
                <label className="text-xs font-bold text-[#526174] uppercase tracking-wider mb-1 block">Delivery Address</label>
                <input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Apartment, building, street address..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sameReturnLocation} onChange={(e) => {
                setSameReturnLocation(e.target.checked);
                if (e.target.checked) { setReturnPlace(pickupPlace); setReturnLocation(pickupLocation); }
              }} className="w-4 h-4 accent-[#00C2B3]" />
              <span className="text-xs font-semibold text-[#0B1728] dark:text-slate-300">Return to same pickup hub</span>
            </label>

            {!sameReturnLocation && (
              <div>
                <label className="text-xs font-bold text-[#526174] uppercase tracking-wider mb-2 block">Return Location</label>
                <AddressAutocomplete
                  value={returnLocation}
                  onChange={setReturnLocation}
                  onSelect={setReturnPlace}
                  placeholder="Select drop-off hub..."
                  label="Return Location"
                />
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#3984E8]" />
                <label className="text-xs font-bold text-[#0B1728] dark:text-white">Planning a Road Trip? <span className="text-[#8995A5] font-normal">(Optional)</span></label>
              </div>
              <input
                value={tripDestination}
                onChange={(e) => setTripDestination(e.target.value)}
                placeholder="e.g. Jaipur, Manali, Agra, Goa..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#526174] block mb-1">Pickup Date</label>
                <input type="date" value={pickupDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#526174] block mb-1">Pickup Time</label>
                <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#526174] block mb-1">Return Date</label>
                <input type="date" value={returnDate} min={pickupDate || new Date().toISOString().split('T')[0]} onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#526174] block mb-1">Return Time</label>
                <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none" />
              </div>
            </div>

            {durationLabel && (
              <div className="p-3 rounded-xl bg-[#F0FCFB] border border-[#00C2B3]/30 flex items-center gap-2 text-xs font-bold text-[#00A99D]">
                <Timer className="w-4 h-4 text-[#00A99D]" /> Duration: {durationLabel}
              </div>
            )}

            {searchError && <p className="text-xs text-red-500 font-bold">{searchError}</p>}

            <button
              onClick={handleSearch}
              disabled={searching}
              className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {searching ? 'Checking Fleet & Documents...' : 'Search Available Cars'}
            </button>
          </div>

          <div className="space-y-4">
            {[
              { icon: '🛡️', title: 'Digital Handover Report', body: '10-point inspection record with pre-existing damage logging guarantees you are only responsible for your own trip.' },
              { icon: '🔒', title: 'Privacy-First Document Masking', body: 'Your driving licence and identity credentials are encrypted and displayed with masked identifiers.' },
              { icon: '⚖️', title: 'Safety-Compliant Settlements', body: 'Reported damages require operator confirmation before any deduction. Security deposits are settled strictly separately.' },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] flex items-start gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-black text-[#0B1728] dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-[#526174] dark:text-slate-400 mt-0.5">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 2 — RESULTS
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'RESULTS' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-[#0B1728] dark:text-white">{searchResults.length} Verified Cars Available</h2>
                {resolvedHub && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00C2B3]/10 text-[#00A99D] text-xs font-black">
                    📍 {resolvedHub.name} ({resolvedHub.city})
                  </span>
                )}
              </div>
              <p className="text-xs text-[#526174] mt-0.5">{pickupLocation} • {durationLabel}</p>
            </div>
            <button onClick={() => setStage('SEARCH')} className="px-3 py-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#526174]">
              ← Edit Search
            </button>
          </div>

          {hubNotice && (
            <div className="p-3.5 rounded-2xl bg-[#F0FCFB] border border-[#00C2B3]/30 flex items-center justify-between text-xs text-[#00A99D] font-bold">
              <span className="flex items-center gap-2"><Navigation className="w-4 h-4 text-[#00A99D]" /> {hubNotice}</span>
              <span className="text-[10px] text-[#00A99D]/80 uppercase">{searchTier} match</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {searchResults.map((vehicle) => (
              <div key={vehicle._id} className="rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="relative aspect-[16/9] bg-[#F1F5F8] dark:bg-[#10243A] overflow-hidden">
                  <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase">
                    {CATEGORY_LABELS[vehicle.category]}
                  </span>
                  <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-[#0B1728] text-xs font-black">
                    <Star className="w-3 h-3 fill-[#C9A45C] text-[#C9A45C]" /> {vehicle.rating}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0B1728] dark:text-white group-hover:text-[#00A99D] transition-colors">{vehicle.name}</h3>
                    <p className="text-[10px] text-[#526174]">📍 {vehicle.hubName || vehicle.city} • {vehicle.totalRentals} trips completed</p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#526174] font-semibold">
                    <span>{vehicle.transmission === 'automatic' ? '⚙ Auto' : '🔧 Manual'}</span>
                    <span>·</span>
                    <span>{FUEL_LABELS[vehicle.fuelType]}</span>
                    <span>·</span>
                    <span><Users className="w-3 h-3 inline" /> {vehicle.seats}</span>
                  </div>

                  <div className="flex gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F7F2] text-[#16A67A] text-[9px] font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5" /> All Documents Verified
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4 border-t border-[#E5EAF0] dark:border-[#17334F] pt-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-base font-black text-[#0B1728] dark:text-white">{formatINR(vehicle.pricing.totalPayable)}</span>
                    <p className="text-[10px] text-[#8995A5]">Deposit: {formatINR(vehicle.pricing.securityDeposit)} (separate)</p>
                  </div>
                  <button
                    onClick={() => handleSelectVehicle(vehicle)}
                    className="px-3.5 py-2 rounded-xl bg-[#07111F] hover:bg-[#0B1728] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    View & Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 2b — VEHICLE DETAIL & DOCUMENT COMPLIANCE
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'DETAIL' && selectedVehicle && (
        <div className="space-y-5 max-w-3xl mx-auto">
          <button onClick={() => setStage('RESULTS')} className="flex items-center gap-1.5 text-xs font-bold text-[#526174]">
            <ChevronLeft className="w-4 h-4" /> Back to results
          </button>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
            <h2 className="text-2xl font-black text-[#0B1728] dark:text-white">{selectedVehicle.name}</h2>
            <div className="aspect-[16/7] rounded-2xl overflow-hidden bg-[#F1F5F8] dark:bg-[#10243A]">
              <img src={selectedVehicle.images[0]} alt={selectedVehicle.name} className="w-full h-full object-cover" />
            </div>

            {/* Vehicle Document Dashboard (Compliance overview) */}
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1728] dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A67A]" /> Vehicle Verified Documents
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#E8F7F2] text-[#16A67A] text-[10px] font-black">
                  ✓ Verified & Compliant
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  ['Registration Certificate', 'RC-XXXX-XXXX-1024', 'Valid until 2029'],
                  ['Comprehensive Insurance', 'INS-XXXX-XXXX-8821', 'Zero-Dep Included'],
                  ['Pollution (PUC)', 'PUC-XXXX-XXXX-3310', 'NGT Certified'],
                  ['Fitness Certificate', 'FIT-XXXX-XXXX-5042', 'RTO Validated'],
                  ['Tourist Permit', 'PERMIT-XXXX-XXXX-9100', 'All India AITP'],
                ].map(([name, masked, note]) => (
                  <div key={name} className="p-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F]">
                    <p className="font-bold text-[#0B1728] dark:text-white text-[11px]">{name}</p>
                    <p className="text-[10px] text-[#8995A5]">{masked}</p>
                    <p className="text-[9px] text-[#16A67A] font-semibold mt-0.5">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStage('VERIFY_BOOK')} className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-sm shadow-md">
              Proceed to Customer Verification & Booking →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 3 — CUSTOMER DOCUMENT UPLOAD & VERIFY
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'VERIFY_BOOK' && selectedVehicle && (
        <div className="max-w-2xl mx-auto space-y-5">
          <button onClick={() => setStage('DETAIL')} className="flex items-center gap-1.5 text-xs font-bold text-[#526174]">
            <ChevronLeft className="w-4 h-4" /> Back to details
          </button>

          <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Customer Verification & Documents</h2>

          {/* Document Cards */}
          <div className="space-y-4">
            {/* Identity Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#0B1728] dark:text-white">Identity Verification</h3>
                  <p className="text-xs text-[#526174]">Government ID (Aadhaar Card / Passport)</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${idDocUploaded ? 'bg-[#E8F7F2] text-[#16A67A]' : 'bg-amber-500/10 text-amber-600'}`}>
                  {idDocUploaded ? '✓ Verified' : 'Pending Upload'}
                </span>
              </div>

              {idDocUploaded ? (
                <div className="p-3 rounded-2xl bg-[#F0FCFB] border border-[#00C2B3]/30 text-xs flex items-center justify-between">
                  <span className="font-bold text-[#0B1728] dark:text-white">ID Identifier: {maskedId}</span>
                  <span className="text-[#00A99D] font-black">✓ Verified via VITO Demo AI</span>
                </div>
              ) : (
                <button
                  onClick={() => handleDocumentUpload('CUSTOMER_ID')}
                  disabled={uploadingDoc === 'CUSTOMER_ID'}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-[#CCD6E2] dark:border-[#17334F] hover:border-[#00C2B3] text-xs font-bold text-[#526174] flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-[#00A99D]" />
                  {uploadingDoc === 'CUSTOMER_ID' ? 'Verifying document...' : 'Upload Aadhaar / Government ID (JPG · PNG · PDF)'}
                </button>
              )}
            </div>

            {/* Driving Licence Card (Front & Back) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#0B1728] dark:text-white">Driving Licence</h3>
                  <p className="text-xs text-[#526174]">Must be valid for light motor vehicles (LMV)</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${dlFrontUploaded && dlBackUploaded ? 'bg-[#E8F7F2] text-[#16A67A]' : 'bg-amber-500/10 text-amber-600'}`}>
                  {dlFrontUploaded && dlBackUploaded ? '✓ Verified' : 'Pending Slots'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDocumentUpload('DRIVING_LICENSE_FRONT')}
                  disabled={dlFrontUploaded || uploadingDoc === 'DRIVING_LICENSE_FRONT'}
                  className={`p-3 rounded-2xl border-2 ${dlFrontUploaded ? 'border-emerald-400 bg-emerald-50/20 text-emerald-700' : 'border-dashed border-[#CCD6E2] hover:border-[#00C2B3] text-[#526174]'} text-xs font-bold text-center`}
                >
                  {dlFrontUploaded ? '✓ Licence Front Verified' : uploadingDoc === 'DRIVING_LICENSE_FRONT' ? 'Verifying...' : '+ Licence (Front)'}
                </button>

                <button
                  onClick={() => handleDocumentUpload('DRIVING_LICENSE_BACK')}
                  disabled={dlBackUploaded || uploadingDoc === 'DRIVING_LICENSE_BACK'}
                  className={`p-3 rounded-2xl border-2 ${dlBackUploaded ? 'border-emerald-400 bg-emerald-50/20 text-emerald-700' : 'border-dashed border-[#CCD6E2] hover:border-[#00C2B3] text-[#526174]'} text-xs font-bold text-center`}
                >
                  {dlBackUploaded ? '✓ Licence Back Verified' : uploadingDoc === 'DRIVING_LICENSE_BACK' ? 'Verifying...' : '+ Licence (Back)'}
                </button>
              </div>

              {(dlFrontUploaded || dlBackUploaded) && (
                <p className="text-[10px] text-[#526174]">
                  Masked Number: <span className="font-bold text-[#0B1728] dark:text-white">{maskedDl}</span> • Stored securely in encrypted private vault.
                </p>
              )}
            </div>
          </div>

          {/* Rental Agreement Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] cursor-pointer">
            <input type="checkbox" checked={agreementAccepted} onChange={(e) => setAgreementAccepted(e.target.checked)} className="w-4 h-4 accent-[#00C2B3] mt-0.5 shrink-0" />
            <span className="text-xs font-semibold text-[#526174] dark:text-slate-300">
              I agree to the <span className="text-[#00A99D] font-bold">VITO Self-Drive Rental Agreement</span>, cancellation policies, and pre-handover inspection protocols. Digital signature timestamp will be recorded on booking.
            </span>
          </label>

          <button
            onClick={handleCreateBooking}
            disabled={!agreementAccepted || !idDocUploaded || !dlFrontUploaded || !dlBackUploaded || bookingLoading}
            className="w-full py-4 rounded-2xl bg-[#07111F] disabled:opacity-50 hover:bg-[#0B1728] text-white font-black text-sm shadow-lg transition-all"
          >
            {bookingLoading ? 'Creating Booking...' : `Pay & Reserve — ${formatINR((finalPricing || selectedVehicle.pricing)?.totalWithDeposit || 0)}`}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 4 — CONFIRMED & PRE-HANDOVER INSPECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'CONFIRMED' && activeBooking && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0B1728] dark:text-white">Booking Confirmed!</h2>
                <p className="text-xs text-[#526174]">Booking ID: <span className="font-black text-[#00A99D]">{activeBooking.bookingId}</span></p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F0FCFB] border border-[#00C2B3]/30 space-y-2 text-xs">
              <p className="font-black text-[#00A99D] uppercase tracking-wider">Next Step: Digital Vehicle Handover</p>
              <p className="text-[#526174]">
                Before keys are handed over, inspect the vehicle, verify fuel & odometer, and log any pre-existing scratches so you are never charged for them.
              </p>
            </div>

            <button
              onClick={() => setStage('PICKUP_INSPECTION')}
              className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-sm shadow-md hover:bg-[#0B1728]"
            >
              Start Pre-Handover Vehicle Inspection →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 4b — PRE-HANDOVER INSPECTION & DAMAGE MARKING
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'PICKUP_INSPECTION' && activeBooking && (
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Pre-Handover Inspection Checklist</h2>
          <p className="text-xs text-[#526174]">Document odometer, fuel, and mark any pre-existing scratches.</p>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#526174] block mb-1">Starting Odometer (km)</label>
                <input
                  type="number"
                  value={preOdometer}
                  onChange={(e) => setPreOdometer(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#526174] block mb-1">Starting Fuel (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={preFuel}
                  onChange={(e) => setPreFuel(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Damage Marking Section */}
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0B1728] dark:text-white">Tag Pre-Existing Damage</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select value={newDamageLoc} onChange={(e) => setNewDamageLoc(e.target.value)} className="px-2 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none">
                  {DAMAGE_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select value={newDamageType} onChange={(e) => setNewDamageType(e.target.value as any)} className="px-2 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none">
                  {['SCRATCH', 'DENT', 'CRACK', 'PAINT_DAMAGE', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={newDamageSeverity} onChange={(e) => setNewDamageSeverity(e.target.value as any)} className="px-2 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none">
                  {['MINOR', 'MODERATE', 'MAJOR'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  value={newDamageDesc}
                  onChange={(e) => setNewDamageDesc(e.target.value)}
                  placeholder="e.g. 2-inch faint scratch on lower bumper edge..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none"
                />
                <button onClick={() => handleAddDamageMarker(true)} className="px-4 py-2 rounded-xl bg-[#00C2B3] text-white text-xs font-bold">
                  + Add Tag
                </button>
              </div>

              {/* Tagged Damages List */}
              {preDamages.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] font-black text-[#526174] uppercase tracking-wider">Logged Pre-Existing Items ({preDamages.length})</p>
                  {preDamages.map((d, i) => (
                    <div key={i} className="p-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#0B1728] dark:text-white">{d.location}</span>: <span className="text-[#526174]">{d.damageType} ({d.severity})</span> - {d.description}
                      </div>
                      <button onClick={() => setPreDamages(preDamages.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitPreInspection}
              className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-sm shadow-md hover:bg-[#0B1728]"
            >
              Generate Digital Handover Report →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 4c — CUSTOMER DIGITAL ACKNOWLEDGEMENT (3 Checkboxes)
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'HANDOVER_ACK' && activeBooking && (
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Customer Handover Acknowledgement</h2>
          <p className="text-xs text-[#526174]">Review the recorded condition and accept to activate your rental.</p>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
            {/* Handover Evidence Summary */}
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-2 text-xs">
              <h4 className="font-black text-[#0B1728] dark:text-white">Digital Handover Evidence</h4>
              <div className="flex justify-between"><span className="text-[#526174]">Odometer at Pickup:</span><span className="font-bold">{preOdometer} km</span></div>
              <div className="flex justify-between"><span className="text-[#526174]">Fuel Level at Pickup:</span><span className="font-bold">{preFuel}%</span></div>
              <div className="flex justify-between"><span className="text-[#526174]">Pre-existing Damages Logged:</span><span className="font-bold">{preDamages.length} item(s)</span></div>
            </div>

            {/* 3 Mandatory Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={ackCondition} onChange={(e) => setAckCondition(e.target.checked)} className="w-4 h-4 accent-[#00C2B3] mt-0.5" />
                <span className="text-xs font-semibold text-[#0B1728] dark:text-slate-300">
                  I have reviewed the vehicle condition and verify it is clean and roadworthy.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={ackDamages} onChange={(e) => setAckDamages(e.target.checked)} className="w-4 h-4 accent-[#00C2B3] mt-0.5" />
                <span className="text-xs font-semibold text-[#0B1728] dark:text-slate-300">
                  I acknowledge the listed pre-existing damage ({preDamages.length} tagged item(s)) and understand I will not be charged for these.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={ackTerms} onChange={(e) => setAckTerms(e.target.checked)} className="w-4 h-4 accent-[#00C2B3] mt-0.5" />
                <span className="text-xs font-semibold text-[#0B1728] dark:text-slate-300">
                  I agree to the rental terms and accept key handover.
                </span>
              </label>
            </div>

            <button
              onClick={handleCustomerAcknowledge}
              disabled={!ackCondition || !ackDamages || !ackTerms}
              className="w-full py-4 rounded-2xl bg-[#07111F] disabled:opacity-50 hover:bg-[#0B1728] text-white font-black text-sm shadow-md"
            >
              ✓ Accept & Start Rental →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 5 — ACTIVE RENTAL
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'ACTIVE' && activeBooking && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Active Rental</h2>
              <p className="text-xs text-[#526174]">Booking: <span className="font-black text-[#00A99D]">{activeBooking.bookingId}</span></p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#00C2B3]/10 text-[#00A99D] text-xs font-black uppercase">🚗 Active</span>
          </div>

          <div className="h-52 rounded-2xl overflow-hidden border border-[#E5EAF0] dark:border-[#17334F]">
            <EnhancedCabMap
              pickup={{ lat: activeBooking.vehicleId?.location?.lat || 26.4499, lng: activeBooking.vehicleId?.location?.lng || 80.3319, address: activeBooking.pickupLocation }}
              drop={{ lat: activeBooking.vehicleId?.location?.lat || 26.4499, lng: activeBooking.vehicleId?.location?.lng || 80.3319, address: activeBooking.returnLocation }}
              statusLabel="Self-Drive Active"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-[#00A99D]" />
              <div>
                <p className="text-xs font-black text-[#0B1728] dark:text-white">Time Remaining</p>
                <p className="text-[10px] text-[#526174]">Return by {new Date(activeBooking.currentReturnDateTime).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <span className="text-lg font-black text-[#00A99D]">{timeRemainingLabel || 'Active'}</span>
          </div>

          {/* Section 5: View Handover Report Access */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={handleViewHandoverReport} className="py-3 rounded-xl bg-[#00C2B3]/10 border border-[#00C2B3]/30 text-xs font-bold text-[#00A99D] flex items-center justify-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Handover Report
            </button>
            <button onClick={() => setShowExtendModal(true)} className="py-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#526174] flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Extend
            </button>
            <button onClick={() => alert('VITO 24/7 Helpline: +91 1800-8486-482')} className="py-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#526174] flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Support
            </button>
            <button onClick={() => alert('VITO Emergency SOS dispatched.')} className="py-3 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> SOS
            </button>
          </div>

          <button onClick={() => setStage('RETURN_INSPECTION')} className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-sm shadow-md hover:bg-[#0B1728]">
            Start Vehicle Return & Inspection →
          </button>
        </div>
      )}

      {/* ── Handover Report Modal ─────────────────────────────────────────────── */}
      {showHandoverReportModal && handoverReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-[#0B1728] dark:text-white">Digital Handover Report</h3>
                <p className="text-xs text-[#526174]">Booking {handoverReport.bookingId}</p>
              </div>
              <button onClick={() => setShowHandoverReportModal(false)}><X className="w-5 h-5 text-[#526174]" /></button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F0FCFB] border border-[#00C2B3]/30 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-[#526174]">Pickup Odometer:</span><span className="font-bold">{handoverReport.odometerKm} km</span></div>
              <div className="flex justify-between"><span className="text-[#526174]">Pickup Fuel Level:</span><span className="font-bold">{handoverReport.fuelLevelPercent}%</span></div>
              <div className="flex justify-between"><span className="text-[#526174]">Acknowledged At:</span><span className="font-bold">{new Date(handoverReport.acknowledgedAt).toLocaleString('en-IN')}</span></div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-[#0B1728] dark:text-white">Pre-Existing Damage Evidence</p>
              {handoverReport.existingDamages.length === 0 ? (
                <p className="text-xs text-[#526174]">No pre-existing damages reported at handover.</p>
              ) : (
                handoverReport.existingDamages.map((d: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] text-xs space-y-0.5">
                    <p className="font-bold text-[#0B1728] dark:text-white">{d.location} ({d.damageType})</p>
                    <p className="text-[11px] text-[#526174]">{d.description}</p>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setShowHandoverReportModal(false)} className="w-full py-3 rounded-xl bg-[#07111F] text-white text-xs font-bold">
              Close Report
            </button>
          </div>
        </div>
      )}

      {/* ── Extend Modal ─────────────────────────────────────────────────────── */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] rounded-3xl p-6 max-w-sm w-full space-y-5">
            <div className="flex justify-between">
              <h3 className="text-base font-black text-[#0B1728] dark:text-white">Extend Rental</h3>
              <button onClick={() => { setShowExtendModal(false); setExtensionPreview(null); }}><X className="w-5 h-5 text-[#526174]" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 6, 24].map(h => (
                <button key={h} onClick={() => setExtendHours(h)}
                  className={`py-2.5 rounded-xl text-xs font-black border ${extendHours === h ? 'bg-[#07111F] text-white border-transparent' : 'bg-[#F7F9FC] dark:bg-[#10243A] border-[#E5EAF0] dark:border-[#17334F] text-[#526174]'}`}>
                  +{h === 24 ? '1d' : `${h}h`}
                </button>
              ))}
            </div>
            <button onClick={async () => {
              if (!activeBooking) return;
              setExtendingLoading(true);
              try {
                const res = await fetchAPI(`/api/rental/bookings/${activeBooking._id}/extend`, {
                  method: 'POST',
                  body: { additionalHours: extendHours },
                });
                if (res.success) setExtensionPreview(res.data.extensionPricing);
              } catch (err: any) { alert(err.message || 'Extension unavailable'); }
              finally { setExtendingLoading(false); }
            }} disabled={extendingLoading} className="w-full py-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white">
              {extendingLoading ? 'Checking availability...' : 'Check Price'}
            </button>
            {extensionPreview && (
              <div className="p-3 rounded-xl bg-[#F0FCFB] border border-[#00C2B3]/30 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-[#526174]">Additional charge:</span><span className="font-black text-[#00A99D]">{formatINR(extensionPreview.additionalCharge)}</span></div>
                <button onClick={async () => {
                  if (!activeBooking || !extensionPreview) return;
                  try {
                    const res = await fetchAPI(`/api/rental/bookings/${activeBooking._id}/extend/confirm`, {
                      method: 'POST',
                      body: { additionalHours: extendHours, additionalCharge: extensionPreview.additionalCharge },
                    });
                    if (res.success) {
                      setActiveBooking(res.data.booking);
                      setShowExtendModal(false);
                      setExtensionPreview(null);
                    }
                  } catch (err: any) { alert(err.message || 'Extension failed'); }
                }} className="w-full py-3 mt-2 rounded-xl bg-[#07111F] text-white font-black">
                  ✓ Confirm Extension
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 6 — RETURN INSPECTION & DIFFERENCE FLAGGING
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'RETURN_INSPECTION' && activeBooking && (
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Post-Return Inspection</h2>
          <p className="text-xs text-[#526174]">Compare return evidence against pickup handover. Only operator-confirmed damages can be charged.</p>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#526174] block mb-1">Return Odometer (km)</label>
                <input
                  type="number"
                  value={returnOdometer}
                  onChange={(e) => setReturnOdometer(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#526174] block mb-1">Return Fuel (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={returnFuel}
                  onChange={(e) => setReturnFuel(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Before vs After Fuel preview */}
            {preFuel - returnFuel > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-xs">
                <p className="font-bold text-amber-700 dark:text-amber-400">Fuel reconciliation: {formatINR((preFuel - returnFuel) * 20)}</p>
                <p className="text-amber-600/80">({preFuel - returnFuel}% deficit × ₹20/1%)</p>
              </div>
            )}

            {/* Flag New Return Damage */}
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0B1728] dark:text-white">Flag Any New Damage</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select value={newDamageLoc} onChange={(e) => setNewDamageLoc(e.target.value)} className="px-2 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none">
                  {DAMAGE_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select value={newDamageType} onChange={(e) => setNewDamageType(e.target.value as any)} className="px-2 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none">
                  {['SCRATCH', 'DENT', 'CRACK', 'PAINT_DAMAGE', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={newDamageSeverity} onChange={(e) => setNewDamageSeverity(e.target.value as any)} className="px-2 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none">
                  {['MINOR', 'MODERATE', 'MAJOR'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  value={newDamageDesc}
                  onChange={(e) => setNewDamageDesc(e.target.value)}
                  placeholder="Describe newly detected damage..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#071118] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none"
                />
                <button onClick={() => handleAddDamageMarker(false)} className="px-4 py-2 rounded-xl bg-[#00C2B3] text-white text-xs font-bold">
                  + Flag Item
                </button>
              </div>

              {returnDamages.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-bold">⚠️ Safety Rule Enforced:</p>
                  <p className="text-[11px] mt-0.5">
                    Flagged damages are submitted for operator review. No damage deduction will be made until confirmed by fleet management.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitReturnInspection}
              className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-sm shadow-md hover:bg-[#0B1728]"
            >
              Complete Inspection & Review Final Bill →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 6b — FINAL BILL & SETTLEMENT
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'FINAL_BILL' && activeBooking && finalBill && (
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Final Itemized Bill</h2>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-2.5 text-xs">
            <div className="flex justify-between"><span className="text-[#526174]">Base Rental</span><span className="font-bold">{formatINR(finalBill.baseRental)}</span></div>
            {finalBill.durationAdjustment !== 0 && <div className="flex justify-between text-emerald-600"><span>Duration Adjustment</span><span className="font-bold">{formatINR(finalBill.durationAdjustment)}</span></div>}
            {finalBill.extensionCharges > 0 && <div className="flex justify-between"><span className="text-[#526174]">Extensions</span><span className="font-bold">{formatINR(finalBill.extensionCharges)}</span></div>}
            {finalBill.deliveryFee > 0 && <div className="flex justify-between"><span className="text-[#526174]">Doorstep Delivery</span><span className="font-bold">{formatINR(finalBill.deliveryFee)}</span></div>}
            {finalBill.fuelAdjustmentCharge > 0 && <div className="flex justify-between text-red-500"><span>Fuel Reconciliation</span><span className="font-bold">+{formatINR(finalBill.fuelAdjustmentCharge)}</span></div>}
            {finalBill.lateFeeCharge > 0 && <div className="flex justify-between text-red-500"><span>Late Return Fee</span><span className="font-bold">+{formatINR(finalBill.lateFeeCharge)}</span></div>}
            {finalBill.damageCharge > 0 && <div className="flex justify-between text-red-500"><span>Confirmed Damage Charge</span><span className="font-bold">+{formatINR(finalBill.damageCharge)}</span></div>}

            <div className="h-px bg-[#E5EAF0] dark:bg-[#17334F] my-2" />
            <div className="flex justify-between font-black text-sm text-[#0B1728] dark:text-white">
              <span>Total Settlement</span><span>{formatINR(finalBill.subtotal)}</span>
            </div>

            {/* Deposit Refund — Strictly Separate Line */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 space-y-1">
              <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400">
                <span>Security Deposit Refund:</span>
                <span className="text-emerald-600 font-black">{formatINR(finalBill.depositRefundAmount)}</span>
              </div>
              <p className="text-[10px] text-amber-600/80">Status: <span className="font-bold">{finalBill.depositRefundStatus}</span> (processed directly to original payment method)</p>
            </div>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-sm shadow-md hover:bg-[#0B1728]"
          >
            Settle Final Bill — {formatINR(finalBill.subtotal)} →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RATING
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'RATING' && (
        <div className="max-w-md mx-auto space-y-5">
          <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Rate Your Experience</h2>
          {ratingSubmitted ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-black text-[#0B1728] dark:text-white">Thank You!</h3>
              <p className="text-xs text-[#526174]">Your rating and handover feedback have been logged.</p>
              <button onClick={() => { setStage('HISTORY'); loadMyRentals('completed'); }} className="w-full py-3 rounded-xl bg-[#07111F] text-white font-black text-xs">
                View My Rentals →
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
              {[
                ['vehicleCondition', 'Vehicle Condition'],
                ['vehicleQuality', 'Vehicle Quality'],
                ['pickupExperience', 'Handover Experience'],
                ['overall', 'Overall Trip'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#526174]">{label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRatings(r => ({ ...r, [key]: star }))}
                        className={`w-7 h-7 rounded-lg ${(ratings as any)[key] >= star ? 'text-[#C9A45C]' : 'text-[#CCD6E2]'}`}>
                        <Star className={`w-5 h-5 ${(ratings as any)[key] >= star ? 'fill-[#C9A45C]' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Comments on the vehicle condition, digital handover, or drive..."
                className="w-full p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold outline-none text-[#0B1728] dark:text-white h-20" />
              <button onClick={async () => {
                if (!activeBooking) return;
                try {
                  await fetchAPI(`/api/rental/bookings/${activeBooking._id}/rating`, {
                    method: 'POST',
                    body: { ...ratings, comment: ratingComment },
                  });
                  setRatingSubmitted(true);
                } catch {}
              }} className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-black text-sm">Submit Rating</button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 6 — MY RENTALS (History)
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'HISTORY' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">My Rentals</h2>
            <button onClick={() => setStage('SEARCH')} className="px-3.5 py-2 rounded-xl bg-[#07111F] text-white text-xs font-bold">
              + New Rental
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['upcoming', 'active', 'completed', 'cancelled'].map((tab) => (
              <button key={tab} onClick={() => setRentalsTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize ${rentalsTab === tab ? 'bg-[#07111F] text-white' : 'bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-[#526174]'}`}>
                {tab}
              </button>
            ))}
          </div>

          {myRentals.length === 0 ? (
            <div className="text-center py-16 text-[#526174]">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No rentals yet — Start your first rental with VITO.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRentals.map((rental) => (
                <div key={rental._id} className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-black text-[#0B1728] dark:text-white">{(rental.vehicleId as any)?.name}</p>
                      <p className="text-[10px] text-[#526174]">Booking: <span className="font-bold text-[#00A99D]">{rental.bookingId}</span></p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#00C2B3]/10 text-[#00A99D]">
                      {rental.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div><p className="text-[#8995A5]">Pickup</p><p className="font-bold">{new Date(rental.pickupDateTime).toLocaleDateString('en-IN')}</p></div>
                    <div><p className="text-[#8995A5]">Return</p><p className="font-bold">{new Date(rental.returnDateTime).toLocaleDateString('en-IN')}</p></div>
                    <div><p className="text-[#8995A5]">Rental Total</p><p className="font-bold">{formatINR(rental.pricing.totalPayable)}</p></div>
                    <div><p className="text-[#8995A5]">Deposit</p><p className="font-bold text-amber-600">{formatINR(rental.pricing.securityDeposit)}</p></div>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-1">
                    <button onClick={() => handleViewBookingDetails(rental._id)} className="px-3 py-1.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Full Rental Breakdown (13 Sections)
                    </button>
                    {rental.status === 'CONFIRMED' && (
                      <button onClick={() => { setActiveBooking(rental); setStage('CONFIRMED'); }} className="px-3 py-1.5 rounded-xl bg-[#07111F] text-white text-xs font-bold">
                        Start Pickup →
                      </button>
                    )}
                    {['ACTIVE', 'EXTENDED'].includes(rental.status) && (
                      <button onClick={() => { setActiveBooking(rental); setStage('ACTIVE'); }} className="px-3 py-1.5 rounded-xl bg-[#00C2B3] text-white text-xs font-bold">
                        Active Rental Console →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 6b — 13-SECTION DETAILED RENTAL SUMMARY PAGE
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === 'BOOKING_DETAILS' && bookingDetailsData && (
        <div className="space-y-5 max-w-4xl mx-auto">
          <button onClick={() => setStage('HISTORY')} className="flex items-center gap-1.5 text-xs font-bold text-[#526174]">
            <ChevronLeft className="w-4 h-4" /> Back to My Rentals
          </button>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#0B1728] dark:text-white">Rental Breakdown & Digital Record</h2>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#00C2B3]/10 text-[#00A99D]">
              {bookingDetailsData.bookingOverview.status}
            </span>
          </div>

          <div className="space-y-4">
            {/* 1. Overview & Vehicle */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#8995A5]">1. Booking & Vehicle Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><p className="text-[#8995A5]">Booking ID</p><p className="font-black text-[#00A99D]">{bookingDetailsData.bookingOverview.bookingId}</p></div>
                <div><p className="text-[#8995A5]">Vehicle</p><p className="font-bold">{bookingDetailsData.vehicle.name}</p></div>
                <div><p className="text-[#8995A5]">Pickup</p><p className="font-bold">{new Date(bookingDetailsData.pickupAndReturn.pickupDateTime).toLocaleString('en-IN')}</p></div>
                <div><p className="text-[#8995A5]">Return</p><p className="font-bold">{new Date(bookingDetailsData.pickupAndReturn.returnDateTime).toLocaleString('en-IN')}</p></div>
              </div>
            </div>

            {/* 2. Documents Breakdown */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#8995A5]">2. Verified Documents Checklist</h3>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#0B1728] dark:text-white">Customer Documents</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {bookingDetailsData.documents.customerDocuments.map((d: any) => (
                    <div key={d.documentType} className="p-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F]">
                      <p className="font-bold">{d.documentName}</p>
                      <p className="text-[10px] text-[#8995A5]">{d.maskedIdentifier}</p>
                      <p className="text-[9px] text-[#16A67A] font-bold">✓ {d.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#0B1728] dark:text-white">Vehicle Fleet Documents</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {bookingDetailsData.documents.vehicleDocuments.map((d: any) => (
                    <div key={d.documentType} className="p-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F]">
                      <p className="font-bold text-[11px]">{d.documentName.split('(')[0]}</p>
                      <p className="text-[10px] text-[#8995A5]">{d.maskedIdentifier}</p>
                      <p className="text-[9px] text-[#16A67A] font-bold">✓ {d.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#0B1728] dark:text-white">Rental Audit Documents</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {bookingDetailsData.documents.rentalDocuments.map((d: any) => (
                    <div key={d.documentType} className="p-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F]">
                      <p className="font-bold text-[11px]">{d.documentName}</p>
                      <p className="text-[9px] text-[#00A99D] font-bold">✓ {d.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Real Event Timeline */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#8995A5]">3. Chronological Lifecycle Timeline</h3>
              <div className="space-y-3 text-xs pl-2 border-l-2 border-[#00C2B3]">
                {(bookingDetailsData.timeline || []).map((ev: any, idx: number) => (
                  <div key={idx} className="relative pl-3 space-y-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#00C2B3] absolute -left-[17px] top-1.5" />
                    <p className="font-black text-[#0B1728] dark:text-white">{ev.event}</p>
                    <p className="text-[11px] text-[#526174]">{ev.description}</p>
                    <p className="text-[9px] text-[#8995A5]">{new Date(ev.timestamp).toLocaleString('en-IN')} • By {ev.actor}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ────────────────────────────────────────────────────── */}
      {showPaymentModal && (
        <MockPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={booking?._id || activeBooking?._id || 'rental_' + Date.now()}
          bookingType="rental"
          totalFare={
            stage === 'FINAL_BILL'
              ? (finalBill?.subtotal || 0)
              : (finalPricing?.totalWithDeposit || selectedVehicle?.pricing?.totalWithDeposit || 0)
          }
          itemDescription={
            stage === 'FINAL_BILL'
              ? 'VITO Rental Final Settlement'
              : `VITO Vehicle Rental — ${selectedVehicle?.name}`
          }
          onPaymentSuccess={stage === 'FINAL_BILL' ? handleFinalPaymentSuccess : handlePaymentSuccess}
        />
      )}
    </div>
  );
}
