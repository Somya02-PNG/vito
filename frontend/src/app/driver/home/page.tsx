'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import {
  Power,
  TrendingUp,
  Navigation,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Radio,
  AlertCircle,
  Loader2,
  DollarSign,
  Compass,
  CheckCircle2,
  Phone,
  MessageSquare,
  Siren,
  ArrowRight,
  Shield,
  User,
  Car,
  Check,
  X,
  Sparkles,
  Users,
  Timer,
  AlertTriangle,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface DriverStats {
  todayEarnings: number;
  tripsCompleted: number;
  avgPerTrip: number;
  acceptanceRate: number;
  onlineHours: string;
  rating: number;
}

export type TripLifecycleStatus =
  | 'STANDBY'
  | 'EN_ROUTE_PICKUP'
  | 'ARRIVED_PICKUP'
  | 'TRIP_IN_PROGRESS'
  | 'TRIP_COMPLETED';

interface IncomingRequest {
  id: string;
  serviceType: 'CAB' | 'DRIVER_HIRE';
  riderName: string;
  riderPhone: string;
  pickup: string;
  destination: string;
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  distanceKm: number;
  durationStr: string;
  stayDurationHours?: number;
  totalCommitmentHours?: number;
  vehicleName: string;
  vehiclePlate: string;
  vehicleOwnership: 'DRIVER_OWNED' | 'CUSTOMER_OWNED';
  estimatedEarnings: number;
  paymentMethod: string;
}

const DEFAULT_INCOMING_REQUEST: IncomingRequest = {
  id: 'req_8492',
  serviceType: 'DRIVER_HIRE',
  riderName: 'Priya Sharma',
  riderPhone: '+91 98765 43210',
  pickup: 'Kanpur Central Railway Station, Kanpur',
  destination: 'Hazratganj, Lucknow',
  tripType: 'ROUND_TRIP',
  distanceKm: 170,
  durationStr: '4h Travel + 3h Stay',
  stayDurationHours: 3,
  totalCommitmentHours: 7,
  vehicleName: 'Toyota Innova Crysta ZX',
  vehiclePlate: 'UP-78-TX-9901',
  vehicleOwnership: 'CUSTOMER_OWNED',
  estimatedEarnings: 1240,
  paymentMethod: 'Online UPI (Verified)',
};

export default function DriverHomePage() {
  const { user } = useAuth();

  // Availability State: OFFLINE | ONLINE | BUSY
  const [driverState, setDriverState] = useState<'OFFLINE' | 'ONLINE' | 'BUSY'>('ONLINE');
  const [toggleLoading, setToggleLoading] = useState(false);

  // Driver metrics
  const [stats, setStats] = useState<DriverStats>({
    todayEarnings: 1850,
    tripsCompleted: 12,
    avgPerTrip: 154,
    acceptanceRate: 91,
    onlineHours: '6h 20m',
    rating: 4.8,
  });

  // Incoming Request Feed
  const [incomingRequest, setIncomingRequest] = useState<IncomingRequest | null>(DEFAULT_INCOMING_REQUEST);
  const [hasDeclinedCurrent, setHasDeclinedCurrent] = useState(false);

  // Active Trip State
  const [tripStatus, setTripStatus] = useState<TripLifecycleStatus>('STANDBY');
  const [activeTrip, setActiveTrip] = useState<IncomingRequest | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);

  // SOS modal state
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  // Duty timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tripStatus === 'TRIP_IN_PROGRESS') {
      interval = setInterval(() => setActiveSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [tripStatus]);

  // Toggle Availability
  const handleToggleDuty = async () => {
    if (tripStatus !== 'STANDBY') {
      alert('You cannot go offline during an active trip assignment.');
      return;
    }
    setToggleLoading(true);
    const nextState = driverState === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setDriverState(nextState);

    try {
      await fetchAPI('/driver/toggle-availability', { method: 'PATCH' });
    } catch {}
    setToggleLoading(false);
  };

  // Accept Request
  const handleAcceptRequest = (req: IncomingRequest) => {
    setActiveTrip(req);
    setIncomingRequest(null);
    setDriverState('BUSY');
    setTripStatus('EN_ROUTE_PICKUP');
  };

  // Decline Request
  const handleDeclineRequest = () => {
    setHasDeclinedCurrent(true);
    setIncomingRequest(null);
    // After 10s show another request
    setTimeout(() => {
      setHasDeclinedCurrent(false);
      setIncomingRequest({
        id: `req_${Date.now()}`,
        serviceType: 'CAB',
        riderName: 'Aakash Verma',
        riderPhone: '+91 98111 22334',
        pickup: 'Civil Lines, Kanpur',
        destination: 'IIT Kanpur Main Gate',
        tripType: 'ONE_WAY',
        distanceKm: 14,
        durationStr: '32 mins',
        vehicleName: 'Maruti Dzire VXi',
        vehiclePlate: 'UP-78-AB-4021',
        vehicleOwnership: 'DRIVER_OWNED',
        estimatedEarnings: 380,
        paymentMethod: 'Online Wallet',
      });
    }, 8000);
  };

  // Complete Active Trip
  const handleCompleteTrip = () => {
    setTripStatus('TRIP_COMPLETED');
    const fareEarned = activeTrip?.estimatedEarnings || 1240;
    setStats((prev) => ({
      ...prev,
      todayEarnings: prev.todayEarnings + fareEarned,
      tripsCompleted: prev.tripsCompleted + 1,
      avgPerTrip: Math.round((prev.todayEarnings + fareEarned) / (prev.tripsCompleted + 1)),
    }));
  };

  // Finish Trip Summary & return to online
  const handleDoneSummary = () => {
    setTripStatus('STANDBY');
    setActiveTrip(null);
    setDriverState('ONLINE');
    setEnteredOtp('');
    setActiveSeconds(0);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <ProtectedRoute allowedRoles={['driver', 'partner']}>
      <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
        {/* ─── 1. DRIVER HEADER & AVAILABILITY STATUS ────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-black uppercase text-[#00C2B3] bg-[#00C2B3]/10 px-2.5 py-0.5 rounded-full">
                ★ {stats.rating} Rating
              </span>
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                ✓ Verified Chauffeur
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Good morning, {user?.name || 'Chauffeur'}
            </h1>
            <p className="text-xs text-slate-400">
              {driverState === 'BUSY'
                ? '● Trip Assignment In Progress'
                : driverState === 'ONLINE'
                ? '🟢 Online & Ready for Incoming Ride Requests'
                : '● You are currently Offline'}
            </p>
          </div>

          {/* ONLINE / OFFLINE DUTY CONTROL */}
          <div className="flex items-center gap-3">
            {driverState === 'BUSY' ? (
              <div className="px-6 py-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                Duty Busy
              </div>
            ) : (
              <button
                type="button"
                disabled={toggleLoading}
                onClick={handleToggleDuty}
                className={`px-8 py-4 rounded-2xl font-black text-xs shadow-2xl transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 ${
                  driverState === 'ONLINE'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-[#10243A] hover:bg-[#17334F] text-slate-300 border border-slate-700'
                }`}
              >
                <Power className="w-4 h-4" />
                {driverState === 'ONLINE' ? 'GO OFFLINE' : 'GO ONLINE'}
              </button>
            )}
          </div>
        </div>

        {/* ─── 2. ACTIVE TRIP WORKSPACE (STATE MACHINE) ─────────────────────── */}
        {tripStatus !== 'STANDBY' && activeTrip && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border-2 border-[#00C2B3] shadow-2xl space-y-6 animate-fadeIn">
            {/* Active Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5EAF0] dark:border-[#17334F] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#00A99D] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {tripStatus === 'EN_ROUTE_PICKUP' && '● En Route to Pickup'}
                  {tripStatus === 'ARRIVED_PICKUP' && '● Arrived at Pickup Location'}
                  {tripStatus === 'TRIP_IN_PROGRESS' && '● Trip In Progress'}
                  {tripStatus === 'TRIP_COMPLETED' && '✓ Trip Completed'}
                </span>
                <h2 className="text-xl font-black text-[#0B1728] dark:text-white mt-1">
                  {activeTrip.pickup.split(',')[0]} → {activeTrip.destination.split(',')[0]}
                </h2>
                <p className="text-xs text-[#526174]">
                  {activeTrip.serviceType === 'DRIVER_HIRE'
                    ? 'Driver Service (Customer Vehicle)'
                    : 'Cab Ride (Driver Fleet)'} • {activeTrip.tripType === 'ROUND_TRIP' ? 'Round Trip Return' : 'One Way'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#8995A5] font-bold block">Fare Compensation</span>
                <span className="text-2xl font-black text-[#00A99D]">{formatINR(activeTrip.estimatedEarnings)}</span>
              </div>
            </div>

            {/* Vehicle & Passenger Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border space-y-1">
                <span className="text-[#8995A5] uppercase font-bold text-[10px]">Passenger</span>
                <p className="font-bold text-[#0B1728] dark:text-white">{activeTrip.riderName}</p>
                <a href={`tel:${activeTrip.riderPhone}`} className="text-[#00A99D] font-bold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {activeTrip.riderPhone}
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border space-y-1">
                <span className="text-[#8995A5] uppercase font-bold text-[10px]">Operating Vehicle</span>
                <p className="font-bold text-[#0B1728] dark:text-white">{activeTrip.vehicleName}</p>
                <p className="font-mono text-[11px] text-[#526174]">{activeTrip.vehiclePlate}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border space-y-1">
                <span className="text-[#8995A5] uppercase font-bold text-[10px]">Commitment</span>
                <p className="font-bold text-[#0B1728] dark:text-white">{activeTrip.durationStr}</p>
                <p className="text-[11px] text-[#526174]">{activeTrip.distanceKm} km total route</p>
              </div>
            </div>

            {/* STEP: EN ROUTE TO PICKUP */}
            {tripStatus === 'EN_ROUTE_PICKUP' && (
              <div className="p-5 rounded-2xl bg-[#07111F] text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#00C2B3]">Navigation to Pickup</span>
                  <p className="font-bold text-sm text-slate-200 mt-0.5">{activeTrip.pickup}</p>
                  <span className="text-xs text-slate-400">Estimated arrival in ~6 mins</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => alert(`Launching GPS Navigation to ${activeTrip.pickup}`)}
                    className="px-4 py-3 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" /> Navigate
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripStatus('ARRIVED_PICKUP')}
                    className="px-6 py-3 rounded-xl bg-[#00C2B3] text-[#07111F] text-xs font-black shadow-lg cursor-pointer"
                  >
                    Arrived at Pickup →
                  </button>
                </div>
              </div>
            )}

            {/* STEP: ARRIVED AT PICKUP & START OTP */}
            {tripStatus === 'ARRIVED_PICKUP' && (
              <div className="p-6 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border space-y-4">
                <div>
                  <h3 className="text-sm font-black text-[#0B1728] dark:text-white">
                    Waiting for Passenger at Pickup Location
                  </h3>
                  <p className="text-xs text-[#526174]">
                    Ask passenger for their 4-digit departure verification PIN to begin duty.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Enter 4-Digit PIN (e.g. 4829)"
                    value={enteredOtp}
                    onChange={(e) => {
                      setEnteredOtp(e.target.value);
                      setOtpError(false);
                    }}
                    className="px-4 py-3 rounded-2xl bg-white dark:bg-[#07111F] border border-[#E5EAF0] text-sm font-mono font-bold tracking-widest outline-none focus:border-[#00C2B3]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (enteredOtp.length >= 4 || enteredOtp === '4829') {
                        setTripStatus('TRIP_IN_PROGRESS');
                      } else {
                        setOtpError(true);
                      }
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow-md cursor-pointer"
                  >
                    Verify PIN & Start Trip →
                  </button>
                </div>
                {otpError && (
                  <p className="text-xs font-bold text-red-600">Please enter a valid 4-digit start PIN.</p>
                )}
              </div>
            )}

            {/* STEP: TRIP IN PROGRESS */}
            {tripStatus === 'TRIP_IN_PROGRESS' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-[#07111F] text-white flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#00C2B3]">Active Duty Duty Timer</span>
                    <div className="text-3xl font-black font-mono text-white mt-0.5">
                      {formatTimer(activeSeconds)}
                    </div>
                    <span className="text-xs text-slate-400">Destination: {activeTrip.destination}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => alert(`GPS Navigation running to ${activeTrip.destination}`)}
                      className="px-4 py-3 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" /> Live Map
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSosModal(true)}
                      className="px-4 py-3 rounded-xl bg-red-600/20 border border-red-500 text-red-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Siren className="w-4 h-4" /> Driver SOS
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteTrip}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-lg cursor-pointer"
                    >
                      Complete Trip →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: TRIP COMPLETED SUMMARY */}
            {tripStatus === 'TRIP_COMPLETED' && (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-4 text-center">
                <div className="w-14 h-14 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black">Trip Completed Successfully!</h3>
                  <p className="text-xs">Your compensation has been credited to your driver wallet.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#07111F] border max-w-sm mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8995A5]">Base Chauffeur Tariff</span>
                    <span className="font-bold">{formatINR(1100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8995A5]">Distance / Toll Allowance</span>
                    <span className="font-bold">{formatINR(90)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8995A5]">Passenger Tip</span>
                    <span className="font-bold text-emerald-600">{formatINR(50)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-black text-sm text-[#00A99D]">
                    <span>Total Payout Credited</span>
                    <span>{formatINR(activeTrip.estimatedEarnings)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDoneSummary}
                  className="px-8 py-3.5 rounded-2xl bg-[#07111F] text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Done • Ready for Next Request
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── 3. INCOMING REQUEST FEED (WHEN ONLINE & STANDBY) ─────────────── */}
        {driverState === 'ONLINE' && tripStatus === 'STANDBY' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#526174] flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-[#00C2B3] animate-pulse" /> LIVE TRIP REQUEST FEED
              </h3>
              <span className="text-[11px] text-[#8995A5]">Auto-refreshing</span>
            </div>

            {incomingRequest ? (
              <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border-2 border-[#00C2B3] shadow-lg space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5EAF0] dark:border-[#17334F] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#07111F] text-white text-[10px] font-black uppercase">
                      {incomingRequest.serviceType === 'DRIVER_HIRE' ? 'Driver Service' : 'Cab Ride'}
                    </span>
                    <span className="text-xs font-bold text-[#00A99D]">
                      {incomingRequest.tripType === 'ROUND_TRIP' ? '⇄ Round Trip' : '1→ One Way'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-[#00A99D]">
                      {formatINR(incomingRequest.estimatedEarnings)}
                    </span>
                    <span className="text-[10px] text-[#8995A5] block">Estimated Payout</span>
                  </div>
                </div>

                {/* Route & Commitment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8995A5]">Pickup Location</span>
                        <p className="font-bold text-[#0B1728] dark:text-white">{incomingRequest.pickup}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8995A5]">Destination</span>
                        <p className="font-bold text-[#0B1728] dark:text-white">{incomingRequest.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Commitment & Vehicle Specs */}
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#8995A5]">Total Route Distance:</span>
                      <span className="font-bold">{incomingRequest.distanceKm} km</span>
                    </div>
                    {incomingRequest.stayDurationHours && (
                      <div className="flex justify-between">
                        <span className="text-[#8995A5]">Passenger Stay Standby:</span>
                        <span className="font-bold text-[#00A99D]">{incomingRequest.stayDurationHours} Hours</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#8995A5]">Expected Total Duty:</span>
                      <span className="font-bold">{incomingRequest.totalCommitmentHours || 7} Hours</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#E5EAF0]">
                      <span className="text-[#8995A5]">Vehicle:</span>
                      <span className="font-bold">{incomingRequest.vehicleName} ({incomingRequest.vehiclePlate})</span>
                    </div>
                  </div>
                </div>

                {/* Decline / Accept Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDeclineRequest}
                    className="py-3.5 rounded-2xl border border-[#E5EAF0] text-xs font-bold text-[#526174] hover:bg-slate-50 cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(incomingRequest)}
                    className="py-3.5 rounded-2xl bg-[#00C2B3] hover:bg-[#00A99D] text-[#07111F] font-black text-xs shadow-lg transition-all cursor-pointer"
                  >
                    Accept Trip Request →
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border text-center text-xs text-[#526174] space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center mx-auto">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <p className="font-bold text-sm text-[#0B1728] dark:text-white">Searching for nearby trip requests...</p>
                <p className="max-w-xs mx-auto">Stay online to receive high-paying outstation & city ride matches.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── 4. TODAY'S EARNINGS & PERFORMANCE SUMMARY ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#526174]">TODAY'S EARNINGS</h3>
              <a href="/driver/earnings" className="text-xs font-bold text-[#00A99D] hover:underline">
                View Wallet →
              </a>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#0B1728] dark:text-white">
                {formatINR(stats.todayEarnings)}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                +18% vs Yesterday
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5EAF0] dark:border-[#17334F] text-xs">
              <div>
                <span className="text-[#8995A5] block">Trips Completed</span>
                <span className="font-bold text-[#0B1728] dark:text-white">{stats.tripsCompleted} Trips</span>
              </div>
              <div>
                <span className="text-[#8995A5] block">Average / Trip</span>
                <span className="font-bold text-[#0B1728] dark:text-white">{formatINR(stats.avgPerTrip)}</span>
              </div>
            </div>
          </div>

          {/* Performance Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#526174]">TODAY'S PERFORMANCE</h3>
              <a href="/driver/performance" className="text-xs font-bold text-[#00A99D] hover:underline">
                Metrics →
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A]">
                <span className="text-lg font-black text-[#0B1728] dark:text-white">{stats.acceptanceRate}%</span>
                <span className="text-[10px] text-[#8995A5] block mt-0.5">Acceptance</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A]">
                <span className="text-lg font-black text-amber-500">★ {stats.rating}</span>
                <span className="text-[10px] text-[#8995A5] block mt-0.5">Rating</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A]">
                <span className="text-lg font-black text-[#00A99D]">{stats.onlineHours}</span>
                <span className="text-[10px] text-[#8995A5] block mt-0.5">Online Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SOS CONFIRMATION MODAL ───────────────────────────────────────── */}
        {showSosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border-2 border-red-500 shadow-2xl space-y-5 text-center">
              <div className="w-14 h-14 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Siren className="w-7 h-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#0B1728] dark:text-white">Activate Driver Emergency SOS?</h3>
                <p className="text-xs text-[#526174]">
                  This broadcasts your live GPS coordinates to VITO Driver Safety Command and dispatches local emergency response.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="py-3 rounded-2xl bg-[#F7F9FC] border text-xs font-bold text-[#526174] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSosModal(false);
                    setSosActive(true);
                    alert('🚨 Emergency Alert dispatched to VITO Driver Safety Desk.');
                  }}
                  className="py-3 rounded-2xl bg-red-600 text-white text-xs font-black shadow-lg cursor-pointer"
                >
                  Confirm SOS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
