'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import {
  MapPin,
  Navigation,
  Car,
  Star,
  Clock,
  Shield,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
  Check,
  Loader2,
  KeyRound,
  ShieldAlert,
  Plus,
  Trash2,
  Info,
  DollarSign,
  User,
  Activity,
  AlertCircle,
  WifiOff,
  Edit3,
  X,
  CreditCard,
  Heart,
  ChevronRight,
} from 'lucide-react';

// Lazy-load CabMap to prevent SSR window/leaflet issues
const CabMap = dynamic(() => import('./CabMap'), { ssr: false });
import MockPaymentModal from '@/components/MockPaymentModal';
import AddressAutocomplete, { NominatimLocation } from '@/components/AddressAutocomplete';

// ─── Ride State Machine Type ────────────────────────────────────────────────
export type RideStepState =
  | 'LOCATION_PICKER'
  | 'VEHICLE_SELECTION'
  | 'SEARCHING_DRIVER'
  | 'NO_DRIVER_AVAILABLE'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'TRIP_PAYMENT'
  | 'RATING_REVIEW';

export interface LocationItem {
  address: string;
  lat: number;
  lng: number;
}

export interface VehicleCategory {
  id: 'Mini' | 'Sedan' | 'SUV' | 'Premium';
  name: string;
  icon: string;
  capacity: number;
  baseFare: number;
  perKmRate: number;
  perMinRate: number;
  multiplier: number;
  eta: string;
  description: string;
}

export interface FareBreakdown {
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  durationMin: number;
  timeFare: number;
  surgeMultiplier: number;
  surgeReason: string;
  subtotal: number;
  totalFare: number;
}

export interface MatchedDriver {
  id: string;
  _id: string;
  name: string;
  vehicleModel: string;
  vehicleNo: string;
  category: string;
  rating: number;
  eta: string;
  fare: number;
  lat: number;
  lng: number;
  phone: string;
  avatar: string;
}

// ─── Default Locations ───────────────────────────────────────────────────────
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

// ─── Vehicle Categories Config ───────────────────────────────────────────────
const VEHICLE_CATEGORIES: VehicleCategory[] = [
  {
    id: 'Mini',
    name: 'Mini',
    icon: '🚗',
    capacity: 4,
    baseFare: 40,
    perKmRate: 12,
    perMinRate: 2,
    multiplier: 1.0,
    eta: '3 mins',
    description: 'Compact & pocket-friendly daily rides',
  },
  {
    id: 'Sedan',
    name: 'Sedan',
    icon: '🚘',
    capacity: 4,
    baseFare: 50,
    perKmRate: 16,
    perMinRate: 2.5,
    multiplier: 1.25,
    eta: '2 mins',
    description: 'Top rated drivers & extra legroom',
  },
  {
    id: 'SUV',
    name: 'SUV',
    icon: '🚙',
    capacity: 6,
    baseFare: 80,
    perKmRate: 24,
    perMinRate: 3.5,
    multiplier: 1.6,
    eta: '5 mins',
    description: 'High seating & extra luggage space',
  },
  {
    id: 'Premium',
    name: 'Premium',
    icon: '🏎️',
    capacity: 4,
    baseFare: 120,
    perKmRate: 35,
    perMinRate: 5.0,
    multiplier: 2.2,
    eta: '4 mins',
    description: 'High-end luxury vehicles & executive chauffeurs',
  },
];

// ─── Helper: Time of Day Surge Multiplier Lookup ────────────────────────────
function getSurgeMultiplier(): { multiplier: number; reason: string } {
  const hour = new Date().getHours();

  if (hour >= 8 && hour <= 10) {
    return { multiplier: 1.5, reason: 'Morning Peak Office Rush (1.5x)' };
  } else if (hour >= 18 && hour <= 21) {
    return { multiplier: 1.8, reason: 'Evening Heavy Traffic Demand (1.8x)' };
  } else if (hour >= 23 || hour <= 4) {
    return { multiplier: 1.2, reason: 'Late Night Travel Surcharge (1.2x)' };
  } else {
    return { multiplier: 1.0, reason: 'Standard Off-Peak Rate (1.0x)' };
  }
}

export default function CabBookingPage() {
  // Main Ride State
  const [rideState, setRideState] = useState<RideStepState>('LOCATION_PICKER');

  // Location inputs
  const [pickup, setPickup] = useState<LocationItem>(DEFAULT_PICKUP);
  const [drop, setDrop] = useState<LocationItem>(DEFAULT_DROP);
  const [stops, setStops] = useState<LocationItem[]>([]);
  const [pickupInput, setPickupInput] = useState(DEFAULT_PICKUP.address);
  const [dropInput, setDropInput] = useState(DEFAULT_DROP.address);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Selected Vehicle Category
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory['id']>('Sedan');

  // Route calculation data
  const [distanceKm, setDistanceKm] = useState<number>(14.5);
  const [durationMin, setDurationMin] = useState<number>(28);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [driverToPickupPoints, setDriverToPickupPoints] = useState<[number, number][]>([]);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Driver Matching state
  const [nearbyDrivers, setNearbyDrivers] = useState<MatchedDriver[]>([]);
  const [assignedDriver, setAssignedDriver] = useState<MatchedDriver | null>(null);
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);

  // Active Ride Data
  const [rideId, setRideId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string>('5829');
  const [inputOtp, setInputOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [cancellationFee, setCancellationFee] = useState<number>(0);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false);
  const [simulatedNetworkLoss, setSimulatedNetworkLoss] = useState<boolean>(false);

  // Mid-ride destination change modal state
  const [showChangeDropModal, setShowChangeDropModal] = useState<boolean>(false);
  const [newDropInput, setNewDropInput] = useState<string>('');
  const [newDropLocation, setNewDropLocation] = useState<NominatimLocation | null>(null);
  const [midRideNotification, setMidRideNotification] = useState<string | null>(null);

  // Live Trip Animation State
  const [tripProgress, setTripProgress] = useState<number>(0); // 0 to 1
  const [currentCarPos, setCurrentCarPos] = useState<[number, number] | null>(null);
  const [liveSpeed, setLiveSpeed] = useState<number>(45);

  // Payment & Rating
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [selectedTip, setSelectedTip] = useState<number>(30);
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);
  const [ratingCompleted, setRatingCompleted] = useState<boolean>(false);

  // General Loading & Notification
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Surge Multiplier Memo
  const surgeInfo = useMemo(() => getSurgeMultiplier(), []);

  // ─── Calculate Detailed Fare Breakdown ────────────────────────────────────
  const fareBreakdown: FareBreakdown = useMemo(() => {
    const cat = VEHICLE_CATEGORIES.find((c) => c.id === selectedCategory) || VEHICLE_CATEGORIES[1];
    const baseFare = cat.baseFare;
    const distFare = Math.round(distanceKm * cat.perKmRate);
    const timeFare = Math.round(durationMin * cat.perMinRate);
    const sub = baseFare + distFare + timeFare;
    const total = Math.round(sub * surgeInfo.multiplier * cat.multiplier);

    return {
      baseFare,
      distanceKm,
      distanceFare: distFare,
      durationMin,
      timeFare,
      surgeMultiplier: surgeInfo.multiplier,
      surgeReason: surgeInfo.reason,
      subtotal: sub,
      totalFare: total,
    };
  }, [selectedCategory, distanceKm, durationMin, surgeInfo]);

  // ─── Reverse Geocode Helper via Nominatim ─────────────────────────────────
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch {
      // Fallback
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // ─── Auto-detect Current Geolocation ──────────────────────────────────────
  const handleAutoDetectPickup = () => {
    if (!navigator.geolocation) {
      setApiError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setApiError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await reverseGeocode(lat, lng);

        const newLoc = { address, lat, lng };
        setPickup(newLoc);
        setPickupInput(address);
        setDetectingLocation(false);
      },
      (err) => {
        setDetectingLocation(false);
        setApiError('Unable to detect location. Please search address manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ─── Fetch Route from OSRM API ─────────────────────────────────────────────
  const calculateOSRMRoute = async (
    start: LocationItem,
    intermediateStops: LocationItem[],
    end: LocationItem
  ) => {
    setCalculatingRoute(true);
    try {
      const waypoints = [start, ...intermediateStops, end];
      const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distInKm = parseFloat((route.distance / 1000).toFixed(1));
          const durInMin = Math.round(route.duration / 60);
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] // Swap to [lat, lng] for Leaflet
          );

          setDistanceKm(distInKm > 0.5 ? distInKm : 5.2);
          setDurationMin(durInMin > 2 ? durInMin : 12);
          setRoutePoints(coords);
          setCalculatingRoute(false);
          return;
        }
      }
    } catch {
      // Fallback interpolation if OSRM is offline/blocked
    }

    // Straight-line fallback polyline points
    const waypoints = [start, ...intermediateStops, end];
    const fallbackCoords: [number, number][] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      for (let t = 0; t <= 10; t++) {
        fallbackCoords.push([
          p1.lat + (p2.lat - p1.lat) * (t / 10),
          p1.lng + (p2.lng - p1.lng) * (t / 10),
        ]);
      }
    }
    setRoutePoints(fallbackCoords);

    // Haversine formula approximation
    const dLat = (end.lat - start.lat) * (Math.PI / 180);
    const dLng = (end.lng - start.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start.lat * (Math.PI / 180)) *
        Math.cos(end.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const approxKm = parseFloat((6371 * c * 1.3).toFixed(1));

    setDistanceKm(approxKm > 1 ? approxKm : 8.4);
    setDurationMin(Math.round(approxKm * 2.2 + 5));
    setCalculatingRoute(false);
  };

  // Recalculate OSRM route whenever pickup, drop, or stops change
  useEffect(() => {
    calculateOSRMRoute(pickup, stops, drop);
  }, [pickup, drop, stops]);

  // ─── Multi-stop Controls ──────────────────────────────────────────────────
  const handleAddStop = () => {
    if (stops.length >= 2) return;
    setStops([
      ...stops,
      {
        address: 'Select Stop Location',
        lat: pickup.lat + 0.01 * (stops.length + 1),
        lng: pickup.lng + 0.01 * (stops.length + 1),
      },
    ]);
  };

  const handleRemoveStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleUpdateStop = (index: number, loc: NominatimLocation) => {
    const updated = [...stops];
    updated[index] = loc;
    setStops(updated);
  };

  // ─── Handle Map Pin Dragging / Map Clicks ─────────────────────────────────
  const handlePickupDragEnd = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    setPickup({ address, lat, lng });
    setPickupInput(address);
  };

  // ─── Driver Dispatch & Matching Flow ─────────────────────────────────────
  const handleProceedToVehicleSelection = () => {
    setRideState('VEHICLE_SELECTION');
  };

  const handleStartDriverSearch = async () => {
    setRideState('SEARCHING_DRIVER');
    setLoading(true);
    setApiError(null);

    try {
      // Query nearby drivers from backend API
      const res = await fetchAPI<{ drivers: MatchedDriver[] }>(
        `/api/rides/nearby-drivers?lat=${pickup.lat}&lng=${pickup.lng}&category=${selectedCategory}`
      );

      const fetchedDrivers = res.data?.drivers || [];
      setNearbyDrivers(fetchedDrivers);

      // Simulated dispatch delay (3.5 seconds) for realism
      setTimeout(async () => {
        setLoading(false);

        if (fetchedDrivers.length === 0) {
          setRideState('NO_DRIVER_AVAILABLE');
          return;
        }

        // Auto-assign nearest available driver
        const matched = fetchedDrivers[0];
        setAssignedDriver(matched);
        setDriverPos([matched.lat, matched.lng]);

        // Create ride entry in backend database
        try {
          const createRes = await fetchAPI<{ ride: any }>('/api/rides', {
            method: 'POST',
            body: {
              pickup,
              drop,
              stops,
              vehicleType: selectedCategory,
              fare: fareBreakdown.totalFare,
              fareBreakdown,
              driverId: matched.id,
              status: 'driver_assigned',
            },
          });

          if (createRes.data?.ride) {
            setRideId(createRes.data.ride._id || createRes.data.ride.id);
            if (createRes.data.ride.otp) {
              setOtpCode(createRes.data.ride.otp);
            }
          }
        } catch {
          // Fallback locally
          setRideId(`RIDE-${Math.floor(100000 + Math.random() * 900000)}`);
        }

        setRideState('DRIVER_ASSIGNED');

        // Transition to driver_arriving animation
        setTimeout(() => {
          setRideState('DRIVER_ARRIVING');
        }, 1500);
      }, 3500);
    } catch {
      setTimeout(() => {
        setLoading(false);
        setRideState('NO_DRIVER_AVAILABLE');
      }, 3000);
    }
  };

  // ─── Animated Driver Movement Towards Pickup ──────────────────────────────
  useEffect(() => {
    if (rideState !== 'DRIVER_ARRIVING' || !assignedDriver || !pickup) return;

    // Build line points from driver position to pickup location
    const startLat = assignedDriver.lat;
    const startLng = assignedDriver.lng;
    const endLat = pickup.lat;
    const endLng = pickup.lng;

    const lineCoords: [number, number][] = [];
    for (let i = 0; i <= 20; i++) {
      lineCoords.push([
        startLat + (endLat - startLat) * (i / 20),
        startLng + (endLng - startLng) * (i / 20),
      ]);
    }
    setDriverToPickupPoints(lineCoords);

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex <= 20) {
        const progress = stepIndex / 20;
        setDriverPos([
          startLat + (endLat - startLat) * progress,
          startLng + (endLng - startLng) * progress,
        ]);
      } else {
        clearInterval(interval);
        setRideState('DRIVER_ARRIVED');
        // Update backend status to driver_arrived
        if (rideId) {
          fetchAPI(`/api/rides/${rideId}/status`, {
            method: 'PATCH',
            body: { status: 'driver_arrived' },
          }).catch(() => {});
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [rideState, assignedDriver, pickup, rideId]);

  // ─── OTP Verification Handler ─────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!inputOtp || inputOtp.trim() !== otpCode) {
      setOtpError('Incorrect OTP. Please check the 4-digit code shown to driver.');
      return;
    }

    setOtpError('');
    setLoading(true);

    try {
      if (rideId) {
        await fetchAPI(`/api/rides/${rideId}/verify-otp`, {
          method: 'POST',
          body: { otp: inputOtp.trim() },
        });
      }
    } catch {
      // Continue locally for smooth MVP testing
    }

    setLoading(false);
    setRideState('IN_PROGRESS');
    setTripProgress(0);
  };

  // ─── Live Trip Moving Vehicle Animation along OSRM Polyline ───────────────
  useEffect(() => {
    if (rideState !== 'IN_PROGRESS' || routePoints.length === 0) return;

    const totalSteps = routePoints.length;
    let stepIdx = Math.floor(tripProgress * totalSteps);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < totalSteps) {
        const prog = stepIdx / (totalSteps - 1);
        setTripProgress(prog);
        setCurrentCarPos(routePoints[stepIdx]);
        setLiveSpeed(Math.floor(38 + Math.random() * 15));
      } else {
        clearInterval(interval);
        setTripProgress(1.0);
        setCurrentCarPos(routePoints[totalSteps - 1]);
        handleTriggerTripCompletion();
      }
    }, 800);

    return () => clearInterval(interval);
  }, [rideState, routePoints, tripProgress]);

  // ─── Handle Mid-ride Destination Change ───────────────────────────────────
  const handleChangeDestinationMidRide = async () => {
    if (!newDropLocation) return;

    setDrop(newDropLocation);
    setDropInput(newDropLocation.address);
    setShowChangeDropModal(false);

    // Recalculate route and updated fare
    await calculateOSRMRoute(pickup, stops, newDropLocation);
    setMidRideNotification(`Destination updated mid-ride! Fare recalculated based on new route.`);

    setTimeout(() => {
      setMidRideNotification(null);
    }, 5000);
  };

  // ─── Trigger Trip Completion ──────────────────────────────────────────────
  const handleTriggerTripCompletion = () => {
    setRideState('TRIP_PAYMENT');
    setShowPaymentModal(true);

    if (rideId) {
      fetchAPI(`/api/rides/${rideId}/status`, {
        method: 'PATCH',
        body: { status: 'completed' },
      }).catch(() => {});
    }
  };

  // ─── Cancellation Flow Handling ───────────────────────────────────────────
  const handleCancelRideRequest = () => {
    if (rideState === 'SEARCHING_DRIVER' || rideState === 'LOCATION_PICKER' || rideState === 'VEHICLE_SELECTION') {
      // Free cancellation
      resetEntireBooking();
    } else {
      // Apply ₹50 cancellation fee warning
      setCancellationFee(50);
      setShowCancelModal(true);
    }
  };

  const handleConfirmCancellation = async () => {
    setShowCancelModal(false);

    if (rideId) {
      try {
        await fetchAPI(`/api/rides/${rideId}/status`, {
          method: 'PATCH',
          body: { status: 'cancelled', cancellationFee: 50 },
        });
      } catch {}
    }

    resetEntireBooking();
  };

  // ─── Submit Driver Rating & Review ────────────────────────────────────────
  const handleSubmitRating = async () => {
    setSubmittingRating(true);

    try {
      if (rideId) {
        await fetchAPI(`/api/rides/${rideId}/rate`, {
          method: 'POST',
          body: {
            rating: ratingStars,
            comment: reviewComment,
            tip: selectedTip,
          },
        });
      }
    } catch {}

    setSubmittingRating(false);
    setRatingCompleted(true);
  };

  // ─── Reset Entire Flow ────────────────────────────────────────────────────
  const resetEntireBooking = () => {
    setRideState('LOCATION_PICKER');
    setRideId(null);
    setAssignedDriver(null);
    setDriverPos(null);
    setInputOtp('');
    setTripProgress(0);
    setCurrentCarPos(null);
    setShowPaymentModal(false);
    setRatingCompleted(false);
    setReviewComment('');
    setSelectedTip(30);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col relative overflow-hidden font-sans">
      {/* ─── TOP CONTROL / STATUS HEADER BAR ──────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/customer/dashboard"
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold tracking-tight flex items-center gap-2 text-white">
              <Car className="w-5 h-5 text-primary-400" /> Vito Cab Booking
            </h1>
            <p className="text-[11px] text-slate-400">Real-Time Autonomous Dispatch & Live Tracking</p>
          </div>
        </div>

        {/* Dynamic Status Pill */}
        <div className="flex items-center gap-2">
          {simulatedNetworkLoss && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" /> Reconnecting...
            </div>
          )}

          {/* Safety Center Quick Link Button - PERMANENTLY VISIBLE IN ACTIVE RIDES */}
          {['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(rideState) && (
            <button
              onClick={() => setShowSafetyModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all text-xs font-extrabold shadow-lg shadow-rose-500/20 animate-pulse"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Safety Center
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> {surgeInfo.reason.split(' ')[0]} {surgeInfo.multiplier}x
          </div>
        </div>
      </header>

      {/* ─── MID-RIDE NOTIFICATION BANNER ─────────────────────────────────── */}
      {midRideNotification && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-2.5 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {midRideNotification}
        </div>
      )}

      {/* ─── MAIN TWO-COLUMN LAYOUT (MAP + INTERACTIVE PANEL) ─────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 relative min-h-[calc(100vh-60px)]">
        
        {/* ─── LEFT SIDE: INTERACTIVE STEP PANELS (5 Cols on Large) ───────── */}
        <div className="lg:col-span-5 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#0B0F19]/95 border-r border-white/[0.08] flex flex-col justify-between z-10">
          
          {/* STEP 1: LOCATION INPUT & MULTI-STOP ───────────────────────────── */}
          {rideState === 'LOCATION_PICKER' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-primary-400 uppercase">Step 1 of 4</span>
                <h2 className="text-xl font-extrabold text-white mt-0.5">Where are you heading?</h2>
                <p className="text-xs text-slate-400">Set pickup and drop points or drag pin on map.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3.5 shadow-lg">
                
                {/* Pickup Autocomplete */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Pickup Location
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectPickup}
                      disabled={detectingLocation}
                      className="text-[11px] text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      {detectingLocation ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3 h-3" /> Auto-Detect
                        </>
                      )}
                    </button>
                  </div>

                  <AddressAutocomplete
                    value={pickupInput}
                    onChange={setPickupInput}
                    onSelectLocation={(loc) => {
                      setPickup(loc);
                      setPickupInput(loc.address);
                    }}
                    placeholder="Enter pickup address..."
                    icon={<MapPin className="w-4 h-4 text-emerald-400" />}
                  />
                </div>

                {/* Multi-Stops (Optional max 2) */}
                {stops.map((stop, idx) => (
                  <div key={idx} className="relative pl-3 border-l-2 border-amber-500/50 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        Stop {idx + 1} (Multi-Stop Ride)
                      </label>
                      <button
                        onClick={() => handleRemoveStop(idx)}
                        className="text-slate-400 hover:text-rose-400 text-xs transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <AddressAutocomplete
                      value={stop.address}
                      onChange={(val) => {
                        const updated = [...stops];
                        updated[idx].address = val;
                        setStops(updated);
                      }}
                      onSelectLocation={(loc) => handleUpdateStop(idx, loc)}
                      placeholder={`Enter Stop ${idx + 1} address...`}
                      icon={<MapPin className="w-4 h-4 text-amber-400" />}
                    />
                  </div>
                ))}

                {/* Add Stop Button */}
                {stops.length < 2 && (
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] border-dashed text-xs text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary-400" /> Add Intermediate Stop (Max 2)
                  </button>
                )}

                {/* Destination Drop Autocomplete */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Destination Drop
                  </label>

                  <AddressAutocomplete
                    value={dropInput}
                    onChange={setDropInput}
                    onSelectLocation={(loc) => {
                      setDrop(loc);
                      setDropInput(loc.address);
                    }}
                    placeholder="Where to? (Enter drop location)..."
                    icon={<MapPin className="w-4 h-4 text-rose-400" />}
                  />
                </div>
              </div>

              {/* Route Summary Card */}
              <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary-400" /> Estimated Duration
                  </span>
                  <span className="font-bold text-white">{durationMin} mins</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-primary-400" /> Total Route Distance
                  </span>
                  <span className="font-bold text-white">{distanceKm} km</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-white/[0.06]">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Time of Day Surge
                  </span>
                  <span className="font-extrabold text-amber-300">{surgeInfo.multiplier}x Surge</span>
                </div>
              </div>

              {apiError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {apiError}
                </div>
              )}

              <button
                onClick={handleProceedToVehicleSelection}
                disabled={calculatingRoute}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-bold text-sm shadow-xl shadow-primary-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {calculatingRoute ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Calculating Best Route...
                  </>
                ) : (
                  <>
                    Select Vehicle Category <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: VEHICLE CATEGORY SELECTION & FARE BREAKDOWN ───────────── */}
          {rideState === 'VEHICLE_SELECTION' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-primary-400 uppercase">Step 2 of 4</span>
                  <h2 className="text-xl font-extrabold text-white mt-0.5">Choose your vehicle</h2>
                </div>
                <button
                  onClick={() => setRideState('LOCATION_PICKER')}
                  className="text-xs text-primary-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Locations
                </button>
              </div>

              {/* Vehicle Options List */}
              <div className="space-y-2.5">
                {VEHICLE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const catFare = Math.round(
                    (cat.baseFare + distanceKm * cat.perKmRate + durationMin * cat.perMinRate) *
                      surgeInfo.multiplier *
                      cat.multiplier
                  );

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-primary-500/15 border-primary-500/50 shadow-lg shadow-primary-500/10'
                          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.18]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="text-3xl bg-white/[0.06] p-2.5 rounded-xl">{cat.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-white">{cat.name}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 font-semibold">
                              👤 {cat.capacity} seats
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>
                          <span className="text-[11px] text-emerald-400 font-bold mt-1 block">
                            ETA: {cat.eta} away
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-white">₹{catFare}</div>
                        <span className="text-[10px] text-slate-400">Guaranteed fare</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DETAILED FARE BREAKDOWN CARD (Real-World Trust Builder) ──── */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary-400" /> Upfront Fare Breakdown
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-bold">No Hidden Charges</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Booking Fare</span>
                    <span className="font-semibold text-slate-200">₹{fareBreakdown.baseFare}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>
                      Distance ({fareBreakdown.distanceKm} km × ₹
                      {VEHICLE_CATEGORIES.find((c) => c.id === selectedCategory)?.perKmRate}/km)
                    </span>
                    <span className="font-semibold text-slate-200">₹{fareBreakdown.distanceFare}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>
                      Estimated Time ({fareBreakdown.durationMin} min × ₹
                      {VEHICLE_CATEGORIES.find((c) => c.id === selectedCategory)?.perMinRate}/min)
                    </span>
                    <span className="font-semibold text-slate-200">₹{fareBreakdown.timeFare}</span>
                  </div>

                  {surgeInfo.multiplier > 1.0 && (
                    <div className="flex justify-between text-amber-400 pt-1">
                      <span>Demand Surge Multiplier</span>
                      <span className="font-bold">{surgeInfo.multiplier}x</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-black text-white pt-2 border-t border-white/[0.08]">
                    <span>Total Upfront Estimate</span>
                    <span className="text-xl text-primary-300">₹{fareBreakdown.totalFare}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRideState('LOCATION_PICKER')}
                  className="w-1/3 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleStartDriverSearch}
                  className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  Confirm & Search Driver <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SEARCHING & MATCHING DRIVER (Loading State) ─────────────── */}
          {rideState === 'SEARCHING_DRIVER' && (
            <div className="space-y-6 text-center py-8 animate-in fade-in duration-200">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-2xl animate-pulse">
                  🚕
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">Finding your driver...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Matching with nearest online {selectedCategory} driver within 5km radius...
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs text-left max-w-xs mx-auto">
                <div className="flex justify-between text-slate-400">
                  <span>Pickup Location</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[140px]">{pickup.address}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vehicle Type</span>
                  <span className="font-semibold text-primary-300">{selectedCategory}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Agreed Fare</span>
                  <span className="font-extrabold text-emerald-400">₹{fareBreakdown.totalFare}</span>
                </div>
              </div>

              <button
                onClick={handleCancelRideRequest}
                className="px-6 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-rose-400 border border-rose-500/30 transition-all"
              >
                Cancel Search (Free)
              </button>
            </div>
          )}

          {/* EDGE CASE: NO DRIVERS AVAILABLE ────────────────────────────────── */}
          {rideState === 'NO_DRIVER_AVAILABLE' && (
            <div className="space-y-5 text-center py-6 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">No Drivers Nearby</h3>
                <p className="text-xs text-slate-400 mt-1">
                  High demand in your area. No online {selectedCategory} drivers found within 5km right now.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleStartDriverSearch}
                  className="w-full py-3.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Retry Matching
                </button>
                <button
                  onClick={() => setRideState('VEHICLE_SELECTION')}
                  className="w-full py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-xs transition-all"
                >
                  Try Different Vehicle Category
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DRIVER ASSIGNED & ARRIVING SCREEN ─────────────────────── */}
          {['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED'].includes(rideState) && assignedDriver && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Status Header */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    {rideState === 'DRIVER_ARRIVED' ? '📍 Driver Has Arrived!' : '🚕 Driver En Route'}
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    {rideState === 'DRIVER_ARRIVED' ? 'Share OTP to start trip' : `Arriving in ${assignedDriver.eta}`}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-extrabold text-sm">
                  {assignedDriver.eta}
                </div>
              </div>

              {/* Driver Profile Card */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                      {assignedDriver.avatar}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
                        {assignedDriver.name}
                        <span className="text-xs text-amber-400 font-bold flex items-center">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                          {assignedDriver.rating}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">{assignedDriver.vehicleModel}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold bg-white/[0.08] px-2.5 py-1 rounded-lg text-slate-200 border border-white/[0.1]">
                      {assignedDriver.vehicleNo}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-1">Verified Driver</span>
                  </div>
                </div>

                {/* Call & Message Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => setShowCallModal(true)}
                    className="py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Call Driver
                  </button>
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-primary-400" /> Message
                  </button>
                </div>
              </div>

              {/* OTP VERIFICATION CARD (Triggered on Driver Arrived or Ready) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-500/15 to-indigo-500/10 border border-primary-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-primary-300 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-400" /> 4-Digit Pickup Verification OTP
                  </span>
                  <div className="text-2xl font-mono font-black text-amber-400 tracking-widest bg-black/40 px-3 py-1 rounded-lg border border-amber-500/30">
                    {otpCode}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Provide this code to your driver upon entering the vehicle to start your ride.
                </p>

                {/* Simulated Driver OTP Entry Input (For Testing / MVP) */}
                <div className="pt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={inputOtp}
                      onChange={(e) => setInputOtp(e.target.value)}
                      placeholder="Enter 4-digit OTP code..."
                      className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-center font-mono font-bold text-sm tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500"
                    />
                    <button
                      onClick={handleVerifyOTP}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-all shadow-md active:scale-95"
                    >
                      Verify OTP
                    </button>
                  </div>
                  {otpError && <p className="text-[11px] text-rose-400 font-medium">{otpError}</p>}
                </div>
              </div>

              {/* Cancel Button with Fee Warning */}
              <button
                onClick={handleCancelRideRequest}
                className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 transition-all"
              >
                Cancel Ride
              </button>
            </div>
          )}

          {/* STEP 5: LIVE TRIP SCREEN (En Route to Destination) ─────────────── */}
          {rideState === 'IN_PROGRESS' && assignedDriver && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                    🚘 Live Trip In Progress
                  </span>
                  <h3 className="text-lg font-extrabold text-white">Heading to Destination</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Current Speed</span>
                  <span className="text-lg font-mono font-black text-emerald-400">{liveSpeed} km/h</span>
                </div>
              </div>

              {/* Route Progress Bar */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Trip Progress</span>
                  <span className="font-extrabold text-primary-300">{Math.round(tripProgress * 100)}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/[0.08] overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.max(5, tripProgress * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span className="truncate max-w-[120px]">{pickup.address}</span>
                  <span className="truncate max-w-[120px] text-right">{drop.address}</span>
                </div>
              </div>

              {/* Driver & Active Fare Card */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-300 font-bold flex items-center justify-center">
                    {assignedDriver.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{assignedDriver.name}</h4>
                    <p className="text-xs text-slate-400">{assignedDriver.vehicleModel}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Estimated Fare</span>
                  <span className="text-base font-black text-emerald-400">₹{fareBreakdown.totalFare}</span>
                </div>
              </div>

              {/* Actions: Change Destination & Complete Trip Trigger */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowChangeDropModal(true)}
                  className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary-400" /> Change Destination Mid-Trip
                </button>

                <button
                  onClick={handleTriggerTripCompletion}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
                >
                  Arrived at Destination (Complete Trip)
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 & 7: TRIP COMPLETED & RATING SCREEN ─────────────────────── */}
          {(rideState === 'TRIP_PAYMENT' || rideState === 'RATING_REVIEW') && assignedDriver && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {!ratingCompleted ? (
                <>
                  <div className="text-center py-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-2xl mb-2">
                      🏁
                    </div>
                    <h3 className="text-xl font-extrabold text-white">Trip Completed!</h3>
                    <p className="text-xs text-slate-400 mt-0.5">How was your ride with {assignedDriver.name}?</p>
                  </div>

                  {/* Star Rating Picker */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Rate Your Driver
                    </span>

                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingStars(star)}
                          className="p-2 transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= ratingStars
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write optional review feedback..."
                      rows={2}
                      className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  {/* Driver Tip Options */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Add Driver Tip (Optional)
                    </span>

                    <div className="grid grid-cols-4 gap-2">
                      {[0, 20, 50, 100].map((tip) => (
                        <button
                          key={tip}
                          type="button"
                          onClick={() => setSelectedTip(tip)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                            selectedTip === tip
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                          }`}
                        >
                          {tip === 0 ? 'No Tip' : `₹${tip}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitRating}
                    disabled={submittingRating}
                    className="w-full py-3.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-bold text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingRating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      'Submit Driver Rating & Complete'
                    )}
                  </button>
                </>
              ) : (
                /* Rating Submitted Receipt Summary */
                <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-white">Thank You for Riding!</h3>
                    <p className="text-xs text-slate-400 mt-1">Your rating and tip have been credited to driver.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left text-xs space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Base Trip Fare</span>
                      <span className="font-semibold text-white">₹{fareBreakdown.totalFare}</span>
                    </div>
                    {selectedTip > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Driver Tip</span>
                        <span className="font-bold">+₹{selectedTip}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-white/[0.06]">
                      <span>Driver Rating</span>
                      <span className="font-bold text-amber-400">★ {ratingStars} / 5</span>
                    </div>
                  </div>

                  <button
                    onClick={resetEntireBooking}
                    className="w-full py-3.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-bold text-xs transition-all shadow-lg active:scale-95"
                  >
                    Book Another Ride
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ─── RIGHT SIDE: LIVE MAP CANVAS (7 Cols on Large) ────────────────── */}
        <div className="lg:col-span-7 h-[420px] lg:h-full w-full relative min-h-[400px]">
          <CabMap
            center={[pickup.lat, pickup.lng]}
            pickup={pickup}
            drop={drop}
            stops={stops}
            drivers={nearbyDrivers}
            selectedDriverId={assignedDriver?.id || null}
            assignedDriverPos={driverPos}
            onPickupDragEnd={handlePickupDragEnd}
            routePoints={routePoints}
            driverToPickupPoints={driverToPickupPoints}
            currentCarPos={currentCarPos}
            isLiveTrip={rideState === 'IN_PROGRESS'}
          />

          {/* Floating Controls Overlay */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => setSimulatedNetworkLoss(!simulatedNetworkLoss)}
              className="p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs text-slate-300 hover:text-white transition-all shadow-lg flex items-center gap-1.5"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              {simulatedNetworkLoss ? 'Restore Network' : 'Simulate Offline'}
            </button>
          </div>
        </div>

      </div>

      {/* ─── MODAL 1: CANCELLATION CONFIRMATION WITH FEE WARNING ──────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-rose-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-extrabold text-white">Cancellation Fee Warning</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Driver has already been dispatched and is en route to your pickup location. Cancelling now will incur a
              transparent cancellation fee of <strong className="text-amber-400">₹50</strong> to compensate driver's
              fuel and time.
            </p>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              Cancellation Fee: <strong>₹50.00</strong>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-1/2 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-200 transition-all"
              >
                Keep Ride
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="w-1/2 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-xs font-bold text-white transition-all shadow-md active:scale-95"
              >
                Confirm Cancel (₹50 Fee)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SAFETY CENTER OVERLAY ────────────────────────────────── */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowSafetyModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Vito 24/7 Safety Center</h3>
                <p className="text-xs text-slate-400">Active ride protection and emergency SOS</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  alert('SOS Alert triggered! Vito Safety Team & local authorities notified.');
                  setShowSafetyModal(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-sm flex items-center justify-between shadow-lg shadow-rose-600/30 active:scale-95"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" /> Trigger Emergency SOS Alert
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <Link
                href="/customer/safety"
                onClick={() => setShowSafetyModal(false)}
                className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 font-bold flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-400" /> Share Live Trip Tracking Link
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: CALL DRIVER PLACEHOLDER ─────────────────────────────── */}
      {showCallModal && assignedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
              <Phone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Call {assignedDriver.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">{assignedDriver.phone}</p>
            </div>
            <p className="text-[11px] text-slate-500">Number masked for privacy protection</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCallModal(false)}
                className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: MESSAGE DRIVER PLACEHOLDER ──────────────────────────── */}
      {showMessageModal && assignedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-400" /> Chat with {assignedDriver.name}
              </h3>
              <button onClick={() => setShowMessageModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-32 rounded-xl bg-black/40 border border-white/10 p-3 overflow-y-auto space-y-2 text-xs">
              <div className="bg-primary-500/20 text-primary-200 p-2 rounded-lg w-fit max-w-[80%]">
                Hi driver, I am waiting at the pickup spot.
              </div>
              <div className="bg-white/10 text-slate-200 p-2 rounded-lg w-fit max-w-[80%] ml-auto text-right">
                Understood! Reaching in 2 minutes.
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white"
              />
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-3 py-2 rounded-xl bg-primary-500 text-white font-bold text-xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: MID-RIDE DESTINATION CHANGE ────────────────────────── */}
      {showChangeDropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 relative">
            <button
              onClick={() => setShowChangeDropModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary-400" /> Change Destination Mid-Ride
            </h3>
            <p className="text-xs text-slate-400">
              Enter your new destination address. Route and total fare will be updated automatically.
            </p>

            <AddressAutocomplete
              value={newDropInput}
              onChange={setNewDropInput}
              onSelectLocation={(loc) => setNewDropLocation(loc)}
              placeholder="Search new destination..."
              icon={<MapPin className="w-4 h-4 text-rose-400" />}
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowChangeDropModal(false)}
                className="w-1/2 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeDestinationMidRide}
                disabled={!newDropLocation}
                className="w-1/2 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-xs font-bold text-white shadow-md disabled:opacity-50"
              >
                Update Destination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: MOCK PAYMENT MODAL INTEGRATION ──────────────────────── */}
      <MockPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setRideState('RATING_REVIEW');
        }}
        bookingId={rideId || `RIDE-${Math.floor(100000 + Math.random() * 900000)}`}
        bookingType="cab"
        totalFare={fareBreakdown.totalFare}
        itemDescription={`Vito Cab Booking - ${selectedCategory}`}
        driverId={assignedDriver?.id}
        onPaymentSuccess={() => {
          setShowPaymentModal(false);
          setRideState('RATING_REVIEW');
        }}
      />

    </div>
  );
}
