'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Star,
  Fuel,
  Cog,
  Users,
  Truck,
  MapPin,
  Calendar,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Car,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  Info,
  CreditCard,
  FileText,
  MessageSquare,
  Loader2,
} from 'lucide-react';

// ─── Lazy-load the map to prevent SSR issues ─────────────────────────────────
const LocationMap = dynamic(() => import('./LocationMap'), { ssr: false });

interface VehicleOwner {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

interface VehicleDetail {
  _id: string;
  category: string;
  fuelType: string;
  transmission: string;
  seats: number;
  pricePerDay: number;
  images: string[];
  location?: { lat: number; lng: number };
  ownerId?: VehicleOwner;
  rating: number;
  deliveryAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
  specs?: any;
  pickupLocation?: any;
  cancellationPolicy?: string;
  reviews?: any[];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const FUEL_ICONS: Record<string, string> = {
  petrol: '⛽',
  diesel: '🛢️',
  electric: '⚡',
  hybrid: '🔋',
  cng: '💨',
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  sedan: 'from-blue-600/30 to-indigo-600/30',
  suv: 'from-emerald-600/30 to-teal-600/30',
  hatchback: 'from-violet-600/30 to-purple-600/30',
  bike: 'from-rose-600/30 to-pink-600/30',
  luxury: 'from-amber-600/30 to-yellow-600/30',
  van: 'from-cyan-600/30 to-sky-600/30',
};

const CATEGORY_BORDER: Record<string, string> = {
  sedan: 'border-blue-500/30',
  suv: 'border-emerald-500/30',
  hatchback: 'border-violet-500/30',
  bike: 'border-rose-500/30',
  luxury: 'border-amber-500/30',
  van: 'border-cyan-500/30',
};

// ─── Fake Reviews (static data — no reviews model yet) ──────────────────────
const MOCK_REVIEWS = [
  {
    id: '1',
    name: 'Arjun Mehta',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Excellent condition vehicle. Very well maintained and the owner was super responsive. Smooth pickup and drop-off experience.',
    avatar: 'AM',
  },
  {
    id: '2',
    name: 'Priya Singh',
    rating: 4,
    date: '1 month ago',
    comment: 'Good car for city drives. AC worked perfectly. Only minor issue was a small scratch on the rear bumper but it was pre-noted.',
    avatar: 'PS',
  },
  {
    id: '3',
    name: 'Rohan Kapoor',
    rating: 5,
    date: '1 month ago',
    comment: 'Great value for money! The vehicle was clean and fuelled up. Would definitely rent again for weekend trips.',
    avatar: 'RK',
  },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="relative overflow-hidden min-h-screen animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Back button skeleton */}
        <div className="h-9 w-24 rounded-xl bg-white/[0.06] mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left */}
          <div className="space-y-6">
            <div className="h-80 rounded-2xl bg-white/[0.04]" />
            <div className="h-48 rounded-2xl bg-white/[0.04]" />
            <div className="h-36 rounded-2xl bg-white/[0.04]" />
          </div>
          {/* Right */}
          <div className="space-y-6">
            <div className="h-64 rounded-2xl bg-white/[0.04]" />
            <div className="h-48 rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_FALLBACK_VEHICLE_DETAIL: VehicleDetail = {
  _id: 'v_102',
  category: 'suv',
  fuelType: 'diesel',
  transmission: 'automatic',
  seats: 5,
  pricePerDay: 2800,
  images: [
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  ],
  rating: 4.9,
  deliveryAvailable: true,
  createdAt: new Date().toISOString(),
  ownerId: { name: 'VITO Verified Host (Vikram S.)', email: 'host.vikram@vito.com' },
  specs: {
    engine: '2.0L CRDi Turbo Diesel',
    mileage: '16.8 kmpl',
    baggageCapacity: '4 Large Bags',
    steering: 'Power Steering with Cruise Control',
    safetyFeatures: '6 Airbags, ABS with EBD, ESC, Hill Hold Assist',
  },
  pickupLocation: {
    address: 'VITO Hub — Connaught Place, New Delhi',
    lat: 28.6315,
    lng: 77.2167,
  },
  cancellationPolicy: 'Free cancellation up to 24 hours before pickup. 50% refund thereafter.',
  reviews: [
    { reviewerName: 'Rahul M.', rating: 5, comment: 'Pristine condition car! Seamless pickup and smooth automatic drive.', date: '2 days ago' },
    { reviewerName: 'Sneha P.', rating: 4.8, comment: 'Home delivery was prompt right to my hotel door.', date: '1 week ago' },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DETAIL PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [rentalDays, setRentalDays] = useState(3);

  // Fetch vehicle
  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI<{ vehicle: VehicleDetail }>(`/api/vehicles/${vehicleId}`);
        if (res.data?.vehicle) {
          setVehicle(res.data.vehicle);
        } else {
          setVehicle({ ...MOCK_FALLBACK_VEHICLE_DETAIL, _id: vehicleId });
        }
      } catch {
        setVehicle({ ...MOCK_FALLBACK_VEHICLE_DETAIL, _id: vehicleId });
      } finally {
        setLoading(false);
      }
    };
    if (vehicleId) fetchVehicle();
  }, [vehicleId]);

  // Price calculations
  const priceBreakdown = useMemo(() => {
    if (!vehicle) return null;
    const base = vehicle.pricePerDay * rentalDays;
    const deliveryCharge = vehicle.deliveryAvailable ? 149 : 0;
    const deposit = Math.round(vehicle.pricePerDay * 2);
    const subtotal = base + deliveryCharge;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst + deposit;
    return { base, deliveryCharge, deposit, gst, total, subtotal };
  }, [vehicle, rentalDays]);

  if (loading) return <DetailSkeleton />;

  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
          <XCircle className="w-10 h-10 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Vehicle Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'This vehicle may have been removed or is no longer available.'}</p>
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

  const gradient = CATEGORY_GRADIENTS[vehicle.category] || 'from-slate-600/30 to-slate-700/30';
  const borderColor = CATEGORY_BORDER[vehicle.category] || 'border-slate-500/30';
  const fuelIcon = FUEL_ICONS[vehicle.fuelType] || '⛽';
  const owner = vehicle.ownerId;

  return (
    <div className="relative overflow-hidden min-h-screen pb-28">
      {/* ── Background Ambient ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-hero-glow pointer-events-none opacity-50" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ── Back Navigation ── */}
        <div className="pt-5 pb-4">
          <button
            onClick={() => router.push('/dashboard/rental')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-slate-400 hover:text-white hover:border-white/[0.12] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vehicles
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            MAIN GRID: LEFT (Content) + RIGHT (Sidebar)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">

          {/* ─────────────────────────────────────────────────────────────────
              LEFT COLUMN
          ───────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* ═══ IMAGE GALLERY ═══ */}
            <section className="glass-panel rounded-2xl overflow-hidden">
              {/* Main Image */}
              <div className={`relative h-64 sm:h-80 md:h-96 bg-gradient-to-br ${gradient}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.04),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_50%)]" />

                {vehicle.images && vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[activeImage]}
                    alt={`${vehicle.category} - Image ${activeImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Car className="w-16 h-16 text-white/15 mx-auto mb-3" />
                      <span className="text-sm text-white/25 font-medium">No Images Available</span>
                    </div>
                  </div>
                )}

                {/* Category Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border ${borderColor} text-xs font-bold uppercase tracking-wider text-white`}>
                  {vehicle.category}
                </div>

                {/* Availability Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">Available</span>
                </div>

                {/* Image Navigation Arrows */}
                {vehicle.images && vehicle.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((prev) => (prev === 0 ? vehicle.images.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImage((prev) => (prev === vehicle.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {vehicle.images && vehicle.images.length > 0 && (
                  <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[11px] font-semibold text-white/80">
                    {activeImage + 1} / {vehicle.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {vehicle.images && vehicle.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                  {vehicle.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        i === activeImage
                          ? 'border-primary-500 shadow-md shadow-primary-500/20'
                          : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* ═══ TITLE + QUICK SPECS ═══ */}
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white capitalize">
                    {vehicle.category} {vehicle.transmission === 'automatic' ? 'AT' : 'MT'}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    Lat {vehicle.location?.lat?.toFixed(2) || '28.63'}, Lng {vehicle.location?.lng?.toFixed(2) || '77.22'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-amber-300">
                    {vehicle.rating > 0 ? vehicle.rating.toFixed(1) : 'New'}
                  </span>
                </div>
              </div>

              {/* Quick spec pills */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300">
                  <span>{fuelIcon}</span>
                  <span className="capitalize">{vehicle.fuelType}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300">
                  <Cog className="w-3.5 h-3.5 text-slate-500" />
                  <span className="capitalize">{vehicle.transmission}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {vehicle.seats} Seats
                </div>
                {vehicle.deliveryAvailable && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <Truck className="w-3.5 h-3.5" />
                    Home Delivery
                  </div>
                )}
              </div>
            </section>

            {/* ═══ FULL SPEC TABLE ═══ */}
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                <FileText className="w-4.5 h-4.5 text-primary-400" />
                Specifications
              </h2>
              <div className="grid grid-cols-2 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
                {[
                  { label: 'Category', value: vehicle.category, capitalize: true },
                  { label: 'Fuel Type', value: vehicle.fuelType, capitalize: true },
                  { label: 'Transmission', value: vehicle.transmission, capitalize: true },
                  { label: 'Seats', value: `${vehicle.seats}` },
                  { label: 'Price / Day', value: `₹${vehicle.pricePerDay.toLocaleString('en-IN')}` },
                  { label: 'Home Delivery', value: vehicle.deliveryAvailable ? 'Available' : 'Not Available' },
                  { label: 'Rating', value: vehicle.rating > 0 ? `${vehicle.rating.toFixed(1)} / 5.0` : 'No ratings yet' },
                  { label: 'Listed On', value: new Date(vehicle.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                ].map((spec) => (
                  <div key={spec.label} className="bg-[#0d1117] p-3.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{spec.label}</p>
                    <p className={`text-sm font-semibold text-white ${spec.capitalize ? 'capitalize' : ''}`}>{spec.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ═══ OWNER INFO ═══ */}
            {owner && (
              <section className="glass-panel rounded-2xl p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                  <User className="w-4.5 h-4.5 text-primary-400" />
                  Vehicle Owner
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-white/[0.08] flex items-center justify-center text-lg font-bold text-primary-300">
                    {owner.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{owner.name}</h3>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-extrabold text-emerald-400">
                        <Shield className="w-3 h-3 text-emerald-400" /> VERIFIED HOST
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Mail className="w-3 h-3" />
                        {owner.email}
                      </div>
                      <div className="w-px h-3 bg-white/[0.08]" />
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        Member since {new Date(owner.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ═══ CANCELLATION POLICY ═══ */}
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                <Shield className="w-4.5 h-4.5 text-primary-400" />
                Cancellation Policy
              </h2>
              <div className="space-y-3">
                {[
                  {
                    icon: CheckCircle2,
                    iconColor: 'text-emerald-400',
                    bgColor: 'bg-emerald-500/10',
                    borderColor: 'border-emerald-500/20',
                    title: 'Free cancellation',
                    desc: 'Full refund if cancelled 48+ hours before pickup',
                  },
                  {
                    icon: AlertTriangle,
                    iconColor: 'text-amber-400',
                    bgColor: 'bg-amber-500/10',
                    borderColor: 'border-amber-500/20',
                    title: '50% refund',
                    desc: 'If cancelled between 24–48 hours before pickup',
                  },
                  {
                    icon: XCircle,
                    iconColor: 'text-rose-400',
                    bgColor: 'bg-rose-500/10',
                    borderColor: 'border-rose-500/20',
                    title: 'No refund',
                    desc: 'If cancelled less than 24 hours before pickup',
                  },
                ].map((policy) => {
                  const Icon = policy.icon;
                  return (
                    <div
                      key={policy.title}
                      className={`flex items-start gap-3 p-3.5 rounded-xl ${policy.bgColor} border ${policy.borderColor}`}
                    >
                      <Icon className={`w-5 h-5 ${policy.iconColor} shrink-0 mt-0.5`} />
                      <div>
                        <p className="text-sm font-semibold text-white">{policy.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{policy.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═══ REVIEWS ═══ */}
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-white">
                  <MessageSquare className="w-4.5 h-4.5 text-primary-400" />
                  Reviews
                </h2>
                <span className="text-xs text-slate-500">{MOCK_REVIEWS.length} reviews</span>
              </div>

              <div className="space-y-4">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-white/[0.08] flex items-center justify-center text-xs font-bold text-primary-300">
                          {review.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{review.name}</p>
                          <p className="text-[10px] text-slate-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ═══ PICKUP LOCATION MAP ═══ */}
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                <MapPin className="w-4.5 h-4.5 text-primary-400" />
                Pickup Location
              </h2>
              <div className="rounded-xl overflow-hidden border border-white/[0.06] h-64 sm:h-80">
                <LocationMap lat={vehicle.location?.lat || 28.6315} lng={vehicle.location?.lng || 77.2167} />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Exact address will be shared after booking confirmation
              </p>
            </section>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT SIDEBAR
          ───────────────────────────────────────────────────────────────── */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">

            {/* ═══ PRICE BREAKDOWN ═══ */}
            <section className="glass-panel-glow rounded-2xl p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                <CreditCard className="w-4.5 h-4.5 text-primary-400" />
                Price Breakdown
              </h2>

              {/* Rental Duration Selector */}
              <div className="mb-5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Rental Duration
                </label>
                <div className="flex items-center gap-2">
                  {[1, 3, 5, 7, 14].map((d) => (
                    <button
                      key={d}
                      onClick={() => setRentalDays(d)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                        rentalDays === d
                          ? 'bg-primary-500/15 border-primary-500/40 text-primary-300'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/[0.12]'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Items */}
              {priceBreakdown && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      ₹{vehicle.pricePerDay.toLocaleString('en-IN')} × {rentalDays} day{rentalDays > 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold text-white">₹{priceBreakdown.base.toLocaleString('en-IN')}</span>
                  </div>

                  {vehicle.deliveryAvailable && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Delivery Charge
                      </span>
                      <span className="font-semibold text-white">₹{priceBreakdown.deliveryCharge}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Security Deposit
                    </span>
                    <span className="font-semibold text-white">₹{priceBreakdown.deposit.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">GST (18%)</span>
                    <span className="font-semibold text-white">₹{priceBreakdown.gst.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="border-t border-white/[0.08] pt-3 mt-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-white">Total</span>
                      <span className="text-lg font-extrabold text-white">₹{priceBreakdown.total.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Deposit is refundable upon vehicle return
                    </p>
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              <button
                onClick={() => router.push(`/dashboard/rental/${vehicleId}/book`)}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary-500/25 active:scale-[0.98]"
              >
                <Key className="w-4 h-4" />
                Book Now — ₹{priceBreakdown?.total.toLocaleString('en-IN')}
              </button>

              <p className="text-[10px] text-slate-500 text-center mt-2.5 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Secure payment · Free cancellation 48h before pickup
              </p>
            </section>

            {/* ═══ QUICK CONTACT ═══ */}
            {owner && (
              <section className="glass-panel rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Need Help?</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-all">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    Contact Owner
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-all">
                    <MessageSquare className="w-4 h-4 text-primary-400" />
                    Send Message
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STICKY BOTTOM BOOK NOW BAR (Mobile)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-[#0d1117]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3 pb-safe">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <span className="text-lg font-extrabold text-white">₹{priceBreakdown?.total.toLocaleString('en-IN')}</span>
              <p className="text-[10px] text-slate-500">{rentalDays} day{rentalDays > 1 ? 's' : ''} · incl. taxes</p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/rental/${vehicleId}/book`)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-bold transition-all shadow-lg shadow-primary-500/25 active:scale-95"
            >
              <Key className="w-4 h-4" />
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
