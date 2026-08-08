'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchAPI } from '@/lib/api';
import {
  UserCheck,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Moon,
  Compass,
  ArrowRight,
  RotateCcw,
  Loader2,
  ShieldAlert,
  Share2,
  DollarSign,
  Briefcase,
  Check,
} from 'lucide-react';

// Lazy load HireMap to prevent SSR Leaflet errors
const HireMap = dynamic(() => import('./HireMap'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 'FORM' | 'SELECT_DRIVER' | 'LIVE_TRACKING' | 'TRIP_COMPLETED';

interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  experience: number;
  rating: number;
  hourlyRate: number;
  verificationStatus: string;
  avatar: string;
  specialization: string;
  latOffset: number;
  lngOffset: number;
}

interface FareBreakdown {
  baseFare: number;
  nightCharge: number;
  outstationAllowance: number;
  totalFare: number;
  isNightTrip: boolean;
}

const DEFAULT_DRIVERS: DriverProfile[] = [
  {
    id: 'drv_1',
    name: 'Ramesh Chandra',
    phone: '+91 98765 12345',
    experience: 9,
    rating: 4.9,
    hourlyRate: 180,
    verificationStatus: 'verified',
    avatar: 'RC',
    specialization: 'Luxury Sedans & Outstation',
    latOffset: 0.004,
    lngOffset: 0.005,
  },
  {
    id: 'drv_2',
    name: 'Sunita Malhotra',
    phone: '+91 98123 67890',
    experience: 7,
    rating: 4.8,
    hourlyRate: 160,
    verificationStatus: 'verified',
    avatar: 'SM',
    specialization: 'Automatic Cars & Night Shifts',
    latOffset: -0.003,
    lngOffset: 0.006,
  },
  {
    id: 'drv_3',
    name: 'Gurpreet Singh',
    phone: '+91 97111 54321',
    experience: 12,
    rating: 4.95,
    hourlyRate: 220,
    verificationStatus: 'verified',
    avatar: 'GS',
    specialization: 'SUVs & Outstation Long Hauls',
    latOffset: 0.006,
    lngOffset: -0.004,
  },
  {
    id: 'drv_4',
    name: 'Amit Joshi',
    phone: '+91 99999 44444',
    experience: 5,
    rating: 4.7,
    hourlyRate: 150,
    verificationStatus: 'verified',
    avatar: 'AJ',
    specialization: 'City Commutes & Hatchbacks',
    latOffset: -0.005,
    lngOffset: -0.006,
  },
  {
    id: 'drv_5',
    name: 'Sanjay Kumar',
    phone: '+91 98888 33333',
    experience: 10,
    rating: 4.85,
    hourlyRate: 200,
    verificationStatus: 'verified',
    avatar: 'SK',
    specialization: 'EVs & VIP Escort',
    latOffset: 0.003,
    lngOffset: -0.002,
  },
];

const TIME_SLOTS = [
  '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '23:00', '00:00', '02:00'
];

export default function DriverHirePage() {
  const [step, setStep] = useState<Step>('FORM');

  // Form State
  const [pickupLocation, setPickupLocation] = useState('Connaught Place, New Delhi');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [hours, setHours] = useState(4);
  const [isOutstation, setIsOutstation] = useState(false);

  // Drivers & Selection
  const [drivers, setDrivers] = useState<DriverProfile[]>(DEFAULT_DRIVERS);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('drv_1');

  // Backend Booking State
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Live Tracking Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [driverRating, setDriverRating] = useState(5);

  const pickupCoords: [number, number] = [28.6315, 77.2167];

  // Fetch available drivers on mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetchAPI<{ drivers: DriverProfile[] }>('/api/drivers/hire');
        if (res.data?.drivers && res.data.drivers.length > 0) {
          setDrivers(res.data.drivers);
          setSelectedDriverId(res.data.drivers[0].id);
        }
      } catch {
        // Fallback to default mock drivers
      }
    };
    fetchDrivers();
  }, []);

  // Selected driver object
  const selectedDriver = useMemo(() => {
    return drivers.find((d) => d.id === selectedDriverId) || drivers[0];
  }, [drivers, selectedDriverId]);

  // Client-side / API Fare calculation logic
  const fareBreakdown = useMemo<FareBreakdown>(() => {
    const rate = selectedDriver ? selectedDriver.hourlyRate : 180;
    const baseFare = hours * rate;

    // Check if start/end hour falls in 10 PM - 6 AM (22:00 to 06:00)
    let startHour = 10;
    if (startTime) {
      const p = startTime.split(':');
      startHour = parseInt(p[0], 10) || 10;
    }
    const endHour = (startHour + hours) % 24;
    const isNightTrip = startHour >= 22 || startHour < 6 || endHour >= 22 || endHour < 6 || hours >= 12;

    const nightCharge = isNightTrip ? Math.round(baseFare * 0.20) : 0;
    const outstationAllowance = isOutstation ? 300 : 0;
    const totalFare = baseFare + nightCharge + outstationAllowance;

    return { baseFare, nightCharge, outstationAllowance, totalFare, isNightTrip };
  }, [selectedDriver, hours, startTime, isOutstation]);

  // Handle Hire Submission -> API
  const handleConfirmHire = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{ booking: { _id: string } }>('/api/drivers/hire', {
        method: 'POST',
        body: {
          driverName: selectedDriver.name,
          driverPhone: selectedDriver.phone,
          hourlyRate: selectedDriver.hourlyRate,
          pickupLocation,
          bookingDate,
          startTime,
          hours,
          isOutstation,
        },
      });

      if (res.data?.booking) {
        setBookingId(res.data.booking._id);
      }
      setShowConfirmModal(false);
      setStep('LIVE_TRACKING');
    } catch {
      // Fallback
      setShowConfirmModal(false);
      setStep('LIVE_TRACKING');
    } finally {
      setLoading(false);
    }
  };

  // Live Tracking Timer
  useEffect(() => {
    if (step !== 'LIVE_TRACKING') return;

    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // End trip API
  const handleCompleteTrip = async () => {
    if (bookingId) {
      fetchAPI(`/api/drivers/hire/${bookingId}/status`, {
        method: 'PATCH',
        body: { status: 'completed' },
      }).catch(() => {});
    }
    setStep('TRIP_COMPLETED');
  };

  const driverPos: [number, number] = [
    pickupCoords[0] + (selectedDriver?.latOffset || 0.004),
    pickupCoords[1] + (selectedDriver?.lngOffset || 0.005),
  ];

  return (
    <div className="relative overflow-hidden min-h-screen pb-12">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[400px] bg-hero-glow pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-6">

        {/* ════════════════════════════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-[11px] font-semibold text-accent-400 uppercase tracking-wider w-fit mb-1.5">
              <UserCheck className="w-3 h-3" />
              Verified Professionals
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Driver <span className="text-gradient">on Demand</span>
            </h1>
          </div>

          {step !== 'FORM' && (
            <button
              onClick={() => {
                setStep('FORM');
                setBookingId(null);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Hire
            </button>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            GRID LAYOUT: LEFT (Controls) + RIGHT (Map & Profile)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 items-start">

          {/* ─────────────────────────────────────────────────────────────────
              LEFT COLUMN — STEPS
          ───────────────────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* STEP 1: BOOKING FORM */}
            {step === 'FORM' && (
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-accent-400" />
                  Hire Parameters
                </h2>

                {/* Pickup Location */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400" />
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="Enter pickup address..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-500/40 transition-all"
                    />
                  </div>
                </div>

                {/* Date & Start Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Booking Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-500/40 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Start Time
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-accent-500/40 transition-all [color-scheme:dark]"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t} {parseInt(t) >= 22 || parseInt(t) < 6 ? '🌙' : '☀️'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration Hours Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Duration (Hours)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[2, 4, 6, 8, 12].map((h) => (
                      <button
                        key={h}
                        onClick={() => setHours(h)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          hours === h
                            ? 'bg-accent-500/20 border-accent-500/40 text-accent-400 shadow-sm'
                            : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                        }`}
                      >
                        {h} hrs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outstation Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-accent-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Outstation Trip</h4>
                      <p className="text-[10px] text-slate-400">+₹300 flat driver allowance</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOutstation(!isOutstation)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      isOutstation ? 'bg-accent-500' : 'bg-white/[0.15]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        isOutstation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={() => setStep('SELECT_DRIVER')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-500 to-amber-600 hover:from-accent-400 hover:to-amber-500 text-white text-sm font-bold transition-all shadow-lg shadow-accent-500/25 active:scale-95 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Search Verified Drivers
                </button>
              </div>
            )}

            {/* STEP 2: SELECT DRIVER */}
            {step === 'SELECT_DRIVER' && (
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Available Drivers ({drivers.length})
                  </h2>
                  <button
                    onClick={() => setStep('FORM')}
                    className="text-xs text-accent-400 hover:underline"
                  >
                    Edit Criteria
                  </button>
                </div>

                {/* Driver Profile Cards List */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto scrollbar-hide pr-1">
                  {drivers.map((driver) => {
                    const isSelected = selectedDriverId === driver.id;
                    return (
                      <div
                        key={driver.id}
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-accent-500/15 border-accent-500/40 text-white shadow-md shadow-accent-500/10'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] text-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-500/20 to-amber-500/20 border border-white/[0.08] flex items-center justify-center text-sm font-extrabold text-accent-300">
                              {driver.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white">{driver.name}</h3>
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[9px] font-extrabold text-emerald-400">
                                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{driver.experience} yrs exp · {driver.specialization}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-extrabold text-white">₹{driver.hourlyRate}</span>
                            <span className="text-[10px] text-slate-500 block">/hr</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs">
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{driver.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-slate-400 font-medium">
                            {hours}h = <span className="text-white font-bold">₹{hours * driver.hourlyRate}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Calculated Fare Breakdown Box */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Base Fare ({hours}h × ₹{selectedDriver.hourlyRate})</span>
                    <span className="font-semibold text-white">₹{fareBreakdown.baseFare}</span>
                  </div>

                  {fareBreakdown.nightCharge > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-400 flex items-center gap-1">
                        <Moon className="w-3 h-3" /> Night Charge (20%)
                      </span>
                      <span className="font-semibold text-amber-400">+₹{fareBreakdown.nightCharge}</span>
                    </div>
                  )}

                  {fareBreakdown.outstationAllowance > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Compass className="w-3 h-3" /> Outstation Allowance
                      </span>
                      <span className="font-semibold text-cyan-400">+₹{fareBreakdown.outstationAllowance}</span>
                    </div>
                  )}

                  <div className="border-t border-white/[0.08] pt-2 flex justify-between">
                    <span className="text-sm font-bold text-white">Total Estimated Fare</span>
                    <span className="text-lg font-extrabold text-white">₹{fareBreakdown.totalFare}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-500 to-amber-600 hover:from-accent-400 hover:to-amber-500 text-white text-sm font-bold transition-all shadow-lg shadow-accent-500/25 active:scale-95 flex items-center justify-center gap-2"
                >
                  Hire {selectedDriver.name.split(' ')[0]} — ₹{fareBreakdown.totalFare}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 3: LIVE TRACKING */}
            {step === 'LIVE_TRACKING' && (
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Driver On Duty</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>

                {/* Driver Profile Summary Card */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500/20 to-amber-500/20 border border-white/[0.08] flex items-center justify-center text-base font-extrabold text-accent-300">
                      {selectedDriver.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedDriver.name}</h4>
                      <p className="text-xs text-slate-400">{selectedDriver.phone}</p>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-all">
                    <Phone className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Trip Telemetry */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Booked Duration</span>
                    <span className="text-sm font-bold text-white">{hours} Hours</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Current Fare</span>
                    <span className="text-sm font-bold text-emerald-400">₹{fareBreakdown.totalFare}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-500/25 transition-all">
                    <ShieldAlert className="w-4 h-4" /> Emergency SOS
                  </button>
                  <button
                    onClick={handleCompleteTrip}
                    className="flex-1 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500/30 transition-all"
                  >
                    <Check className="w-4 h-4" /> End Duty
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: TRIP COMPLETED */}
            {step === 'TRIP_COMPLETED' && (
              <div className="glass-panel rounded-2xl p-5 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Duty Complete!</h2>
                <p className="text-xs text-slate-400">Driver {selectedDriver.name} has completed the {hours}-hour hire service.</p>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-left">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Base Fare ({hours}h)</span>
                    <span className="font-semibold text-white">₹{fareBreakdown.baseFare}</span>
                  </div>
                  {fareBreakdown.nightCharge > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-400">Night Charge (20%)</span>
                      <span className="font-semibold text-amber-400">+₹{fareBreakdown.nightCharge}</span>
                    </div>
                  )}
                  {fareBreakdown.outstationAllowance > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-cyan-400">Outstation Allowance</span>
                      <span className="font-semibold text-cyan-400">+₹{fareBreakdown.outstationAllowance}</span>
                    </div>
                  )}
                  <div className="border-t border-white/[0.08] pt-2 flex justify-between text-sm">
                    <span className="font-bold text-white">Total Amount Charged</span>
                    <span className="font-extrabold text-emerald-400">₹{fareBreakdown.totalFare}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="py-2">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Rate {selectedDriver.name}:</span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setDriverRating(s)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-7 h-7 ${s <= driverRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('FORM');
                    setElapsedSeconds(0);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-amber-600 text-white text-sm font-bold transition-all shadow-lg shadow-accent-500/20 active:scale-95"
                >
                  Hire Another Driver
                </button>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT MAP DISPLAY
          ───────────────────────────────────────────────────────────────── */}
          <div className="h-[460px] lg:h-[580px] rounded-2xl overflow-hidden border border-white/[0.08] relative shadow-xl">
            <HireMap
              center={pickupCoords}
              pickupAddress={pickupLocation}
              driverName={selectedDriver.name}
              driverPos={step === 'LIVE_TRACKING' ? driverPos : undefined}
              isTracking={step === 'LIVE_TRACKING'}
            />
          </div>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CONFIRMATION MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel-glow rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-extrabold text-white">Confirm Driver Booking</h3>
            <p className="text-xs text-slate-400">Please review your booking details before confirming.</p>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver</span>
                <span className="font-bold text-white">{selectedDriver.name} (⭐ {selectedDriver.rating})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pickup</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{pickupLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time</span>
                <span className="font-semibold text-white">{bookingDate} at {startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration</span>
                <span className="font-semibold text-white">{hours} Hours</span>
              </div>
              <div className="border-t border-white/[0.08] pt-2 flex justify-between text-sm">
                <span className="font-bold text-white">Total Fare</span>
                <span className="font-extrabold text-amber-400">₹{fareBreakdown.totalFare}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHire}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-amber-600 hover:from-accent-400 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-accent-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Hire'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
