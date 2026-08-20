'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchAPI } from '@/lib/api';
import {
  MapPin,
  Navigation,
  Car,
  Star,
  Clock,
  Shield,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
  Radio,
  Check,
  Loader2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

// Lazy-load CabMap to prevent SSR window/leaflet issues
const CabMap = dynamic(() => import('./CabMap'), { ssr: false });
import MockPaymentModal from '@/components/MockPaymentModal';

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 'LOCATION_PICKER' | 'SELECT_CAB' | 'OTP_VERIFICATION' | 'LIVE_TRIP' | 'TRIP_COMPLETED';

interface LocationItem {
  address: string;
  lat: number;
  lng: number;
}

interface SimulatedDriver {
  id: string;
  name: string;
  vehicleModel: string;
  vehicleNo: string;
  category: 'Hatchback' | 'Sedan' | 'EV' | 'SUV' | 'Auto';
  rating: number;
  eta: string;
  fare: number;
  lat: number;
  lng: number;
  phone: string;
  avatar: string;
}

// Default initial coordinates (e.g. Connaught Place, New Delhi)
const DEFAULT_PICKUP: LocationItem = {
  address: 'Connaught Place, New Delhi',
  lat: 28.6315,
  lng: 77.2167,
};

const DEFAULT_DROP: LocationItem = {
  address: 'Indira Gandhi International Airport, Delhi',
  lat: 28.5562,
  lng: 77.1000,
};

const POPULAR_LOCATIONS: LocationItem[] = [
  { address: 'IGI Airport Terminal 3, Delhi', lat: 28.5562, lng: 77.1000 },
  { address: 'New Delhi Railway Station', lat: 28.6430, lng: 77.2194 },
  { address: 'Cyber City, Gurugram', lat: 28.4950, lng: 77.0895 },
  { address: 'Select CITYWALK, Saket', lat: 28.5284, lng: 77.2185 },
];

export default function CabBookingPage() {
  const [step, setStep] = useState<Step>('LOCATION_PICKER');
  
  // Locations
  const [pickup, setPickup] = useState<LocationItem>(DEFAULT_PICKUP);
  const [drop, setDrop] = useState<LocationItem>(DEFAULT_DROP);
  const [pickupInput, setPickupInput] = useState(DEFAULT_PICKUP.address);
  const [dropInput, setDropInput] = useState(DEFAULT_DROP.address);

  // Driver options & selection
  const [drivers, setDrivers] = useState<SimulatedDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Backend Ride State
  const [rideId, setRideId] = useState<string | null>(null);
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [inputOTP, setInputOTP] = useState<string[]>(['', '', '', '']);
  const [otpError, setOtpError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Live Trip Animation State
  const [carProgress, setCarProgress] = useState<number>(0); // 0 to 1
  const [speed, setSpeed] = useState<number>(42);
  const [tripRating, setTripRating] = useState<number>(5);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Generate 5 simulated drivers around pickup location
  const generateSimulatedDrivers = (baseLat: number, baseLng: number): SimulatedDriver[] => {
    return [
      {
        id: 'd1',
        name: 'Rajesh Kumar',
        vehicleModel: 'Maruti Swift Dzire',
        vehicleNo: 'DL 01 AB 4829',
        category: 'Sedan',
        rating: 4.9,
        eta: '2 mins',
        fare: 280,
        lat: baseLat + 0.005,
        lng: baseLng + 0.004,
        phone: '+91 98765 43210',
        avatar: 'RK',
      },
      {
        id: 'd2',
        name: 'Suresh Sharma',
        vehicleModel: 'Tata Tigor EV',
        vehicleNo: 'DL 03 EV 9102',
        category: 'EV',
        rating: 4.8,
        eta: '3 mins',
        fare: 250,
        lat: baseLat - 0.004,
        lng: baseLng + 0.006,
        phone: '+91 98123 45678',
        avatar: 'SS',
      },
      {
        id: 'd3',
        name: 'Vikram Singh',
        vehicleModel: 'Hyundai WagonR',
        vehicleNo: 'DL 02 CD 1289',
        category: 'Hatchback',
        rating: 4.7,
        eta: '4 mins',
        fare: 210,
        lat: baseLat + 0.007,
        lng: baseLng - 0.005,
        phone: '+91 97111 22334',
        avatar: 'VS',
      },
      {
        id: 'd4',
        name: 'Anita Verma',
        vehicleModel: 'Toyota Innova Crysta',
        vehicleNo: 'DL 04 XY 7741',
        category: 'SUV',
        rating: 4.9,
        eta: '5 mins',
        fare: 450,
        lat: baseLat - 0.006,
        lng: baseLng - 0.007,
        phone: '+91 99999 88888',
        avatar: 'AV',
      },
      {
        id: 'd5',
        name: 'Amit Patel',
        vehicleModel: 'Bajaj RE Auto',
        vehicleNo: 'DL 01 TR 3311',
        category: 'Auto',
        rating: 4.6,
        eta: '6 mins',
        fare: 140,
        lat: baseLat + 0.003,
        lng: baseLng - 0.003,
        phone: '+91 98888 77777',
        avatar: 'AP',
      },
    ];
  };

  // Trigger driver search
  const handleFindCabs = () => {
    setPickup({ ...pickup, address: pickupInput });
    setDrop({ ...drop, address: dropInput });

    const seeded = generateSimulatedDrivers(pickup.lat, pickup.lng);
    setDrivers(seeded);
    setSelectedDriverId(seeded[0].id);
    setStep('SELECT_CAB');
  };

  // Selected driver object
  const selectedDriver = useMemo(() => {
    return drivers.find((d) => d.id === selectedDriverId) || drivers[0];
  }, [drivers, selectedDriverId]);

  // Handle Ride Booking -> Generate OTP via Backend API
  const handleConfirmCab = async () => {
    if (!selectedDriver) return;
    setLoading(true);

    try {
      const res = await fetchAPI<{ ride: { _id: string; otp: string }; driverInfo: SimulatedDriver }>('/api/rides', {
        method: 'POST',
        body: {
          pickup,
          drop,
          fare: selectedDriver.fare,
          driverInfo: selectedDriver,
        },
      });

      if (res.data?.ride) {
        setRideId(res.data.ride._id);
        setGeneratedOTP(res.data.ride.otp);
        setStep('OTP_VERIFICATION');
      }
    } catch (err: any) {
      // Fallback in case of server error
      const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOTP(mockOtp);
      setStep('OTP_VERIFICATION');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...inputOTP];
    newOtp[index] = value;
    setInputOTP(newOtp);
    setOtpError('');

    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Verify 4-digit OTP
  const handleVerifyOTP = async () => {
    const entered = inputOTP.join('');
    if (entered.length < 4) {
      setOtpError('Please enter all 4 digits of the OTP.');
      return;
    }

    if (entered !== generatedOTP) {
      setOtpError('Incorrect OTP. Please check the OTP displayed above.');
      return;
    }

    setLoading(true);
    try {
      if (rideId) {
        await fetchAPI(`/api/rides/${rideId}/verify-otp`, {
          method: 'POST',
          body: { otp: entered },
        });
      }
      setStep('LIVE_TRIP');
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Route interpolation points for polyline and car animation
  const routePoints: [number, number][] = useMemo(() => {
    if (!pickup || !drop) return [];
    // Generate 20 smooth waypoints between pickup and drop
    const points: [number, number][] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = pickup.lat + (drop.lat - pickup.lat) * t + Math.sin(t * Math.PI) * 0.008;
      const lng = pickup.lng + (drop.lng - pickup.lng) * t;
      points.push([lat, lng]);
    }
    return points;
  }, [pickup, drop]);

  // Compute active car position along route based on carProgress (0 to 1)
  const currentCarPos: [number, number] | null = useMemo(() => {
    if (routePoints.length === 0) return null;
    const index = Math.min(
      Math.floor(carProgress * (routePoints.length - 1)),
      routePoints.length - 1
    );
    return routePoints[index];
  }, [routePoints, carProgress]);

  // Animate car movement during LIVE_TRIP
  useEffect(() => {
    if (step !== 'LIVE_TRIP') return;

    setCarProgress(0);
    const duration = 14000; // 14 seconds for full trip animation
    const interval = 100;
    const totalSteps = duration / interval;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const progress = Math.min(stepCount / totalSteps, 1);
      setCarProgress(progress);

      // Fluctuate speed realistically between 38 and 54 km/h
      setSpeed(Math.floor(40 + Math.sin(progress * Math.PI * 4) * 12));

      if (progress >= 1) {
        clearInterval(timer);
        // Complete ride on backend
        if (rideId) {
          fetchAPI(`/api/rides/${rideId}/status`, {
            method: 'PATCH',
            body: { status: 'completed' },
          }).catch(() => {});
        }
        setTimeout(() => {
          setStep('TRIP_COMPLETED');
          setShowPaymentModal(true);
        }, 1000);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [step, rideId]);

  // Calculate distance remaining
  const distanceRemaining = useMemo(() => {
    const totalDist = 8.4; // km
    return Math.max(0, parseFloat((totalDist * (1 - carProgress)).toFixed(1)));
  }, [carProgress]);

  // Calculate time remaining
  const timeRemainingMins = useMemo(() => {
    const totalMins = 16;
    return Math.max(0, Math.ceil(totalMins * (1 - carProgress)));
  }, [carProgress]);

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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[11px] font-semibold text-primary-300 uppercase tracking-wider w-fit mb-1.5">
              <Car className="w-3 h-3" />
              Instant Booking
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Book a <span className="text-gradient">Cab</span>
            </h1>
          </div>

          {step !== 'LOCATION_PICKER' && (
            <button
              onClick={() => {
                setStep('LOCATION_PICKER');
                setRideId(null);
                setGeneratedOTP('');
                setInputOTP(['', '', '', '']);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Flow
            </button>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            GRID LAYOUT: LEFT (Controls) + RIGHT (Leaflet Map)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start">

          {/* ─────────────────────────────────────────────────────────────────
              LEFT CONTROL PANEL (Steps)
          ───────────────────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* STEP 1: LOCATION PICKER */}
            {step === 'LOCATION_PICKER' && (
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary-400" />
                  Select Pickup & Drop
                </h2>

                {/* Pickup Input */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    Pickup Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type="text"
                      value={pickupInput}
                      onChange={(e) => setPickupInput(e.target.value)}
                      placeholder="Enter pickup location..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40 transition-all"
                    />
                  </div>
                </div>

                {/* Drop Input */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                    Drop Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                    <input
                      type="text"
                      value={dropInput}
                      onChange={(e) => setDropInput(e.target.value)}
                      placeholder="Enter drop destination..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40 transition-all"
                    />
                  </div>
                </div>

                {/* Popular Destinations Quick Chips */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Popular Destinations
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_LOCATIONS.map((loc) => (
                      <button
                        key={loc.address}
                        onClick={() => {
                          setDrop(loc);
                          setDropInput(loc.address);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all text-left"
                      >
                        📍 {loc.address.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleFindCabs}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Car className="w-4 h-4" />
                  Find Nearby Cabs
                </button>
              </div>
            )}

            {/* STEP 2: SELECT CAB */}
            {step === 'SELECT_CAB' && (
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-400" />
                    Available Cabs ({drivers.length})
                  </h2>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-ping" /> Live Drivers
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-hide pr-1" role="radiogroup" aria-label="Available Cabs">
                  {drivers.map((driver) => {
                    const isSelected = Boolean(selectedDriverId && selectedDriverId === driver.id);
                    return (
                      <div
                        key={driver.id}
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-primary-500/15 border-primary-500/40 text-white shadow-md shadow-primary-500/10'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="cab-selection"
                            value={driver.id}
                            checked={isSelected}
                            onChange={() => setSelectedDriverId(driver.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-500'
                                : 'border-slate-500 bg-transparent group-hover:border-slate-400'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-white/[0.08] flex items-center justify-center text-sm font-extrabold text-primary-300">
                            {driver.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{driver.category}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                                {driver.eta}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{driver.name} · {driver.vehicleModel}</p>
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{driver.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold text-white">₹{driver.fare}</span>
                          <p className="text-[10px] text-slate-500">Fixed Fare</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleConfirmCab}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-bold transition-all shadow-lg shadow-primary-500/25 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Confirm {selectedDriver.category} — ₹{selectedDriver.fare}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 3: OTP VERIFICATION */}
            {step === 'OTP_VERIFICATION' && (
              <div className="glass-panel-glow rounded-2xl p-5 space-y-5">
                {/* Generated OTP Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Ride Start OTP
                  </span>
                  <div className="text-3xl font-black text-amber-400 tracking-[0.3em] font-mono">
                    {generatedOTP}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Share this 4-digit code with your driver to start the trip</p>
                </div>

                {/* Driver Info Card */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center font-bold text-primary-300">
                      {selectedDriver.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedDriver.name}</h4>
                      <p className="text-xs text-slate-400">{selectedDriver.vehicleModel} · <span className="text-amber-400 font-mono">{selectedDriver.vehicleNo}</span></p>
                    </div>
                  </div>
                  <button className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-all">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>

                {/* OTP Verification Form */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-300 block text-center">
                    Enter Driver's OTP Verification:
                  </label>
                  <div className="flex justify-center gap-3">
                    {inputOTP.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-input-${i}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="w-12 h-14 text-center text-xl font-bold text-white rounded-xl bg-white/[0.05] border border-white/[0.1] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-all font-mono"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-xs text-rose-400 text-center flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {otpError}
                    </p>
                  )}

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Verify & Start Trip
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: LIVE TRIP SCREEN */}
            {step === 'LIVE_TRIP' && (
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Trip In Progress</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    {speed} km/h
                  </span>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Distance Left
                    </span>
                    <span className="text-xl font-extrabold text-white">{distanceRemaining} km</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Est. Time
                    </span>
                    <span className="text-xl font-extrabold text-white">{timeRemainingMins} mins</span>
                  </div>
                </div>

                {/* Driver Card */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center font-bold text-primary-300">
                      {selectedDriver.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedDriver.name}</h4>
                      <p className="text-xs text-slate-400">{selectedDriver.vehicleModel} · {selectedDriver.vehicleNo}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/25 transition-all">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    SOS
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: TRIP COMPLETED */}
            {step === 'TRIP_COMPLETED' && (
              <div className="glass-panel rounded-2xl p-5 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Ride Completed!</h2>
                <p className="text-xs text-slate-400">You have safely arrived at {drop.address.split(',')[0]}</p>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-left">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Fare</span>
                    <span className="font-bold text-white">₹{selectedDriver.fare}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Payment Method</span>
                    <span className="font-semibold text-emerald-400">VITO Cash / UPI</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="py-2">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Rate Driver ({selectedDriver.name}):</span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setTripRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= tripRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('LOCATION_PICKER');
                    setCarProgress(0);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                >
                  Book Another Ride
                </button>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT LEAFLET MAP DISPLAY
          ───────────────────────────────────────────────────────────────── */}
          <div className="h-[460px] lg:h-[580px] rounded-2xl overflow-hidden border border-white/[0.08] relative shadow-xl">
            <CabMap
              center={[pickup.lat, pickup.lng]}
              pickup={pickup}
              drop={drop}
              drivers={drivers}
              selectedDriverId={selectedDriverId}
              onSelectDriver={(id) => setSelectedDriverId(id)}
              routePoints={step === 'LIVE_TRIP' ? routePoints : null}
              currentCarPos={step === 'LIVE_TRIP' ? currentCarPos : null}
              isLiveTrip={step === 'LIVE_TRIP'}
            />
          </div>

        </div>
      </div>

      {/* ═══ MOCK PAYMENT CHARGE MODAL ═══ */}
      <MockPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingId={rideId || 'ride_mock_101'}
        bookingType="cab"
        totalFare={selectedDriver ? selectedDriver.fare : 280}
        itemDescription={`Cab Trip — ${selectedDriver.category} (${selectedDriver.name})`}
      />
    </div>
  );
}
