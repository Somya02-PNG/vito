'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  Truck,
  MapPin,
  Shield,
  Key,
  Car,
  Cog,
  Users,
  Star,
  Fuel,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Tag,
  Plus,
  Baby,
  Navigation,
  UserPlus,
  ShieldCheck,
  Info,
  CreditCard,
  Sparkles,
  Gift,
  ChevronRight,
  Upload,
  FileCheck,
  FileText,
  CheckSquare,
  Square,
} from 'lucide-react';
import MockPaymentModal from '@/components/MockPaymentModal';

// ─── Types ───────────────────────────────────────────────────────────────────
interface VehicleDetail {
  _id: string;
  category: string;
  fuelType: string;
  transmission: string;
  seats: number;
  pricePerDay: number;
  images: string[];
  location: { lat: number; lng: number };
  rating: number;
  deliveryAvailable: boolean;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const FUEL_ICONS: Record<string, string> = {
  petrol: '⛽', diesel: '🛢️', electric: '⚡', hybrid: '🔋', cng: '💨',
};

const ADD_ONS: AddOn[] = [
  {
    id: 'child_seat',
    name: 'Child Seat',
    description: 'ISOFIX-compatible child safety seat',
    pricePerDay: 100,
    icon: <Baby className="w-5 h-5" />,
    color: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
  },
  {
    id: 'gps',
    name: 'GPS Navigator',
    description: 'Turn-by-turn navigation device',
    pricePerDay: 75,
    icon: <Navigation className="w-5 h-5" />,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
  },
  {
    id: 'extra_driver',
    name: 'Extra Driver',
    description: 'Register an additional authorized driver',
    pricePerDay: 200,
    icon: <UserPlus className="w-5 h-5" />,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
  },
  {
    id: 'insurance_upgrade',
    name: 'Insurance Upgrade',
    description: 'Zero-deductible comprehensive coverage',
    pricePerDay: 150,
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
  },
];

const DISTANCE_SLABS = [
  { label: '0 – 5 km', value: '0-5', charge: 0 },
  { label: '5 – 10 km', value: '5-10', charge: 150 },
  { label: '10 – 15 km', value: '10-15', charge: 300 },
  { label: '15+ km', value: '15+', charge: -1 }, // -1 = unavailable
];

const VALID_COUPONS: Record<string, { discount: number; label: string }> = {
  VITO10: { discount: 10, label: '10% off' },
  FIRST20: { discount: 20, label: '20% off — First booking' },
  SUMMER15: { discount: 15, label: '15% off — Summer special' },
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
function BookingSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="h-9 w-32 rounded-xl bg-white/[0.06]" />
        <div className="h-24 rounded-2xl bg-white/[0.04]" />
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
        <div className="h-56 rounded-2xl bg-white/[0.04]" />
        <div className="h-64 rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN BOOKING PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  // Vehicle data
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking form state
  const [pickupDate, setPickupDate] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [distanceSlab, setDistanceSlab] = useState('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');

  // Legal & Verification state
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
  const [aadhaarFileName, setAadhaarFileName] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Submission & Payment
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Fetch vehicle
  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI<{ vehicle: VehicleDetail }>(`/api/vehicles/${vehicleId}`);
        setVehicle(res.data?.vehicle ?? null);
      } catch (err: any) {
        setError(err?.message || 'Vehicle not found');
      } finally {
        setLoading(false);
      }
    };
    if (vehicleId) fetchVehicle();
  }, [vehicleId]);

  // ─── Computed Values ─────────────────────────────────────────────────────
  const rentalDays = useMemo(() => {
    if (!pickupDate || !dropDate) return 0;
    const start = new Date(pickupDate);
    const end = new Date(dropDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [pickupDate, dropDate]);

  const deliveryCharge = useMemo(() => {
    if (!deliveryEnabled || !distanceSlab) return 0;
    const slab = DISTANCE_SLABS.find((s) => s.value === distanceSlab);
    return slab ? slab.charge : 0;
  }, [deliveryEnabled, distanceSlab]);

  const isDeliveryUnavailable = deliveryEnabled && distanceSlab === '15+';

  const addOnsTotal = useMemo(() => {
    return selectedAddOns.reduce((sum, id) => {
      const addOn = ADD_ONS.find((a) => a.id === id);
      return sum + (addOn ? addOn.pricePerDay * rentalDays : 0);
    }, 0);
  }, [selectedAddOns, rentalDays]);

  const priceBreakdown = useMemo(() => {
    if (!vehicle || rentalDays <= 0) return null;
    const base = vehicle.pricePerDay * rentalDays;
    const delivery = deliveryCharge > 0 ? deliveryCharge : 0;
    const addOns = addOnsTotal;
    const subtotal = base + delivery + addOns;

    // Coupon discount
    let couponDiscount = 0;
    if (couponApplied && VALID_COUPONS[couponApplied]) {
      couponDiscount = Math.round(subtotal * (VALID_COUPONS[couponApplied].discount / 100));
    }

    const afterDiscount = subtotal - couponDiscount;
    const gst = Math.round(afterDiscount * 0.18);
    const deposit = Math.round(vehicle.pricePerDay * 2);
    const totalPayable = afterDiscount + gst;

    return { base, delivery, addOns, subtotal, couponDiscount, afterDiscount, gst, deposit, totalPayable };
  }, [vehicle, rentalDays, deliveryCharge, addOnsTotal, couponApplied]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    setCouponError('');
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    if (VALID_COUPONS[code]) {
      setCouponApplied(code);
      setCouponError('');
    } else {
      setCouponApplied(null);
      setCouponError('Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleConfirmBooking = () => {
    if (!vehicle || !priceBreakdown || rentalDays <= 0) return;
    if (isDeliveryUnavailable || !agreedToTerms) return;
    setShowPaymentModal(true);
  };

  const executeRentalBooking = async () => {
    if (!vehicle || !priceBreakdown || rentalDays <= 0) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      await fetchAPI('/api/rentals', {
        method: 'POST',
        body: {
          vehicleId: vehicle._id,
          startDate: pickupDate,
          endDate: dropDate,
          deliveryRequired: deliveryEnabled,
          deliveryAddress: deliveryEnabled ? deliveryAddress : '',
          deliveryCharge: deliveryCharge > 0 ? deliveryCharge : 0,
          addOns: selectedAddOns,
          couponCode: couponApplied || '',
          depositAmount: priceBreakdown.deposit,
        },
      });
      setShowPaymentModal(false);
      setBookingSuccess(true);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render States ───────────────────────────────────────────────────────
  if (loading) return <BookingSkeleton />;

  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
          <XCircle className="w-10 h-10 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Vehicle Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => router.push('/dashboard/rental')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500/15 border border-primary-500/30 text-sm font-semibold text-primary-300 hover:bg-primary-500/25 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vehicles
        </button>
      </div>
    );
  }

  // ─── Booking Success State ───────────────────────────────────────────────
  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6 mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-slate-400 mb-2">
            Your {vehicle.category} rental has been booked successfully.
          </p>
          <p className="text-xs text-slate-500 mb-8">
            {pickupDate} → {dropDate} · {rentalDays} day{rentalDays > 1 ? 's' : ''}
          </p>

          <div className="glass-panel rounded-2xl p-5 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Total Paid</span>
              <span className="font-bold text-white">₹{priceBreakdown?.totalPayable.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Security Deposit (held)</span>
              <span className="font-semibold text-amber-300">₹{priceBreakdown?.deposit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/dashboard/rental')}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-slate-300 hover:bg-white/[0.1] hover:text-white transition-all"
            >
              Browse More Vehicles
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold transition-all shadow-lg shadow-primary-500/25"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fuelIcon = FUEL_ICONS[vehicle.fuelType] || '⛽';
  const canSubmit =
    rentalDays > 0 &&
    !isDeliveryUnavailable &&
    (!deliveryEnabled || (deliveryAddress.trim().length > 0 && distanceSlab)) &&
    agreedToTerms;

  return (
    <div className="relative overflow-hidden min-h-screen pb-10">
      {/* ── Background Ambient ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-hero-glow pointer-events-none opacity-50" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ── Back Navigation ── */}
        <div className="pt-5 pb-4">
          <button
            onClick={() => router.push(`/dashboard/rental/${vehicleId}`)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vehicle
          </button>
        </div>

        {/* ── Page Title ── */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Complete Your <span className="text-gradient">Booking</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Review your selection and confirm your rental</p>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            VEHICLE SUMMARY STRIP
        ════════════════════════════════════════════════════════════════════ */}
        <section className="glass-panel rounded-2xl p-4 sm:p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-white/[0.08] flex items-center justify-center shrink-0">
              <Car className="w-8 h-8 text-primary-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white capitalize">
                {vehicle.category} {vehicle.transmission === 'automatic' ? 'AT' : 'MT'}
              </h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  {fuelIcon} <span className="capitalize">{vehicle.fuelType}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Cog className="w-3 h-3" /> <span className="capitalize">{vehicle.transmission}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3 h-3" /> {vehicle.seats} seats
                </span>
                {vehicle.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" /> {vehicle.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-extrabold text-white">₹{vehicle.pricePerDay.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500">/day</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 lg:gap-6">

          {/* ──────────────────────────────────────────────────────────────────
              LEFT COLUMN — FORM
          ────────────────────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* ═══ DATE CONFIRMATION ═══ */}
            <section className="glass-panel rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                <Calendar className="w-4.5 h-4.5 text-primary-400" />
                Confirm Dates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    min={today}
                    onChange={(e) => {
                      setPickupDate(e.target.value);
                      if (dropDate && e.target.value >= dropDate) setDropDate('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Drop-off Date
                  </label>
                  <input
                    type="date"
                    value={dropDate}
                    min={pickupDate || today}
                    onChange={(e) => setDropDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
              {rentalDays > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
                  <Info className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                  <span className="text-xs text-primary-300 font-medium">
                    {rentalDays} day{rentalDays > 1 ? 's' : ''} rental
                  </span>
                </div>
              )}
            </section>

            {/* ═══ HOME DELIVERY ═══ */}
            {vehicle.deliveryAvailable && (
              <section className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-base font-bold text-white">
                    <Truck className="w-4.5 h-4.5 text-emerald-400" />
                    Home Delivery
                  </h2>
                  <button
                    onClick={() => {
                      setDeliveryEnabled(!deliveryEnabled);
                      if (deliveryEnabled) {
                        setDeliveryAddress('');
                        setDistanceSlab('');
                      }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      deliveryEnabled ? 'bg-emerald-500' : 'bg-white/[0.15]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        deliveryEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {deliveryEnabled && (
                  <div className="space-y-4">
                    {/* Address Input */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Delivery Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Enter your full delivery address..."
                          rows={2}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Distance Slab Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Estimated Distance from Vehicle Hub
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {DISTANCE_SLABS.map((slab) => {
                          const isActive = distanceSlab === slab.value;
                          const isUnavailable = slab.charge === -1;
                          return (
                            <button
                              key={slab.value}
                              onClick={() => setDistanceSlab(slab.value)}
                              className={`relative p-3 rounded-xl text-center border transition-all duration-200 ${
                                isUnavailable && isActive
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                  : isActive
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/[0.12] hover:text-slate-200'
                              }`}
                            >
                              <p className="text-xs font-bold">{slab.label}</p>
                              <p className={`text-[10px] mt-0.5 font-semibold ${
                                isUnavailable
                                  ? 'text-rose-400'
                                  : slab.charge === 0
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}>
                                {isUnavailable ? 'Unavailable' : slab.charge === 0 ? 'FREE' : `₹${slab.charge}`}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {isDeliveryUnavailable && (
                        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-rose-300">
                            Home delivery is not available beyond 15 km. Please choose self-pickup or select a closer address.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ═══ ADD-ONS ═══ */}
            <section className="glass-panel rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                <Plus className="w-4.5 h-4.5 text-primary-400" />
                Add-Ons
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADD_ONS.map((addOn) => {
                  const isSelected = selectedAddOns.includes(addOn.id);
                  const totalCost = addOn.pricePerDay * (rentalDays || 1);
                  return (
                    <button
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn.id)}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                        isSelected
                          ? `${addOn.bgColor} ${addOn.borderColor} shadow-sm`
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isSelected
                          ? `${addOn.borderColor} ${addOn.bgColor}`
                          : 'border-white/[0.15]'
                      }`}>
                        {isSelected && <CheckCircle2 className={`w-4 h-4 ${addOn.color}`} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={addOn.color}>{addOn.icon}</span>
                          <span className="text-sm font-bold text-white">{addOn.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-1.5">{addOn.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-300">
                            ₹{addOn.pricePerDay}/day
                          </span>
                          {rentalDays > 0 && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className={`text-xs font-bold ${isSelected ? addOn.color : 'text-slate-500'}`}>
                                ₹{totalCost.toLocaleString('en-IN')} total
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ═══ COUPON CODE ═══ */}
            <section className="glass-panel rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                <Tag className="w-4.5 h-4.5 text-accent-400" />
                Coupon Code
              </h2>

              {couponApplied ? (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-sm font-bold text-emerald-300">{couponApplied}</span>
                      <span className="text-xs text-emerald-400 ml-2">{VALID_COUPONS[couponApplied]?.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 uppercase tracking-wider focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-5 py-2.5 rounded-xl bg-accent-500/15 border border-accent-500/30 text-sm font-bold text-accent-400 hover:bg-accent-500/25 transition-all whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
              )}

              {couponError && (
                <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {couponError}
                </p>
              )}

              <p className="mt-2.5 text-[10px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Try: VITO10, FIRST20, or SUMMER15
              </p>
            </section>

            {/* ═══ LEGAL & DOCUMENTS ═══ */}
            <section className="glass-panel rounded-2xl p-5 space-y-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white">
                <FileText className="w-4.5 h-4.5 text-primary-400" />
                Identity & Legal Agreement
              </h2>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Driving License */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                      {licenseFileName ? <FileCheck className="w-4 h-4 text-emerald-400" /> : <Upload className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Driving License</h4>
                      <p className="text-[10px] text-slate-400">Front copy of valid DL</p>
                    </div>
                  </div>

                  {licenseFileName ? (
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
                      <span className="text-[11px] font-semibold text-emerald-400 truncate max-w-[150px]">
                        ✓ {licenseFileName}
                      </span>
                      <label className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer underline">
                        Change
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setLicenseFileName(e.target.files[0].name);
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="mt-3 block w-full py-2 px-3 rounded-lg bg-white/[0.04] border border-dashed border-white/[0.12] text-center text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:border-primary-500/40 cursor-pointer transition-all">
                      Select License File
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setLicenseFileName(e.target.files[0].name);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Aadhaar / Gov ID */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      {aadhaarFileName ? <FileCheck className="w-4 h-4 text-emerald-400" /> : <Upload className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Aadhaar / National ID</h4>
                      <p className="text-[10px] text-slate-400">Govt. identity proof</p>
                    </div>
                  </div>

                  {aadhaarFileName ? (
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
                      <span className="text-[11px] font-semibold text-emerald-400 truncate max-w-[150px]">
                        ✓ {aadhaarFileName}
                      </span>
                      <label className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer underline">
                        Change
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setAadhaarFileName(e.target.files[0].name);
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="mt-3 block w-full py-2 px-3 rounded-lg bg-white/[0.04] border border-dashed border-white/[0.12] text-center text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:border-emerald-500/40 cursor-pointer transition-all">
                      Select ID Proof File
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setAadhaarFileName(e.target.files[0].name);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Digital Rental Agreement Box */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Digital Rental Agreement & Clauses
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl bg-[#090d16] border border-white/[0.08] p-4 text-xs text-slate-300 space-y-3.5 scrollbar-hide">
                  <div>
                    <h5 className="font-bold text-white mb-0.5">1. Damage Liability</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Renter assumes financial liability up to ₹10,000 for any physical, cosmetic, or mechanical damage caused to the vehicle during the rental period. Insurance Upgrade add-on reduces liability deductible to ₹0.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white mb-0.5">2. Fuel Policy</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Full-to-full fuel policy applies. The vehicle must be returned with the same fuel level as recorded at pickup. Refueling charges of ₹200 + missing fuel cost will be deducted from the security deposit.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white mb-0.5">3. Late Return Penalty</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      A grace period of 30 minutes is allowed. Delay beyond 30 minutes will incur a penalty charge equal to 2× the standard hourly rental rate (₹200/hour).
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white mb-0.5">4. Cancellation Policy</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Free cancellation up to 48 hours prior to pickup time. 50% refund for cancellations between 24-48 hours. No refund for cancellations under 24 hours.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white mb-0.5">5. Kilometer Limit</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Standard allowance of 300 km/day is included. Odometer readings above the total limit will be billed at ₹12 per additional kilometer upon return.
                    </p>
                  </div>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <label
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  agreedToTerms
                    ? 'bg-primary-500/10 border-primary-500/30 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] text-slate-400'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {agreedToTerms ? (
                    <CheckSquare className="w-5 h-5 text-primary-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white">I agree to the Rental Terms & Clauses</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    I confirm that I possess a valid driving license, government ID, and agree to adhere to all vehicle policies outlined above.
                  </p>
                </div>
              </label>
            </section>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              RIGHT COLUMN — LIVE PRICE SUMMARY
          ────────────────────────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-5">

            {/* ═══ PRICE SUMMARY ═══ */}
            <section className="glass-panel-glow rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                <CreditCard className="w-4.5 h-4.5 text-primary-400" />
                Price Summary
              </h2>

              {!priceBreakdown || rentalDays <= 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Select dates to see pricing</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Base Rental */}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      ₹{vehicle.pricePerDay.toLocaleString('en-IN')} × {rentalDays} day{rentalDays > 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold text-white">₹{priceBreakdown.base.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Add-Ons */}
                  {priceBreakdown.addOns > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add-Ons ({selectedAddOns.length})
                      </span>
                      <span className="font-semibold text-white">₹{priceBreakdown.addOns.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {/* Delivery */}
                  {priceBreakdown.delivery > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Delivery
                      </span>
                      <span className="font-semibold text-white">₹{priceBreakdown.delivery}</span>
                    </div>
                  )}
                  {deliveryEnabled && deliveryCharge === 0 && distanceSlab && !isDeliveryUnavailable && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Delivery
                      </span>
                      <span className="font-semibold text-emerald-400">FREE</span>
                    </div>
                  )}

                  {/* Coupon Discount */}
                  {priceBreakdown.couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Coupon ({couponApplied})
                      </span>
                      <span className="font-semibold text-emerald-400">
                        −₹{priceBreakdown.couponDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* GST */}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">GST (18%)</span>
                    <span className="font-semibold text-white">₹{priceBreakdown.gst.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Total */}
                  <div className="border-t border-white/[0.08] pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-white">Total Payable</span>
                      <span className="text-xl font-extrabold text-white">
                        ₹{priceBreakdown.totalPayable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Security Deposit — separate callout */}
                  <div className="mt-2 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                    <div className="flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300">Security Deposit</span>
                          <span className="text-sm font-extrabold text-amber-300">
                            ₹{priceBreakdown.deposit.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-400/70 mt-0.5">
                          Held separately · Fully refundable on vehicle return
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Booking Button */}
              <button
                onClick={handleConfirmBooking}
                disabled={!canSubmit || submitting}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Confirm Booking
                    {priceBreakdown && (
                      <span className="ml-1">— ₹{priceBreakdown.totalPayable.toLocaleString('en-IN')}</span>
                    )}
                  </>
                )}
              </button>

              {submitError && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300">{submitError}</p>
                </div>
              )}

              <p className="text-[10px] text-slate-500 text-center mt-2.5 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Secure payment · Free cancellation 48h before pickup
              </p>
            </section>

            {/* ═══ BOOKING INCLUDES ═══ */}
            <section className="glass-panel rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Your Booking Includes</h3>
              <div className="space-y-2.5">
                {[
                  { icon: Shield, color: 'text-emerald-400', text: 'Basic insurance coverage' },
                  { icon: Fuel, color: 'text-amber-400', text: 'Full-to-full fuel policy' },
                  { icon: Key, color: 'text-primary-400', text: '24/7 roadside assistance' },
                  { icon: MapPin, color: 'text-cyan-400', text: 'Unlimited kilometers' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <span className="text-xs text-slate-400">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ═══ MOCK PAYMENT CHARGE MODAL ═══ */}
      {vehicle && priceBreakdown && (
        <MockPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={vehicle._id}
          bookingType="rental"
          totalFare={priceBreakdown.totalPayable}
          itemDescription={`${vehicle.category} Rental (${rentalDays} Days) — Pickup: ${pickupDate}`}
          onPaymentSuccess={() => executeRentalBooking()}
        />
      )}
    </div>
  );
}
