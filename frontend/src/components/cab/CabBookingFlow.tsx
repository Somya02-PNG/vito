'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Wallet,
  Share2,
  MessageSquare,
  BadgeCheck,
  X,
  Printer,
  ChevronDown,
  Info,
  LifeBuoy,
  FileText,
  AlertCircle,
} from 'lucide-react';
import AddressAutocomplete, { PlaceResult } from '@/components/AddressAutocomplete';
import MockPaymentModal from '@/components/MockPaymentModal';

// Dynamic import for Leaflet map to prevent SSR issues
const EnhancedCabMap = dynamic(() => import('./EnhancedCabMap'), { ssr: false });

// ─── Types & State Machine ──────────────────────────────────────────────────
export type RideFlowStep =
  | 'RIDE_ENTRY'          // Screen 1: Pickup + Destination + Stops + Timing
  | 'SEARCH_OVERLAY'      // Screen 2: Destination Search Overlay
  | 'ROUTE_PREVIEW'       // Screen 3: Map & Route Preview
  | 'VEHICLE_SELECT'      // Screen 4: Category Selection & Dynamic Fare
  | 'CONFIRM_RIDE'        // Screen 6: Confirm Ride & Payment Method
  | 'MATCHING_RADAR'      // Screen 7: Driver Matching Pulse
  | 'DRIVER_FOUND'        // Screen 8: Driver Found Card
  | 'DRIVER_EN_ROUTE'     // Screen 10: Driver En Route Tracking
  | 'DRIVER_ARRIVED'      // Screen 11: Driver Arrived & Checklist
  | 'OTP_VERIFY'          // Screen 12: 4-digit OTP Verification
  | 'ACTIVE_TRIP'         // Screen 13: Active Trip & Live Telemetry
  | 'TRIP_COMPLETED'      // Screen 15: Trip Completed Summary
  | 'RATE_DRIVER'         // Screen 16: Rate Driver & Feedback
  | 'RECEIPT_VIEW'        // Screen 17: Itemized Digital Receipt
  | 'NO_DRIVERS';         // Screen 7b: No Drivers Available Fallback

export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
}

export interface CategoryOption {
  id: 'go' | 'comfort' | 'xl';
  name: string;
  categoryName: string;
  vehicleModel: string;
  seats: number;
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surgeMultiplier: number;
  surgeLabel: string;
  surgeAmount: number;
  bookingFee: number;
  taxes: number;
  total: number;
  fareRange: string;
  eta: string;
  description: string;
  icon: string;
}

export interface MatchedDriver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  experience: number;
  totalTrips: number;
  vehicleModel: string;
  vehicleNo: string;
  category: string;
  lat: number;
  lng: number;
  eta: string;
  etaMinutes: number;
  avatar: string;
  badges: string[];
}

const DEFAULT_PICKUP: LocationPoint = {
  address: 'Connaught Place Inner Circle, New Delhi',
  lat: 28.6315,
  lng: 77.2167,
};

const DEFAULT_DROP: LocationPoint = {
  address: 'Indira Gandhi International Airport Terminal 3, Delhi',
  lat: 28.5562,
  lng: 77.1000,
};

// ─── Main Component Orchestrator ────────────────────────────────────────────
export default function CabBookingFlow() {
  const router = useRouter();
  const { user } = useAuth();

  // Primary State
  const [step, setStep] = useState<RideFlowStep>('RIDE_ENTRY');
  const [searchTarget, setSearchTarget] = useState<'pickup' | 'drop' | 'stop0' | 'stop1'>('drop');

  // Locations
  const [pickup, setPickup] = useState<LocationPoint>(DEFAULT_PICKUP);
  const [drop, setDrop] = useState<LocationPoint | null>(null);
  const [stops, setStops] = useState<LocationPoint[]>([]);

  // Ride Scheduling
  const [rideTiming, setRideTiming] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Route Metrics
  const [distanceKm, setDistanceKm] = useState<number>(12.8);
  const [durationMin, setDurationMin] = useState<number>(26);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);

  // Vehicle Categories & Pricing
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'go' | 'comfort' | 'xl'>('go');
  const [showFareBreakdownModal, setShowFareBreakdownModal] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'cash'>('upi');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Driver Dispatch & Matching
  const [availableDrivers, setAvailableDrivers] = useState<MatchedDriver[]>([]);
  const [activeDriver, setActiveDriver] = useState<MatchedDriver | null>(null);
  const [showDriverProfileModal, setShowDriverProfileModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  // Live Ride Telemetry & Animations
  const [rideId, setRideId] = useState<string | null>(null);
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [enteredOTP, setEnteredOTP] = useState<string[]>(['', '', '', '']);
  const [otpError, setOtpError] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  // Live Animation Progress
  const [driverEnRouteProgress, setDriverEnRouteProgress] = useState<number>(0); // 0 to 1 moving to pickup
  const [tripProgress, setTripProgress] = useState<number>(0); // 0 to 1 moving to drop
  const [liveSpeed, setLiveSpeed] = useState<number>(44);

  // Post-Trip Rating & Feedback
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // ─── 1. Geolocation Setup on Mount ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPickup({
            address: 'Current Location (GPS Verified)',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Keep default CP coordinates
        },
        { timeout: 8000 }
      );
    }
  }, []);

  // ─── 2. Fetch Fare Estimates whenever Pickup/Drop/Stops change ───────────────
  const fetchFareEstimate = useCallback(async (dist: number, dur: number) => {
    try {
      const res = await fetchAPI<{ categories: CategoryOption[] }>('/api/rides/estimate', {
        method: 'POST',
        body: {
          distanceKm: dist,
          durationMin: dur,
          scheduledTime: rideTiming === 'later' && scheduledDate ? `${scheduledDate}T${scheduledTime || '12:00'}` : null,
        },
      });

      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch {
      // Offline fallback calculation
      const fallbackCats: CategoryOption[] = [
        {
          id: 'go',
          name: 'VITO Go',
          categoryName: 'Sedan / Hatchback',
          vehicleModel: 'Maruti Dzire / WagonR',
          seats: 4,
          baseFare: 50,
          distanceCharge: Math.round(dist * 14),
          timeCharge: Math.round(dur * 1.5),
          surgeMultiplier: 1.0,
          surgeLabel: 'Standard Rate',
          surgeAmount: 0,
          bookingFee: 20,
          taxes: Math.round((50 + dist * 14 + dur * 1.5 + 20) * 0.05),
          total: Math.round((50 + dist * 14 + dur * 1.5 + 20) * 1.05),
          fareRange: `₹${Math.round((50 + dist * 14 + dur * 1.5 + 20) * 1.0)}–₹${Math.round((50 + dist * 14 + dur * 1.5 + 20) * 1.1)}`,
          eta: '2 mins',
          description: 'Affordable, compact rides for everyday travel',
          icon: 'car',
        },
        {
          id: 'comfort',
          name: 'VITO Comfort',
          categoryName: 'Premium Sedan',
          vehicleModel: 'Honda City / Hyundai Verna',
          seats: 4,
          baseFare: 80,
          distanceCharge: Math.round(dist * 18),
          timeCharge: Math.round(dur * 2.0),
          surgeMultiplier: 1.0,
          surgeLabel: 'Standard Rate',
          surgeAmount: 0,
          bookingFee: 25,
          taxes: Math.round((80 + dist * 18 + dur * 2.0 + 25) * 0.05),
          total: Math.round((80 + dist * 18 + dur * 2.0 + 25) * 1.05),
          fareRange: `₹${Math.round((80 + dist * 18 + dur * 2.0 + 25) * 1.0)}–₹${Math.round((80 + dist * 18 + dur * 2.0 + 25) * 1.1)}`,
          eta: '3 mins',
          description: 'Top-rated drivers & newer, spacious sedans',
          icon: 'sparkles',
        },
        {
          id: 'xl',
          name: 'VITO XL',
          categoryName: 'Spacious SUV',
          vehicleModel: 'Toyota Innova / Ertiga',
          seats: 6,
          baseFare: 120,
          distanceCharge: Math.round(dist * 24),
          timeCharge: Math.round(dur * 3.0),
          surgeMultiplier: 1.0,
          surgeLabel: 'Standard Rate',
          surgeAmount: 0,
          bookingFee: 35,
          taxes: Math.round((120 + dist * 24 + dur * 3.0 + 35) * 0.05),
          total: Math.round((120 + dist * 24 + dur * 3.0 + 35) * 1.05),
          fareRange: `₹${Math.round((120 + dist * 24 + dur * 3.0 + 35) * 1.0)}–₹${Math.round((120 + dist * 24 + dur * 3.0 + 35) * 1.1)}`,
          eta: '5 mins',
          description: 'Extra room for groups & family with luggage',
          icon: 'users',
        },
      ];
      setCategories(fallbackCats);
    }
  }, [rideTiming, scheduledDate, scheduledTime]);

  // ─── 3. Compute Route Polyline & Distance ───────────────────────────────────
  const calculateRoute = useCallback(async (start: LocationPoint, end: LocationPoint, viaStops: LocationPoint[] = []) => {
    // Generate smooth bezier points as default fallback
    const waypoints: LocationPoint[] = [start, ...viaStops, end];
    const points: [number, number][] = [];

    for (let w = 0; w < waypoints.length - 1; w++) {
      const p1 = waypoints[w];
      const p2 = waypoints[w + 1];
      const segments = 15;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const lat = p1.lat + (p2.lat - p1.lat) * t + Math.sin(t * Math.PI) * 0.005;
        const lng = p1.lng + (p2.lng - p1.lng) * t;
        points.push([lat, lng]);
      }
    }

    setRoutePolyline(points);

    // Approximate distance
    const totalDist = Math.max(
      3.2,
      parseFloat(
        (
          Math.sqrt(
            Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)
          ) * 111 * 1.35
        ).toFixed(1)
      )
    );
    const totalDur = Math.max(8, Math.round(totalDist * 2.1));

    setDistanceKm(totalDist);
    setDurationMin(totalDur);
    fetchFareEstimate(totalDist, totalDur);
  }, [fetchFareEstimate]);

  // ─── 4. Query Available Drivers on Screen 4+ ────────────────────────────────
  const loadDrivers = useCallback(async () => {
    try {
      const res = await fetchAPI<{ drivers: MatchedDriver[] }>(
        `/api/rides/available-drivers?lat=${pickup.lat}&lng=${pickup.lng}&category=${selectedCategory}`
      );
      if (res.data?.drivers && res.data.drivers.length > 0) {
        setAvailableDrivers(res.data.drivers);
      }
    } catch {
      // Keep seeded
    }
  }, [pickup.lat, pickup.lng, selectedCategory]);

  useEffect(() => {
    if (step === 'VEHICLE_SELECT' || step === 'CONFIRM_RIDE') {
      loadDrivers();
    }
  }, [step, loadDrivers]);

  // Selected Category details
  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory) || categories[0];
  }, [categories, selectedCategory]);

  // ─── 5. Driver Matching Simulation (Screen 7) ────────────────────────────────
  const handleConfirmBooking = async () => {
    setStep('MATCHING_RADAR');

    // Realistic matching radar delay of 3.5s
    setTimeout(async () => {
      try {
        const res = await fetchAPI<{ drivers: MatchedDriver[] }>(
          `/api/rides/available-drivers?lat=${pickup.lat}&lng=${pickup.lng}&category=${selectedCategory}`
        );

        const candidates = res.data?.drivers || availableDrivers;
        if (!candidates || candidates.length === 0) {
          setStep('NO_DRIVERS');
          return;
        }

        const matched = candidates[0];
        setActiveDriver(matched);

        // Create ride in backend
        const rideRes = await fetchAPI<{ ride: { _id: string; otp: string }; otp: string }>('/api/rides', {
          method: 'POST',
          body: {
            pickup,
            drop,
            stops,
            category: selectedCategory,
            fare: currentCategory ? currentCategory.total : 280,
            fareBreakdown: currentCategory,
            distance: distanceKm,
            duration: durationMin,
            scheduledFor: rideTiming === 'later' ? `${scheduledDate}T${scheduledTime || '12:00'}` : null,
            driverId: matched.id.startsWith('drv_') ? null : matched.id,
            driverInfo: matched,
            paymentMethod,
          },
        });

        if (rideRes.data?.ride) {
          setRideId(rideRes.data.ride._id);
          setGeneratedOTP(rideRes.data.otp || rideRes.data.ride.otp || '4829');
        } else {
          setGeneratedOTP(Math.floor(1000 + Math.random() * 9000).toString());
        }

        setStep('DRIVER_FOUND');
      } catch {
        // Fallback matched driver
        const fallbackMatch: MatchedDriver = {
          id: 'drv_1',
          name: 'Rajesh Kumar',
          phone: '+91 98765 43210',
          rating: 4.92,
          experience: 8,
          totalTrips: 1420,
          vehicleModel: 'Maruti Dzire (White)',
          vehicleNo: 'DL 01 AB 4829',
          category: selectedCategory,
          lat: pickup.lat + 0.006,
          lng: pickup.lng + 0.004,
          eta: '3 mins',
          etaMinutes: 3,
          avatar: 'RK',
          badges: ['Identity Verified', 'License Verified', 'Police Background Verified'],
        };
        setActiveDriver(fallbackMatch);
        setGeneratedOTP(Math.floor(1000 + Math.random() * 9000).toString());
        setStep('DRIVER_FOUND');
      }
    }, 3500);
  };

  // ─── 6. Driver En-Route Live Animation (Screen 10 -> 11) ──────────────────────
  const startDriverEnRoute = () => {
    setStep('DRIVER_EN_ROUTE');
    setDriverEnRouteProgress(0);

    const duration = 7000; // 7 seconds simulation of driver reaching pickup
    const interval = 100;
    const totalSteps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const prog = Math.min(currentStep / totalSteps, 1);
      setDriverEnRouteProgress(prog);

      if (prog >= 1) {
        clearInterval(timer);
        // Driver Arrived!
        if (rideId) {
          fetchAPI(`/api/rides/${rideId}/status`, {
            method: 'PATCH',
            body: { status: 'arrived' },
          }).catch(() => {});
        }
        setStep('DRIVER_ARRIVED');
      }
    }, interval);
  };

  // ─── 7. OTP Verification Handler (Screen 12 -> 13) ───────────────────────────
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const updated = [...enteredOTP];
    updated[index] = val;
    setEnteredOTP(updated);
    setOtpError('');

    if (val && index < 3) {
      const nextField = document.getElementById(`vito-otp-${index + 1}`);
      nextField?.focus();
    }
  };

  const handleVerifyOTP = async (overrideValue?: string) => {
    const code = overrideValue || enteredOTP.join('');
    if (code.length < 4) {
      setOtpError('Please enter all 4 digits of the OTP.');
      return;
    }

    if (code !== generatedOTP) {
      setOtpError('Incorrect OTP. Please enter the valid code displayed above.');
      return;
    }

    setLoadingAction(true);
    try {
      if (rideId) {
        await fetchAPI(`/api/rides/${rideId}/verify-otp`, {
          method: 'POST',
          body: { otp: code },
        });
      }
      startActiveTrip();
    } catch {
      startActiveTrip();
    } finally {
      setLoadingAction(false);
    }
  };

  // ─── 8. Active Trip Animation (Screen 13 -> 15) ──────────────────────────────
  const startActiveTrip = () => {
    setStep('ACTIVE_TRIP');
    setTripProgress(0);

    const tripDuration = 12000; // 12 seconds animation
    const interval = 100;
    const totalSteps = tripDuration / interval;
    let cur = 0;

    const timer = setInterval(() => {
      cur++;
      const progress = Math.min(cur / totalSteps, 1);
      setTripProgress(progress);
      setLiveSpeed(Math.floor(40 + Math.sin(progress * Math.PI * 3) * 12));

      if (progress >= 1) {
        clearInterval(timer);
        if (rideId) {
          fetchAPI(`/api/rides/${rideId}/status`, {
            method: 'PATCH',
            body: { status: 'completed', paymentStatus: 'completed' },
          }).catch(() => {});
        }
        setStep('TRIP_COMPLETED');
        setShowPaymentModal(true);
      }
    }, interval);
  };

  // ─── 9. Submit Rating & Feedback (Screen 16) ────────────────────────────────
  const handleSubmitRating = async () => {
    setLoadingAction(true);
    try {
      if (rideId) {
        await fetchAPI(`/api/rides/${rideId}/rate`, {
          method: 'POST',
          body: {
            rating: ratingValue,
            feedbackTags: selectedTags,
            feedbackComment,
          },
        });
      }
      setRatingSubmitted(true);
      setStep('RECEIPT_VIEW');
    } catch {
      setRatingSubmitted(true);
      setStep('RECEIPT_VIEW');
    } finally {
      setLoadingAction(false);
    }
  };

  // ─── Computed Coordinates for Map Animations ─────────────────────────────────
  const driverEnRouteCarPos: [number, number] | null = useMemo(() => {
    if (!activeDriver || step !== 'DRIVER_EN_ROUTE') return null;
    const lat = activeDriver.lat + (pickup.lat - activeDriver.lat) * driverEnRouteProgress;
    const lng = activeDriver.lng + (pickup.lng - activeDriver.lng) * driverEnRouteProgress;
    return [lat, lng];
  }, [activeDriver, pickup, driverEnRouteProgress, step]);

  const activeTripCarPos: [number, number] | null = useMemo(() => {
    if (step !== 'ACTIVE_TRIP' || routePolyline.length === 0) return null;
    const idx = Math.min(
      Math.floor(tripProgress * (routePolyline.length - 1)),
      routePolyline.length - 1
    );
    return routePolyline[idx];
  }, [step, routePolyline, tripProgress]);

  const distanceRemaining = useMemo(() => {
    return Math.max(0, parseFloat((distanceKm * (1 - tripProgress)).toFixed(1)));
  }, [distanceKm, tripProgress]);

  const timeRemainingMins = useMemo(() => {
    return Math.max(0, Math.ceil(durationMin * (1 - tripProgress)));
  }, [durationMin, tripProgress]);

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-start">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* ════════════════════════════════════════════════════════════════════════
          STEP PROGRESS INDICATOR (Step 1 to 18 visual tracker)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-2 px-1 mb-5">
        <div className="flex items-center gap-3">
          {step !== 'RIDE_ENTRY' && (
            <button
              onClick={() => {
                if (['SEARCH_OVERLAY', 'ROUTE_PREVIEW'].includes(step)) setStep('RIDE_ENTRY');
                else if (step === 'VEHICLE_SELECT') setStep('ROUTE_PREVIEW');
                else if (step === 'CONFIRM_RIDE') setStep('VEHICLE_SELECT');
                else if (step === 'DRIVER_FOUND') setStep('CONFIRM_RIDE');
                else if (['DRIVER_ARRIVED', 'OTP_VERIFY'].includes(step)) setStep('DRIVER_EN_ROUTE');
                else setStep('RIDE_ENTRY');
              }}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
              aria-label="Back"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                VITO Mobility · Cab Booking
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {step === 'RIDE_ENTRY' && 'Book a Ride'}
              {step === 'SEARCH_OVERLAY' && 'Search Destination'}
              {step === 'ROUTE_PREVIEW' && 'Route & Distance Preview'}
              {step === 'VEHICLE_SELECT' && 'Choose Vehicle Category'}
              {step === 'CONFIRM_RIDE' && 'Confirm Your Ride'}
              {step === 'MATCHING_RADAR' && 'Dispatching Driver'}
              {step === 'DRIVER_FOUND' && 'Driver Assigned'}
              {step === 'DRIVER_EN_ROUTE' && 'Driver En Route'}
              {step === 'DRIVER_ARRIVED' && 'Driver Arrived at Pickup'}
              {step === 'OTP_VERIFY' && 'Start Ride Verification'}
              {step === 'ACTIVE_TRIP' && 'Live Trip in Progress'}
              {step === 'TRIP_COMPLETED' && 'Ride Completed'}
              {step === 'RATE_DRIVER' && 'Rate Your Experience'}
              {step === 'RECEIPT_VIEW' && 'Official Digital Invoice'}
              {step === 'NO_DRIVERS' && 'No Drivers Available'}
            </h1>
          </div>
        </div>

        {/* Global Reset Action */}
        {step !== 'RIDE_ENTRY' && (
          <button
            onClick={() => {
              setStep('RIDE_ENTRY');
              setDrop(null);
              setStops([]);
              setActiveDriver(null);
              setRideId(null);
              setEnteredOTP(['', '', '', '']);
            }}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] transition-all"
          >
            New Booking
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MAIN 2-COLUMN LAYOUT: Controls (Left) + Enhanced Map (Right)
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-6 items-start">

        {/* ───────────────────────────────────────────────────────────────────
            LEFT CONTROLS PANEL
        ─────────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 1: RIDE BOOKING ENTRY
          ════════════════════════════════════════════════════════════════ */}
          {step === 'RIDE_ENTRY' && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-5 animate-fadeInUp">
              {/* Timing Toggle */}
              <div className="flex p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                <button
                  onClick={() => setRideTiming('now')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    rideTiming === 'now'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Ride Now
                </button>
                <button
                  onClick={() => setRideTiming('later')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    rideTiming === 'later'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule for Later
                </button>
              </div>

              {/* Date & Time Picker if Schedule Later */}
              {rideTiming === 'later' && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-blue-500/20 grid grid-cols-2 gap-3 animate-fadeIn">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Route Input Stack */}
              <div className="space-y-3 relative">
                {/* Pickup Field */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    Pickup Location
                  </label>
                  <button
                    onClick={() => {
                      setSearchTarget('pickup');
                      setStep('SEARCH_OVERLAY');
                    }}
                    className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-white truncate">
                        {pickup.address}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-400">
                      Edit
                    </span>
                  </button>
                </div>

                {/* Additional Stops (Max 2) */}
                {stops.map((stop, idx) => (
                  <div key={idx} className="relative animate-fadeIn">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      Stop {idx + 1}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSearchTarget(idx === 0 ? 'stop0' : 'stop1');
                          setStep('SEARCH_OVERLAY');
                        }}
                        className="flex-1 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-amber-500/30 text-left flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">
                            {stop.address}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={() => setStops((prev) => prev.filter((_, i) => i !== idx))}
                        className="w-10 h-10 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                        aria-label="Remove stop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Destination "Where to?" Field */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                    Drop Location
                  </label>
                  <button
                    onClick={() => {
                      setSearchTarget('drop');
                      setStep('SEARCH_OVERLAY');
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                      drop
                        ? 'bg-white/[0.04] border-white/[0.08]'
                        : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className={`text-xs font-bold truncate ${drop ? 'text-white' : 'text-blue-300'}`}>
                        {drop ? drop.address : 'Where to? Search destination...'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Add Stop Button */}
              {stops.length < 2 && (
                <button
                  onClick={() => {
                    const newStop: LocationPoint = {
                      address: 'New Delhi Railway Station, Delhi',
                      lat: 28.643,
                      lng: 77.2194,
                    };
                    setStops((prev) => [...prev, newStop]);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 py-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Stop (max 2)
                </button>
              )}

              {/* Primary Action Button */}
              <button
                onClick={() => {
                  if (drop) {
                    calculateRoute(pickup, drop, stops);
                    setStep('ROUTE_PREVIEW');
                  } else {
                    setSearchTarget('drop');
                    setStep('SEARCH_OVERLAY');
                  }
                }}
                disabled={!drop}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black transition-all shadow-xl shadow-blue-500/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue to Route Preview
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 2: SEARCH OVERLAY
          ════════════════════════════════════════════════════════════════ */}
          {step === 'SEARCH_OVERLAY' && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-4 animate-fadeIn">
              <AddressAutocomplete
                value=""
                onChange={() => {}}
                onSelect={(place) => {
                  const pt: LocationPoint = {
                    address: place.address,
                    lat: place.lat,
                    lng: place.lng,
                  };

                  if (searchTarget === 'pickup') {
                    setPickup(pt);
                  } else if (searchTarget === 'drop') {
                    setDrop(pt);
                    calculateRoute(pickup, pt, stops);
                  } else if (searchTarget === 'stop0') {
                    const updated = [...stops];
                    updated[0] = pt;
                    setStops(updated);
                  } else if (searchTarget === 'stop1') {
                    const updated = [...stops];
                    updated[1] = pt;
                    setStops(updated);
                  }

                  setStep('ROUTE_PREVIEW');
                }}
                label={searchTarget === 'pickup' ? 'Edit Pickup Location' : 'Search Destination'}
                onClose={() => setStep('RIDE_ENTRY')}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 3: ROUTE & DISTANCE PREVIEW
          ════════════════════════════════════════════════════════════════ */}
          {step === 'ROUTE_PREVIEW' && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-5 animate-fadeInUp">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-400" />
                Route Summary
              </h2>

              {/* Route Path summary card */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <div className="w-0.5 h-8 bg-slate-700 my-1" />
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-emerald-400">Pickup</p>
                      <p className="text-xs font-semibold text-white truncate">{pickup.address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-rose-400">Destination</p>
                      <p className="text-xs font-semibold text-white truncate">{drop?.address || DEFAULT_DROP.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="text-2xl font-black text-white">{distanceKm} km</p>
                  <p className="text-[11px] font-bold text-blue-300 mt-0.5">Est. Distance</p>
                </div>
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                  <p className="text-2xl font-black text-white">{durationMin} mins</p>
                  <p className="text-[11px] font-bold text-cyan-300 mt-0.5">Est. Travel Time</p>
                </div>
              </div>

              <button
                onClick={() => {
                  fetchFareEstimate(distanceKm, durationMin);
                  setStep('VEHICLE_SELECT');
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                Choose Ride Category
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 4 & 5: VEHICLE SELECTION & DYNAMIC FARE
          ════════════════════════════════════════════════════════════════ */}
          {step === 'VEHICLE_SELECT' && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-4 animate-fadeInUp">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-400" />
                  Select Vehicle Category
                </h2>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-ping" />
                  Live Pricing
                </span>
              </div>

              {/* Category Cards */}
              <div className="space-y-2.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white/5 border border-white/10 text-slate-300'
                          }`}
                        >
                          {cat.id === 'go' && '🚗'}
                          {cat.id === 'comfort' && '✨'}
                          {cat.id === 'xl' && '🚙'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{cat.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300">
                              {cat.seats} Seats
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{cat.categoryName}</p>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> ETA {cat.eta}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-white">₹{cat.total}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{cat.fareRange}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Itemized Fare Breakdown Trigger Button */}
              <button
                onClick={() => setShowFareBreakdownModal(true)}
                className="w-full py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                View Itemized Fare Breakdown
              </button>

              <button
                onClick={() => setStep('CONFIRM_RIDE')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                Confirm {currentCategory?.name || 'Ride'} — ₹{currentCategory?.total || 280}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 6: CONFIRM RIDE & PAYMENT METHOD
          ════════════════════════════════════════════════════════════════ */}
          {step === 'CONFIRM_RIDE' && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-5 animate-fadeInUp">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Confirm Ride Details
              </h2>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div>
                    <span className="text-xs font-extrabold text-white">{currentCategory?.name}</span>
                    <p className="text-[11px] text-slate-400">{currentCategory?.vehicleModel}</p>
                  </div>
                  <span className="text-lg font-black text-emerald-400">₹{currentCategory?.total}</span>
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Pickup: {pickup.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">Drop: {drop?.address || DEFAULT_DROP.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Est. Distance: {distanceKm} km</span>
                    <span>Est. Duration: {durationMin} mins</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR', icon: Zap },
                    { id: 'wallet', label: 'VITO Wallet', icon: Wallet },
                    { id: 'card', label: 'Credit Card', icon: CreditCard },
                    { id: 'cash', label: 'Cash on Arrival', icon: BanknoteIcon },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = paymentMethod === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPaymentMethod(p.id as any)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Final Confirm CTA */}
              <button
                onClick={handleConfirmBooking}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Confirm Ride & Dispatch Driver
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 7: DRIVER MATCHING RADAR
          ════════════════════════════════════════════════════════════════ */}
          {step === 'MATCHING_RADAR' && (
            <div className="p-8 rounded-3xl bg-[#0B101E] border border-blue-500/30 text-center space-y-6 animate-fadeIn">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
                <div className="absolute inset-3 rounded-full bg-blue-500/20 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                  <Car className="w-8 h-8 animate-bounce" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Finding your VITO driver...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Querying nearby verified drivers matching {currentCategory?.name || 'your category'} within 5km radius
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Assigning top matched driver...
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 8 & 9: DRIVER FOUND CARD & PROFILE
          ════════════════════════════════════════════════════════════════ */}
          {step === 'DRIVER_FOUND' && activeDriver && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-5 animate-fadeInUp">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Driver Assigned
                </span>
                <span className="text-xs font-extrabold text-blue-400">ETA {activeDriver.eta}</span>
              </div>

              {/* Driver Identity Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-blue-500/25">
                    {activeDriver.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{activeDriver.name}</h3>
                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {activeDriver.rating.toFixed(2)} · {activeDriver.totalTrips}+ trips
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {activeDriver.vehicleModel} · <span className="text-white font-mono font-bold">{activeDriver.vehicleNo}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDriverProfileModal(true)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 underline shrink-0 mt-1"
                >
                  Full Profile
                </button>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => alert(`Calling driver: ${activeDriver.phone}`)}
                  className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-bold text-slate-200 flex flex-col items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Contact
                </button>
                <button
                  onClick={() => alert(`Trip tracking link copied to clipboard!`)}
                  className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-bold text-slate-200 flex flex-col items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  Share Trip
                </button>
                <button
                  onClick={() => setShowSafetyModal(true)}
                  className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 flex flex-col items-center gap-1.5 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Safety
                </button>
              </div>

              {/* Track Driver Action */}
              <button
                onClick={startDriverEnRoute}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                Track Driver En Route
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 10: DRIVER EN ROUTE
          ════════════════════════════════════════════════════════════════ */}
          {step === 'DRIVER_EN_ROUTE' && activeDriver && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-5 animate-fadeInUp">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  Driver is heading to pickup
                </span>
                <span className="text-sm font-black text-white">ETA {Math.max(1, Math.ceil(activeDriver.etaMinutes * (1 - driverEnRouteProgress)))} mins</span>
              </div>

              {/* Driver summary */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">
                    {activeDriver.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{activeDriver.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{activeDriver.vehicleNo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSafetyModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  SOS
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-xs text-blue-300 font-semibold">
                  Driver arriving at {pickup.address.split(',')[0]}
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 11: DRIVER ARRIVED & SAFETY CHECKLIST
          ════════════════════════════════════════════════════════════════ */}
          {step === 'DRIVER_ARRIVED' && activeDriver && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-emerald-500/30 shadow-2xl space-y-5 animate-fadeInUp">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-white">Your driver has arrived!</h3>
                <p className="text-xs text-slate-400">Please verify details before getting into the car</p>
              </div>

              {/* 3-Point Safety Checklist */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pre-Ride Safety Checklist
                </p>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Match Driver: <strong>{activeDriver.name}</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Match Vehicle: <strong>{activeDriver.vehicleModel}</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Match Number Plate: <strong className="text-amber-400 font-mono">{activeDriver.vehicleNo}</strong></span>
                </div>
              </div>

              <button
                onClick={() => setStep('OTP_VERIFY')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-black transition-all shadow-xl shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                Proceed to OTP Verification
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 12: OTP VERIFICATION
          ════════════════════════════════════════════════════════════════ */}
          {step === 'OTP_VERIFY' && activeDriver && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/30 shadow-2xl space-y-5 animate-fadeInUp">
              {/* OTP Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Your 4-Digit Ride Start OTP
                </span>
                <div className="text-4xl font-black text-amber-400 tracking-[0.3em] font-mono">
                  {generatedOTP}
                </div>
                <p className="text-[11px] text-slate-400">
                  Share this OTP with {activeDriver.name} to start your ride
                </p>
              </div>

              {/* Dev/Demo Simulate Verify Button */}
              <div className="space-y-3 pt-1">
                <label className="text-xs font-bold text-slate-300 block text-center">
                  Driver OTP Entry (Enter code or simulate):
                </label>
                <div className="flex justify-center gap-3">
                  {enteredOTP.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`vito-otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-12 h-14 text-center text-2xl font-black text-white rounded-2xl bg-white/[0.06] border border-white/[0.12] focus:border-blue-500 focus:outline-none font-mono"
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-xs text-rose-400 text-center flex items-center justify-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {otpError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const chars = generatedOTP.split('');
                      setEnteredOTP(chars);
                      handleVerifyOTP(generatedOTP);
                    }}
                    className="flex-1 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-300 transition-colors"
                  >
                    ⚡ Auto-Fill & Verify (Demo)
                  </button>
                  <button
                    onClick={() => handleVerifyOTP()}
                    disabled={loadingAction}
                    className="flex-[1.5] py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Verify & Start Trip
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 13 & 14: ACTIVE TRIP & TELEMETRY
          ════════════════════════════════════════════════════════════════ */}
          {step === 'ACTIVE_TRIP' && activeDriver && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-4 animate-fadeInUp">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-sm font-black text-white uppercase tracking-wider">
                    Trip in Progress
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold border border-blue-500/30 font-mono">
                  {liveSpeed} km/h
                </span>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Distance Left</p>
                  <p className="text-xl font-black text-white mt-0.5">{distanceRemaining} km</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Remaining</p>
                  <p className="text-xl font-black text-white mt-0.5">{timeRemainingMins} mins</p>
                </div>
              </div>

              {/* Driver & Safety Persistent Action */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">
                    {activeDriver.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{activeDriver.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{activeDriver.vehicleNo}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSafetyModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4" />
                  SOS Safety
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 15: TRIP COMPLETED
          ════════════════════════════════════════════════════════════════ */}
          {step === 'TRIP_COMPLETED' && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-emerald-500/30 shadow-2xl text-center space-y-4 animate-fadeInUp">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">You Have Arrived!</h3>
                <p className="text-xs text-slate-400 mt-1">Trip completed safely at {drop?.address.split(',')[0]}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Final Fare</span>
                  <span className="font-black text-white">₹{currentCategory?.total || 280}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Payment Status</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Paid via {paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStep('RATE_DRIVER')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                Rate Driver & View Receipt
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 16: RATE DRIVER & FEEDBACK
          ════════════════════════════════════════════════════════════════ */}
          {step === 'RATE_DRIVER' && activeDriver && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-5 animate-fadeInUp">
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-lg font-black text-white mx-auto shadow-lg">
                  {activeDriver.avatar}
                </div>
                <h3 className="text-base font-black text-white">Rate {activeDriver.name}</h3>
                <p className="text-xs text-slate-400">{activeDriver.vehicleModel} · {activeDriver.vehicleNo}</p>
              </div>

              {/* 5-Star Interactive Rating */}
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingValue ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Quick Tags */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">
                  What made this ride great?
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['Clean Vehicle', 'Safe Driving', 'Professional Driver', 'Great Music', 'On Time'].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTags((prev) =>
                            isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment Field */}
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Optional feedback for the driver..."
                rows={2}
                className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />

              <button
                onClick={handleSubmitRating}
                disabled={loadingAction}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Submit Rating & Continue to Receipt
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 17 & 18: DIGITAL RECEIPT & MY TRIPS INTEGRATION
          ════════════════════════════════════════════════════════════════ */}
          {step === 'RECEIPT_VIEW' && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-blue-500/20 shadow-2xl space-y-5 animate-fadeInUp">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-black text-white">VITO Tax Invoice</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Invoice #{rideId ? rideId.slice(-8).toUpperCase() : 'VT92014'}</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>

              {/* Receipt Body */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Base Fare ({currentCategory?.name})</span>
                  <span>₹{currentCategory?.baseFare || 50}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Distance Charge ({distanceKm} km)</span>
                  <span>₹{currentCategory?.distanceCharge || 180}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Time Charge ({durationMin} mins)</span>
                  <span>₹{currentCategory?.timeCharge || 40}</span>
                </div>
                {currentCategory?.surgeAmount ? (
                  <div className="flex justify-between text-amber-400">
                    <span>Surge ({currentCategory.surgeLabel})</span>
                    <span>+₹{currentCategory.surgeAmount}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-300">
                  <span>Booking & Platform Fee</span>
                  <span>₹{currentCategory?.bookingFee || 20}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>GST Taxes (5%)</span>
                  <span>₹{currentCategory?.taxes || 14}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/[0.08]">
                  <span>Total Amount Paid</span>
                  <span className="text-emerald-400">₹{currentCategory?.total || 280}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-400">
                Paid with {paymentMethod.toUpperCase()} · Verified by VITO Mobility Platform
              </div>

              <div className="flex gap-2">
                <Link
                  href="/customer/trips"
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black text-center transition-all shadow-lg active:scale-95"
                >
                  View in My Trips
                </Link>
                <button
                  onClick={() => {
                    setStep('RIDE_ENTRY');
                    setDrop(null);
                    setStops([]);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-bold transition-all"
                >
                  Book Another Ride
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              FALLBACK: NO DRIVERS AVAILABLE
          ════════════════════════════════════════════════════════════════ */}
          {step === 'NO_DRIVERS' && (
            <div className="p-6 rounded-3xl bg-[#0B101E] border border-amber-500/30 shadow-2xl text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-white">No Drivers Available Right Now</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                All nearby drivers are currently on other trips. Please retry in a few moments.
              </p>
              <button
                onClick={handleConfirmBooking}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg active:scale-95"
              >
                Retry Driver Search
              </button>
            </div>
          )}

        </div>

        {/* ───────────────────────────────────────────────────────────────────
            RIGHT MAP DISPLAY
        ─────────────────────────────────────────────────────────────────── */}
        <div className="h-[520px] lg:h-[640px] rounded-3xl overflow-hidden border border-white/[0.08] relative shadow-2xl bg-[#07090E]">
          <EnhancedCabMap
            center={[pickup.lat, pickup.lng]}
            pickup={pickup}
            drop={drop}
            stops={stops}
            drivers={availableDrivers}
            selectedDriverId={activeDriver ? activeDriver.id : null}
            routePoints={['ROUTE_PREVIEW', 'VEHICLE_SELECT', 'CONFIRM_RIDE', 'ACTIVE_TRIP', 'TRIP_COMPLETED', 'RECEIPT_VIEW'].includes(step) ? routePolyline : null}
            currentCarPos={step === 'DRIVER_EN_ROUTE' ? driverEnRouteCarPos : step === 'ACTIVE_TRIP' ? activeTripCarPos : null}
            isMoving={['DRIVER_EN_ROUTE', 'ACTIVE_TRIP'].includes(step)}
            statusLabel={
              step === 'DRIVER_EN_ROUTE'
                ? `Driver Arriving (${Math.max(1, Math.ceil((activeDriver?.etaMinutes || 3) * (1 - driverEnRouteProgress)))}m)`
                : step === 'ACTIVE_TRIP'
                ? `En Route · ${liveSpeed} km/h`
                : undefined
            }
          />
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: ITEMIZED FARE BREAKDOWN (Screen 5)
      ════════════════════════════════════════════════════════════════════════ */}
      {showFareBreakdownModal && currentCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0B101E] border border-blue-500/30 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-white">{currentCategory.name} Fare Breakdown</h3>
                <p className="text-[11px] text-slate-400">{currentCategory.categoryName}</p>
              </div>
              <button
                onClick={() => setShowFareBreakdownModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Fare</span>
                <span className="font-semibold">₹{currentCategory.baseFare}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distance Charge ({distanceKm} km @ ₹{currentCategory.distanceCharge / distanceKm || 14}/km)</span>
                <span className="font-semibold">₹{currentCategory.distanceCharge}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Time Charge ({durationMin} mins)</span>
                <span className="font-semibold">₹{currentCategory.timeCharge}</span>
              </div>
              {currentCategory.surgeAmount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Surge ({currentCategory.surgeLabel})</span>
                  <span className="font-bold">+₹{currentCategory.surgeAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span>Booking / Platform Fee</span>
                <span className="font-semibold">₹{currentCategory.bookingFee}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GST Taxes (5%)</span>
                <span className="font-semibold">₹{currentCategory.taxes}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2.5 border-t border-white/[0.08]">
                <span>Total Estimated Fare</span>
                <span className="text-emerald-400">₹{currentCategory.total}</span>
              </div>
            </div>

            <button
              onClick={() => setShowFareBreakdownModal(false)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: DRIVER PROFILE QUICK VIEW (Screen 9)
      ════════════════════════════════════════════════════════════════════════ */}
      {showDriverProfileModal && activeDriver && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0B101E] border border-blue-500/30 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-black text-white">Driver Credentials</h3>
              <button
                onClick={() => setShowDriverProfileModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-xl font-black text-white">
                {activeDriver.avatar}
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{activeDriver.name}</h4>
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {activeDriver.rating.toFixed(2)} rating · {activeDriver.totalTrips}+ completed rides
                </p>
                <p className="text-xs text-slate-400 mt-1">{activeDriver.experience} years on VITO platform</p>
              </div>
            </div>

            {/* Verification Badges */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Safety Badges</p>
              {activeDriver.badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <BadgeCheck className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{badge}</span>
                </div>
              ))}
            </div>

            {/* Vehicle Details */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Vehicle</p>
              <p className="text-white font-bold">{activeDriver.vehicleModel}</p>
              <p className="text-slate-400">Registration Plate: <strong className="text-amber-400 font-mono">{activeDriver.vehicleNo}</strong></p>
            </div>

            <button
              onClick={() => setShowDriverProfileModal(false)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 3: IN-TRIP SAFETY CENTER & SOS (Screen 14)
      ════════════════════════════════════════════════════════════════════════ */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0B101E] border border-rose-500/40 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-white">VITO In-Trip Safety Center</h3>
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Emergency SOS Banner */}
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-center space-y-3">
              <h4 className="text-sm font-black text-white">Emergency Assistance</h4>
              <p className="text-xs text-slate-300">
                Trigger emergency SOS to notify local authorities and VITO safety response team with your live GPS coordinates.
              </p>
              <button
                onClick={() => setSosActive(!sosActive)}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  sosActive ? 'bg-slate-700 text-slate-300' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40'
                }`}
              >
                {sosActive ? 'Cancel SOS Alert' : '🆘 Send Immediate SOS'}
              </button>
            </div>

            {/* Safety Options */}
            <div className="space-y-2 text-xs">
              <button
                onClick={() => alert('Live location share link copied!')}
                className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-left flex items-center justify-between font-semibold text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" /> Share Live Trip Tracking
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => alert('Connecting to VITO 24/7 Safety Helpline: 1800-VITO-SAFE')}
                className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-left flex items-center justify-between font-semibold text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" /> Call 24/7 Safety Helpline
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => alert('Safety incident report ticket opened with support team')}
                className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-left flex items-center justify-between font-semibold text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> Report a Safety Incident
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MOCK PAYMENT MODAL (Post-Trip Charge)
      ════════════════════════════════════════════════════════════════════════ */}
      <MockPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingId={rideId || 'ride_vito_101'}
        bookingType="cab"
        totalFare={currentCategory?.total || 280}
        itemDescription={`VITO ${currentCategory?.name || 'Cab'} Ride — ${activeDriver?.name || 'Driver'}`}
      />
    </div>
  );
}

// Icon helper
function BanknoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}
