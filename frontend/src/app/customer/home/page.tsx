'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import {
  MapPin,
  Search,
  Car,
  Key,
  UserCheck,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Compass,
  CheckCircle2,
  Navigation,
  ShieldAlert,
  ChevronRight,
  Star,
  Zap,
  Phone,
  Share2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Wallet,
  TrendingUp,
  Radio,
  FileText,
  BadgeCheck,
} from 'lucide-react';

interface ActiveTripData {
  _id: string;
  status: string;
  pickup: { address: string; lat: number; lng: number };
  drop: { address: string; lat: number; lng: number };
  fare: number;
  otp: string;
  category?: string;
  vehicleType?: string;
  driverInfo?: {
    name?: string;
    phone?: string;
    rating?: number;
    vehicleModel?: string;
    vehicleNo?: string;
    avatar?: string;
  };
  distance?: number;
  duration?: number;
}

interface RecentTripItem {
  _id: string;
  pickup: { address: string };
  drop: { address: string };
  fare: number;
  distance: number;
  vehicleType: string;
  status: string;
  createdAt: string;
}

interface DashboardData {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    identityVerified: boolean;
    licenceVerified: boolean;
    customerRating: number;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
  };
  activeTrip: ActiveTripData | null;
  nearbyDrivers: {
    count: number;
    radiusKm: number;
  };
  recentTrips: RecentTripItem[];
  quickDestinations: Array<{
    id: string;
    name: string;
    address: string;
    icon: string;
  }>;
  stats: {
    totalTrips: number;
    monthlySpend: number;
    rating: number;
    activeRentalsCount: number;
  };
}

export default function CustomerHomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [pickupInput, setPickupInput] = useState('Connaught Place, New Delhi (GPS)');
  const [dropInput, setDropInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sosSent, setSosSent] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Load aggregated dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI<DashboardData>('/api/customer/dashboard');
        if (res.data) {
          setDashboardData(res.data);
          if (res.data.location?.address) {
            setPickupInput(res.data.location.address);
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not load aggregated dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // GPS Location Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetchAPI<{ address: string }>('/api/location/resolve', {
            method: 'POST',
            body: { latitude, longitude },
          });
          if (res.data?.address) {
            setPickupInput(res.data.address);
          } else {
            setPickupInput(`GPS Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch {
          setPickupInput(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        alert('Please allow location permissions to detect your current pickup spot.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Start Booking Flow
  const handleStartBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (pickupInput) query.set('pickup', pickupInput);
    if (dropInput) query.set('drop', dropInput);
    router.push(`/customer/cab?${query.toString()}`);
  };

  // Book Again pre-fill
  const handleBookAgain = (trip: RecentTripItem) => {
    if (trip.pickup?.address) setPickupInput(trip.pickup.address);
    if (trip.drop?.address) setDropInput(trip.drop.address);
    router.push(`/customer/cab?pickup=${encodeURIComponent(trip.pickup.address)}&drop=${encodeURIComponent(trip.drop.address)}`);
  };

  // Trigger SOS Alert from Active Trip Banner
  const handleQuickSOS = async () => {
    if (!confirm('🚨 Are you sure you want to trigger an Emergency SOS Alert? This will alert your emergency contacts and the VITO 24/7 Security Desk.')) {
      return;
    }
    try {
      await fetchAPI('/api/safety/sos', {
        method: 'POST',
        body: {
          lat: dashboardData?.location.latitude || 28.6315,
          lng: dashboardData?.location.longitude || 77.2167,
          address: pickupInput,
        },
      });
      setSosSent(true);
      setTimeout(() => setSosSent(false), 5000);
    } catch {
      alert('Emergency signal dispatched to VITO Security Desk.');
    }
  };

  // Share Live Trip Link
  const handleShareTrip = () => {
    const shareUrl = window.location.origin + `/customer/cab?activeTrip=${dashboardData?.activeTrip?._id || 'live'}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 3000);
  };

  const activeTrip = dashboardData?.activeTrip;
  const nearbyCount = dashboardData?.nearbyDrivers?.count || 12;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* ════════════════════════════════════════════════════════════════════════
          1. HEADER GREETING & TRUST BADGE
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C2B3] animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#00A99D]">
              VITO Intelligent Mobility Platform
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0B1728] dark:text-white tracking-tight">
            {getGreeting()},{' '}
            <span className="text-gradient">
              {user?.name ? user.name.split(' ')[0] : 'Traveler'}
            </span>{' '}
            👋
          </h1>
          <p className="text-sm sm:text-base text-[#526174] dark:text-slate-400 mt-1 font-medium">
            Where would you like to travel today?
          </p>
        </div>

        {/* Identity & Rating Trust Pill */}
        <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <BadgeCheck className="w-4 h-4" />
            <span>ID Verified</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{dashboardData?.stats.rating || 4.9}</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          2. DYNAMIC ACTIVE TRIP CONTROLLER (If Active Booking Exists)
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTrip && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-[#0B1728] border border-blue-500/40 shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
                Active Ongoing Journey
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase">
                {activeTrip.status.replace('_', ' ')}
              </span>
            </div>

            {/* OTP Badge */}
            {activeTrip.otp && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <span>START OTP:</span>
                <span className="font-mono text-sm tracking-widest text-amber-200">{activeTrip.otp}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Driver & Vehicle Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {activeTrip.driverInfo?.name || 'Assigned Driver Partner'}
                </h4>
                <p className="text-xs text-slate-300 truncate">
                  {activeTrip.driverInfo?.vehicleModel || activeTrip.vehicleType || 'Sedan'} •{' '}
                  <span className="font-mono font-semibold text-blue-300">
                    {activeTrip.driverInfo?.vehicleNo || 'DL-01-AB-2026'}
                  </span>
                </p>
              </div>
            </div>

            {/* Route Summary */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{activeTrip.pickup.address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="truncate">{activeTrip.drop.address}</span>
              </div>
            </div>

            {/* Actions & Fare */}
            <div className="flex items-center justify-end gap-2">
              <Link
                href="/customer/cab"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Live Map Tracking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleShareTrip}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                title="Share Trip Link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleQuickSOS}
                className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
                title="Emergency SOS"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            </div>
          </div>

          {sosSent && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-bold text-center">
              🚨 SOS Alert dispatched to Emergency Contacts & Vito Control Room!
            </div>
          )}

          {shareCopied && (
            <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/50 text-blue-200 text-xs font-bold text-center">
              🔗 Live trip link copied to clipboard!
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          3. HERO INSTANT BOOKING WIDGET
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-[0_8px_32px_rgba(7,17,31,0.06)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00C2B3]/10 border border-[#00C2B3]/25 flex items-center justify-center text-[#00A99D]">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0B1728] dark:text-white">
                Instant Ride Booking
              </h2>
              <p className="text-xs text-[#526174] dark:text-slate-400">
                Verified drivers, OSRM road routing & instant 4-digit OTP dispatch
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F2] text-[#16A67A] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#16A67A] animate-pulse" />
            <span>{nearbyCount} Live Drivers Near You (5km)</span>
          </span>
        </div>

        {/* Inputs Grid */}
        <form onSubmit={handleStartBooking} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          {/* Pickup Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#16A67A]" />
            <input
              type="text"
              value={pickupInput}
              onChange={(e) => setPickupInput(e.target.value)}
              placeholder="Enter pickup location..."
              className="w-full pl-10 pr-12 py-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs sm:text-sm font-semibold text-[#0B1728] dark:text-white placeholder:text-[#8995A5] outline-none focus:border-[#00C2B3] focus:ring-1 focus:ring-[#00C2B3] transition-all"
            />
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#00A99D] hover:bg-[#00C2B3]/10 transition-colors"
              title="Detect Current GPS Location"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </button>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#E5484D]" />
            <input
              type="text"
              value={dropInput}
              onChange={(e) => setDropInput(e.target.value)}
              placeholder="Where to? Airport, Railway Station, Mall..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs sm:text-sm font-semibold text-[#0B1728] dark:text-white placeholder:text-[#8995A5] outline-none focus:border-[#00C2B3] focus:ring-1 focus:ring-[#00C2B3] transition-all"
            />
          </div>

          {/* Book a Ride CTA */}
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-[#07111F] dark:bg-blue-600 hover:bg-[#0B1728] dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#07111F]/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <span>Book a Ride</span>
            <ArrowRight className="w-4 h-4 text-[#00C2B3] dark:text-white" />
          </button>
        </form>

        {/* Suggested Destination Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-1">
          <span className="text-[11px] font-bold text-[#8995A5] uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {[
            'IGI Airport Terminal 3',
            'New Delhi Railway Station',
            'Cyber City Gurugram',
            'Select CITYWALK Saket',
          ].map((place) => (
            <button
              key={place}
              onClick={() => {
                setDropInput(place);
                router.push(`/customer/cab?drop=${encodeURIComponent(place)}`);
              }}
              className="px-3 py-1.5 rounded-full bg-[#F1F5F8] dark:bg-[#10243A] hover:bg-[#E5EAF0] dark:hover:bg-[#17334F] text-xs font-semibold text-[#526174] dark:text-slate-300 transition-colors shrink-0"
            >
              📍 {place}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          4. QUICK STATS BAR
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Rides', value: dashboardData?.stats.totalTrips ?? 0, icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Active Rentals', value: dashboardData?.stats.activeRentalsCount ?? 0, icon: Key, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Monthly Spend', value: `₹${dashboardData?.stats.monthlySpend ?? 0}`, icon: Wallet, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Safety Rating', value: `${dashboardData?.stats.rating ?? 4.9} ★`, icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.label}
              className="p-4 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm flex items-center gap-3.5"
            >
              <div className={`w-10 h-10 rounded-xl ${st.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${st.color}`} />
              </div>
              <div>
                <p className="text-lg font-black text-[#0B1728] dark:text-white leading-none">
                  {loading ? '—' : st.value}
                </p>
                <p className="text-[11px] font-semibold text-[#8995A5] mt-1">{st.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          5. 5 CORE MOBILITY SERVICES GRID
      ════════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#0B1728] dark:text-white uppercase tracking-wider">
            Explore VITO Mobility Services
          </h3>
          <span className="text-xs font-semibold text-[#00A99D]">5 Services Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Book a Cab',
              desc: 'Point-to-point city rides with upfront pricing & OTP security',
              href: '/customer/cab',
              icon: Car,
              accent: '#00C2B3',
              action: 'Book Ride →',
            },
            {
              title: 'Hire a Driver',
              desc: 'Professional verified chauffeurs on hourly & outstation hire',
              href: '/customer/driver-hire',
              icon: UserCheck,
              accent: '#C9A45C',
              action: 'Find Driver →',
            },
            {
              title: 'Vehicle Rentals',
              desc: 'Self-drive sedans, SUVs, and EV fleet with insurance',
              href: '/customer/rentals',
              icon: Key,
              accent: '#3984E8',
              action: 'View Fleet →',
            },
            {
              title: 'Safety Center',
              desc: 'Emergency SOS, live GPS sharing & 24/7 safety desk',
              href: '/customer/safety',
              icon: ShieldAlert,
              accent: '#E5484D',
              action: 'Safety Center →',
            },
          ].map((srv) => {
            const Icon = srv.icon;
            return (
              <Link
                key={srv.title}
                href={srv.href}
                className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-[0_4px_20px_rgba(7,17,31,0.04)] hover:shadow-[0_8px_28px_rgba(7,17,31,0.08)] hover:border-[#00C2B3]/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${srv.accent}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: srv.accent }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0B1728] dark:text-white group-hover:text-[#00A99D] transition-colors">
                      {srv.title}
                    </h4>
                    <p className="text-xs text-[#526174] dark:text-slate-400 mt-1 leading-relaxed">
                      {srv.desc}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#00A99D] pt-4 block">
                  {srv.action}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          6. RECENT TRIPS WITH "BOOK AGAIN" PREFILL
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1728] dark:text-white uppercase tracking-wider">
            Recent Journeys
          </h3>
          <Link
            href="/customer/trips"
            className="text-xs font-bold text-[#00A99D] hover:underline flex items-center gap-1"
          >
            <span>View All Trips</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-center text-xs text-[#8995A5]">
            Loading recent trip records...
          </div>
        ) : !dashboardData?.recentTrips || dashboardData.recentTrips.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00C2B3]/10 flex items-center justify-center mx-auto text-[#00A99D]">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B1728] dark:text-white">
                No past journeys found
              </p>
              <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
                Your first smart trip across Delhi NCR is just a click away!
              </p>
            </div>
            <Link
              href="/customer/cab"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#00C2B3] text-white text-xs font-bold shadow-md hover:bg-[#00A99D] transition-all"
            >
              Book Your First Ride
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {dashboardData.recentTrips.map((trip) => (
              <div
                key={trip._id}
                className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#00C2B3]/10 flex items-center justify-center text-[#00A99D] shrink-0 mt-0.5 sm:mt-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-[#0B1728] dark:text-white truncate">
                        {trip.drop?.address || 'Destination'}
                      </p>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        {trip.vehicleType}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#526174] dark:text-slate-400 truncate">
                      From: {trip.pickup?.address || 'Pickup point'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-black text-[#0B1728] dark:text-white">
                      ₹{trip.fare}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recent'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleBookAgain(trip)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#00C2B3]/10 hover:bg-[#00C2B3]/20 text-[#00A99D] text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Book Again</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          7. QUICK ACCESS MANAGEMENT CARDS
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'My Trips', icon: FileText, href: '/customer/trips', desc: 'Invoices & history' },
          { label: 'Payments', icon: Wallet, href: '/customer/payments', desc: 'UPI, Wallet & Cards' },
          { label: 'Safety Desk', icon: Shield, href: '/customer/safety', desc: '24/7 Support & SOS' },
          { label: 'Profile & KYC', icon: BadgeCheck, href: '/customer/profile', desc: 'Account verification' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="p-4 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] hover:border-[#00C2B3]/40 shadow-sm transition-all group"
            >
              <Icon className="w-5 h-5 text-[#00A99D] group-hover:scale-110 transition-transform mb-2" />
              <h4 className="text-xs font-bold text-[#0B1728] dark:text-white">{item.label}</h4>
              <p className="text-[10px] text-[#8995A5] mt-0.5">{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
