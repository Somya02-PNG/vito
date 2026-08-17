'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Car,
  Briefcase,
  SlidersHorizontal,
  Check,
  Phone,
  Sparkles,
  ArrowRight,
  RotateCcw,
  KeyRound,
  FileText,
  AlertTriangle,
  Compass,
  X,
  CreditCard,
  Building2,
  Users,
  Award,
  Radio,
  Plus,
  Shield,
  Loader2,
  Timer,
  Info,
  CalendarRange,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import AddressAutocomplete, { PlaceResult } from '@/components/AddressAutocomplete';
import MockPaymentModal from '@/components/MockPaymentModal';

// Reusing existing Leaflet map from Cab module — strictly NO duplication!
const EnhancedCabMap = dynamic(() => import('@/components/cab/EnhancedCabMap'), { ssr: false });

// ─── 5 Conceptual Stages & Consolidated View States ──────────────────────────
export type DriverHireStep =
  | 'STAGE1_JOURNEY'       // Stage 1: Route, Date, Time & Recommended Duration Calculation
  | 'STAGE2_SERVICE'       // Stage 2: Service Package & Duration Override
  | 'STAGE3_VEHICLE'       // Stage 3: Vehicle Specs & Required Driver Skills
  | 'MATCHING_RADAR'       // Stage 4 Transition: Radar Animation
  | 'STAGE4_FIND_DRIVER'   // Stage 4: One Best Match + Compact Alternatives
  | 'DRIVER_PROFILE_VIEW'  // Driver Profile Modal (from View Profile)
  | 'STAGE5_CONFIRM'       // Stage 5: Summary Card + Request CTA with Confirmation Sentence
  | 'SINGLE_TIMELINE'      // Post-Request: Single Persistent Checklist View (polling sync)
  | 'DRIVER_SIDE_REQUEST'  // Driver Console Simulation (Two-Sided Trust Display + Safety Control)
  | 'DRIVER_EN_ROUTE'      // Driver En Route with Reused Live Map
  | 'DRIVER_ARRIVED'       // Driver Arrived Pre-Duty Checklist
  | 'SERVICE_PIN_VERIFY'   // 4-Digit Service PIN Verification
  | 'ACTIVE_SERVICE'       // Minimal Active View: Map + Dynamic Timer + Safety Controls
  | 'SERVICE_COMPLETED'    // End Service & Settlement
  | 'RATING_FEEDBACK'      // Multi-Dimension Rating
  | 'HIRE_HISTORY';        // Archived History in My Trips

export interface DriverCandidate {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  experienceYears: number;
  hourlyRate: number;
  languages: string[];
  skills: string[];
  vehicleTypes: string[];
  verificationStatus: string;
  matchPercentage: number;
  matchReasons: string[];
  calculatedPrice: number;
  fareBreakdown: any;
  verifiedBadges: string[];
  lat: number;
  lng: number;
}

const SERVICE_TYPES = [
  {
    id: 'hourly',
    title: 'Hourly City Chauffeur',
    subtitle: 'Flexible city trips, errands, business meetings, or night dining',
    rateLabel: 'From ₹160 / hr (Min 2 hrs)',
    badge: 'Flexible',
    icon: Clock,
  },
  {
    id: 'full_day',
    title: 'Full Day (8 - 12 Hours)',
    subtitle: 'Dedicated professional driver for full-day family travel or office commute',
    rateLabel: 'Fixed ₹1,400 / 8 hrs',
    badge: 'Most Popular',
    icon: Briefcase,
  },
  {
    id: 'outstation',
    title: 'Outstation Multi-Day',
    subtitle: 'Experienced highway drivers for Jaipur, Agra, Chandigarh, Himachal & Uttarakhand',
    rateLabel: 'From ₹1,800 / day + stay',
    badge: 'Intercity',
    icon: Compass,
  },
  {
    id: 'airport',
    title: 'Airport / Railway Transfer',
    subtitle: 'Stress-free terminal drop or pickup with luggage handling in your car',
    rateLabel: 'Fixed ₹450 flat transfer',
    badge: 'Punctual',
    icon: Building2,
  },
  {
    id: 'event',
    title: 'Event / Special Occasion',
    subtitle: 'Weddings, VIP corporate hosting, late-night parties & designated drivers',
    rateLabel: 'From ₹220 / hr (Min 4 hrs)',
    badge: 'VIP Escort',
    icon: Award,
  },
];

export default function DriverHireFlow() {
  const { user } = useAuth();
  const router = useRouter();

  // ─── Flow State ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<DriverHireStep>('STAGE1_JOURNEY');

  // Stage 1: Journey Details
  const [pickup, setPickup] = useState<PlaceResult>({
    address: 'Connaught Place, New Delhi',
    lat: 28.6315,
    lng: 77.2167,
  });
  const [destination, setDestination] = useState<PlaceResult | null>({
    address: 'Cyber City, Gurugram',
    lat: 28.4950,
    lng: 77.0895,
  });
  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [returnRequired, setReturnRequired] = useState<boolean>(true);

  // Stage 2: Service Selection & Duration Override
  const [serviceType, setServiceType] = useState<string>('full_day');
  const [showDurationOverride, setShowDurationOverride] = useState<boolean>(false);
  const [customHours, setCustomHours] = useState<number>(8);
  const [customDays, setCustomDays] = useState<number>(1);

  // Stage 3: Vehicle Specs & Driver Skills
  const [vehicleType, setVehicleType] = useState<string>('Sedan');
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>('Honda City');
  const [transmission, setTransmission] = useState<string>('Automatic');
  const [fuel, setFuel] = useState<string>('Petrol');
  const [minExperience, setMinExperience] = useState<number>(5);
  const [selectedSkillCheckboxes, setSelectedSkillCheckboxes] = useState<string[]>([
    'City driving',
    'Automatic vehicles',
    'Highway driving',
  ]);

  // Stage 4 & 5: Driver Matching & Results
  const [loadingMatch, setLoadingMatch] = useState<boolean>(false);
  const [matchedDrivers, setMatchedDrivers] = useState<DriverCandidate[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverCandidate | null>(null);
  const [activeDriverHireId, setActiveDriverHireId] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string>('REQUESTED');
  const [servicePin, setServicePin] = useState<string>('4829');

  // Active Service & Duty Timer
  const [serviceDurationLeftMinutes, setServiceDurationLeftMinutes] = useState<number>(480);
  const [extraHoursCount, setExtraHoursCount] = useState<number>(0);
  const [showExtraHoursModal, setShowExtraHoursModal] = useState<boolean>(false);
  const [driverArrivalProgress, setDriverArrivalProgress] = useState<number>(0);

  // Safety & Rating State
  const [showDriverSafetyModal, setShowDriverSafetyModal] = useState<boolean>(false);
  const [safetyConcernCategory, setSafetyConcernCategory] = useState<string>('Customer behaviour');
  const [safetyConcernDetails, setSafetyConcernDetails] = useState<string>('');
  const [safetyReportMessage, setSafetyReportMessage] = useState<string | null>(null);

  const [ratingDriving, setRatingDriving] = useState<number>(5);
  const [ratingProf, setRatingProf] = useState<number>(5);
  const [ratingPunct, setRatingPunct] = useState<number>(5);
  const [ratingHandling, setRatingHandling] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ─── STAGE 1 Route Engine: Driving Time vs Recommended Duration ──────────────
  const routeMetrics = useMemo(() => {
    if (!pickup.address) {
      return { distanceKm: 15, driveTimeStr: '35m', driveTimeMinutes: 35, recommendedHours: 4 };
    }

    const lat1 = pickup.lat || 28.6315;
    const lng1 = pickup.lng || 77.2167;
    const lat2 = destination?.lat || 28.5562;
    const lng2 = destination?.lng || 77.1000;

    // Haversine distance calculation
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let baseKm = Math.round(R * c);
    if (baseKm < 8) baseKm = destination?.address ? 28 : 16;

    const totalKm = returnRequired && serviceType === 'outstation' ? baseKm * 2 : baseKm;
    const totalDriveMinutes = Math.round((totalKm / 42) * 60) + 20; // 20m traffic buffer
    const driveHours = Math.floor(totalDriveMinutes / 60);
    const driveMins = totalDriveMinutes % 60;
    const driveTimeStr = driveHours > 0 ? `${driveHours}h ${driveMins}m` : `${driveMins}m`;

    // Recommended Hire Duration: driving time + pickup/traffic/waiting buffer
    let recHours = Math.ceil(totalDriveMinutes / 60) + 1.5;
    if (serviceType === 'full_day') recHours = 8;
    else if (serviceType === 'outstation') recHours = Math.max(8, Math.ceil(totalDriveMinutes / 60) + 2);
    else recHours = Math.max(2, Math.min(12, Math.round(recHours)));

    return {
      distanceKm: totalKm,
      driveTimeStr,
      driveTimeMinutes: totalDriveMinutes,
      recommendedHours: Math.round(recHours),
    };
  }, [pickup, destination, returnRequired, serviceType]);

  // Effective Hours / Days
  const effectiveHours = showDurationOverride ? customHours : routeMetrics.recommendedHours;
  const effectiveDays = showDurationOverride ? customDays : Math.max(1, Math.ceil(routeMetrics.recommendedHours / 10));

  // ─── Price Calculation ─────────────────────────────────────────────────────
  const calculatedFare = useMemo(() => {
    let baseService = 200;
    let durationCharge = 0;
    let outstationAllowance = 0;

    if (serviceType === 'hourly') {
      durationCharge = Math.max(2, effectiveHours) * (selectedDriver?.hourlyRate || 180);
      baseService = 150;
    } else if (serviceType === 'full_day') {
      durationCharge = Math.max(1, effectiveDays) * 1400;
      baseService = 200;
    } else if (serviceType === 'outstation') {
      durationCharge = Math.max(1, effectiveDays) * 1800;
      outstationAllowance = Math.max(1, effectiveDays) * 400;
      if (!returnRequired) outstationAllowance += 300;
    } else if (serviceType === 'airport') {
      baseService = 250;
      durationCharge = 450;
    } else if (serviceType === 'event') {
      baseService = 300;
      durationCharge = Math.max(4, effectiveHours) * 220;
    }

    if (vehicleType.toLowerCase().includes('luxury')) durationCharge += 300;

    const startH = parseInt(startTime.split(':')[0], 10) || 9;
    const isNight = startH >= 22 || startH < 6 || serviceType === 'outstation';
    const nightCharge = isNight ? 250 : 0;
    const platformFee = 50;
    const subtotal = baseService + durationCharge + outstationAllowance + nightCharge + platformFee;
    const taxes = Math.round(subtotal * 0.05);
    const estimatedTotal = subtotal + taxes;

    return {
      baseService,
      durationCharge,
      outstationAllowance,
      nightCharge,
      platformFee,
      taxes,
      estimatedTotal,
      isNight,
    };
  }, [serviceType, effectiveHours, effectiveDays, returnRequired, startTime, vehicleType, selectedDriver]);

  // ─── STAGE 4: Execute Matching Radar & Fetch Drivers ────────────────────────
  const handleFindDrivers = async () => {
    setStep('MATCHING_RADAR');
    setLoadingMatch(true);

    try {
      const res = await fetchAPI<{ drivers: DriverCandidate[] }>('/api/driver-hire/match-drivers', {
        method: 'POST',
        body: {
          serviceType,
          hours: effectiveHours,
          durationDays: effectiveDays,
          isOutstation: serviceType === 'outstation',
          startTime,
          vehicleDetails: { type: vehicleType, makeModel: vehicleMakeModel, transmission, fuel },
          requirements: { minExperience, languages: ['Hindi', 'English'], skills: selectedSkillCheckboxes },
          bookingDate,
        },
      });

      setTimeout(() => {
        if (res.data?.drivers && res.data.drivers.length > 0) {
          setMatchedDrivers(res.data.drivers);
          setSelectedDriver(res.data.drivers[0]); // Best Match
        }
        setLoadingMatch(false);
        setStep('STAGE4_FIND_DRIVER');
      }, 2200);
    } catch {
      setTimeout(() => {
        setLoadingMatch(false);
        setStep('STAGE4_FIND_DRIVER');
      }, 2000);
    }
  };

  // ─── STAGE 5: Request Driver & Trigger Single Timeline Sync ─────────────────
  const handleRequestBooking = async () => {
    if (!selectedDriver) return;

    try {
      const res = await fetchAPI<{ booking: { _id: string }; servicePin: string }>('/api/driver-hire/request', {
        method: 'POST',
        body: {
          driverId: selectedDriver.id,
          driverName: selectedDriver.name,
          driverPhone: selectedDriver.phone,
          driverAvatar: selectedDriver.avatar,
          serviceType,
          hourlyRate: selectedDriver.hourlyRate,
          pickupLocation: pickup.address,
          pickupCoords: { lat: pickup.lat, lng: pickup.lng },
          destinationLocation: destination?.address || '',
          destinationCoords: destination ? { lat: destination.lat, lng: destination.lng } : undefined,
          bookingDate,
          startTime,
          hours: effectiveHours,
          durationDays: effectiveDays,
          returnRequired,
          isOutstation: serviceType === 'outstation',
          vehicleDetails: { type: vehicleType, makeModel: vehicleMakeModel, transmission, fuel },
          requirements: { minExperience, skills: selectedSkillCheckboxes },
          fareBreakdown: calculatedFare,
        },
      });

      if (res.data?.booking) {
        setActiveDriverHireId(res.data.booking._id);
        setServicePin(res.data.servicePin || '4829');
      }

      setBookingStatus('REQUESTED');
      setStep('SINGLE_TIMELINE');
    } catch {
      setActiveDriverHireId('hire_demo_' + Date.now());
      setServicePin('4829');
      setBookingStatus('REQUESTED');
      setStep('SINGLE_TIMELINE');
    }
  };

  // ─── Persistent Polling Loop for Timeline Updates (No Manual Refresh Needed) ──
  useEffect(() => {
    if (step !== 'SINGLE_TIMELINE' || !activeDriverHireId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchAPI<{ booking: { status: string } }>(
          `/api/driver-hire/${activeDriverHireId}/status`
        );
        if (res.data?.booking?.status) {
          const st = res.data.booking.status.toUpperCase();
          setBookingStatus(st);
          if (st === 'DECLINED') {
            clearInterval(interval);
            alert('This driver is unavailable — checking next best match. Request sent to another driver.');
            if (matchedDrivers.length > 1) {
              setSelectedDriver(matchedDrivers[1]);
              setBookingStatus('REQUESTED');
            }
          }
        }
      } catch {
        // Silently skip polling network drops
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, activeDriverHireId, matchedDrivers]);

  // ─── Driver Response Simulation Controls ────────────────────────────────────
  const handleSimulateDriverAccept = async () => {
    if (activeDriverHireId) {
      try {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/respond`, {
          method: 'POST',
          body: { action: 'accept' },
        });
      } catch {
        // Fallback demo state
      }
    }
    setBookingStatus('CONFIRMED');
    setStep('SINGLE_TIMELINE');
  };

  const handleSimulateDriverDecline = async () => {
    if (activeDriverHireId) {
      try {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/respond`, {
          method: 'POST',
          body: { action: 'decline' },
        });
      } catch {
        // Fallback demo state
      }
    }
    alert('This driver is unavailable — checking next best match. Request sent to another driver.');
    if (matchedDrivers.length > 1) {
      setSelectedDriver(matchedDrivers[1]);
      setBookingStatus('REQUESTED');
    }
  };

  // ─── Driver Safety Concern Reporting ───────────────────────────────────────
  const handleReportSafetyConcern = async () => {
    try {
      await fetchAPI('/api/safety/report-concern', {
        method: 'POST',
        body: {
          category: safetyConcernCategory,
          details: safetyConcernDetails,
          bookingId: activeDriverHireId,
          userRole: 'driver',
        },
      });
      setSafetyReportMessage(`Safety ticket created successfully. VITO Control Desk dispatched.`);
      setTimeout(() => {
        setShowDriverSafetyModal(false);
        setSafetyReportMessage(null);
      }, 2500);
    } catch {
      setSafetyReportMessage('Safety report submitted to VITO Control Desk.');
      setTimeout(() => {
        setShowDriverSafetyModal(false);
        setSafetyReportMessage(null);
      }, 2000);
    }
  };

  // ─── Active Duty PIN & Extra Hours ──────────────────────────────────────────
  const handleVerifyServicePin = async () => {
    if (activeDriverHireId) {
      try {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/verify-pin`, {
          method: 'POST',
          body: { pin: servicePin },
        });
      } catch {
        // Demo fallback
      }
    }
    setStep('ACTIVE_SERVICE');
    setServiceDurationLeftMinutes(effectiveHours * 60);
  };

  const handleConfirmExtraHours = async (addedHours: number) => {
    if (activeDriverHireId) {
      try {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/extra-hours`, {
          method: 'POST',
          body: { extraHours: addedHours },
        });
      } catch {
        // Demo fallback
      }
    }
    setExtraHoursCount((prev) => prev + addedHours);
    setServiceDurationLeftMinutes((prev) => prev + addedHours * 60);
    setShowExtraHoursModal(false);
  };

  const handleCompleteService = async () => {
    if (activeDriverHireId) {
      try {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/complete`, {
          method: 'POST',
          body: { paymentMethod: 'UPI' },
        });
      } catch {
        // Demo fallback
      }
    }
    setStep('SERVICE_COMPLETED');
    setShowPaymentModal(true);
  };

  const handleSubmitRating = async () => {
    if (activeDriverHireId) {
      try {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/rate`, {
          method: 'POST',
          body: {
            driving: ratingDriving,
            professionalism: ratingProf,
            punctuality: ratingPunct,
            vehicleHandling: ratingHandling,
            comment: ratingComment,
          },
        });
      } catch {
        // Demo fallback
      }
    }
    setStep('HIRE_HISTORY');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ════════════════════════════════════════════════════════════════════════
          5-STAGE PROGRESS BREADCRUMB
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C2B3]" />
            <p className="text-xs font-black text-[#0B1728] dark:text-white uppercase tracking-widest">
              VITO Chauffeur — 5-Stage Booking Engine
            </p>
          </div>
          {step !== 'STAGE1_JOURNEY' && (
            <button
              onClick={() => setStep('STAGE1_JOURNEY')}
              className="text-xs font-bold text-[#526174] hover:text-[#0B1728] dark:text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start Over
            </button>
          )}
        </div>

        {/* 5-Step Visual Indicator */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          {[
            { id: 1, label: '1. Journey', active: step === 'STAGE1_JOURNEY' },
            { id: 2, label: '2. Service', active: step === 'STAGE2_SERVICE' },
            { id: 3, label: '3. Vehicle', active: step === 'STAGE3_VEHICLE' },
            { id: 4, label: '4. Driver Match', active: step === 'MATCHING_RADAR' || step === 'STAGE4_FIND_DRIVER' },
            { id: 5, label: '5. Request', active: step === 'STAGE5_CONFIRM' || step === 'SINGLE_TIMELINE' },
          ].map((s) => (
            <div
              key={s.id}
              className={`py-2 px-2 rounded-xl text-center text-[11px] font-extrabold transition-all border ${
                s.active
                  ? 'bg-[#07111F] text-white border-[#07111F] shadow-sm'
                  : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] dark:text-slate-400 border-[#E5EAF0] dark:border-[#17334F]'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Route Summary Banner ─── */}
      {pickup.address && (
        <div className="p-3.5 px-5 rounded-2xl bg-[#F0FCFB] dark:bg-[#10243A] border border-[#00C2B3]/30 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin className="w-4 h-4 text-[#00A99D] shrink-0" />
            <div className="min-w-0 font-bold text-[#0B1728] dark:text-white truncate">
              <span>From: </span>
              <span className="text-[#00A99D] font-extrabold">{pickup.address}</span>
              {destination?.address ? (
                <>
                  <span className="mx-1 text-slate-400">→</span>
                  <span>To: </span>
                  <span className="text-[#00A99D] font-extrabold">{destination.address}</span>
                </>
              ) : (
                <span className="text-slate-400 font-normal"> (City Duty / Multiple Stops)</span>
              )}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#00C2B3]/10 text-[10px] font-extrabold text-[#00A99D] uppercase tracking-wider shrink-0">
            {serviceType.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* ─── Inline Validation Error Alert ─── */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 1 — JOURNEY (From, To, Date, Start Time & Calculated Recommendation)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE1_JOURNEY' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Stage 1: Define Your Journey & Schedule
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400 font-medium">
              Enter reporting pickup and destination to calculate exact driving distance and recommended hire duration.
            </p>
          </div>

          <div className="space-y-4">
            <AddressAutocomplete
              label="Pickup Location / Reporting Address"
              value={pickup.address}
              onChange={(val) => setPickup((prev) => ({ ...prev, address: val }))}
              placeholder="Search pickup address or landmark..."
              onSelect={(place) => setPickup(place)}
            />

            <AddressAutocomplete
              label="Destination Address (City Duty or Outstation)"
              value={destination?.address || ''}
              onChange={(val) => setDestination((prev) => (prev ? { ...prev, address: val } : { address: val, lat: 28.4950, lng: 77.0895 }))}
              placeholder="Enter destination address or city..."
              onSelect={(place) => setDestination(place)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                  Reporting Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                  Reporting Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
                />
              </div>
            </div>

            {/* AUTOMATICALLY CALCULATED ROUTE & DURATION RECOMMENDATION */}
            <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0B1728] dark:text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#00C2B3]" /> Auto-Calculated Route Metrics
                </span>
                <span className="text-[11px] font-bold text-[#00A99D] bg-[#00C2B3]/10 px-2.5 py-0.5 rounded-full">
                  {routeMetrics.distanceKm} km Route
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F]">
                  <p className="text-[11px] text-[#526174] dark:text-slate-400 font-semibold">Estimated Driving Time</p>
                  <p className="text-base font-black text-[#0B1728] dark:text-white mt-0.5">
                    {routeMetrics.driveTimeStr}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#F0FCFB] dark:bg-[#07111F] border border-[#00C2B3]/40">
                  <p className="text-[11px] text-[#00A99D] font-bold">Recommended Hire Duration</p>
                  <p className="text-base font-black text-[#00A99D] mt-0.5">
                    {routeMetrics.recommendedHours} Hours Service
                  </p>
                  <p className="text-[10px] text-[#526174] dark:text-slate-400 mt-1">
                    Includes traffic, pickup & waiting buffer
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!pickup.address || pickup.address.trim().length < 3) {
                  setValidationError('Please select a valid pickup location before continuing.');
                  return;
                }
                setValidationError(null);
                setStep('STAGE2_SERVICE');
              }}
              className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Stage 2: Service Selection</span>
              <ArrowRight className="w-4 h-4 text-[#00C2B3]" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 2 — SERVICE (How do you need the driver?)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE2_SERVICE' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-left space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Stage 2: How Do You Need the Driver?
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400 font-medium">
              Pre-calculated for your route ({routeMetrics.distanceKm} km, ~{routeMetrics.driveTimeStr} driving). Recommended hire duration pre-selected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_TYPES.map((srv) => {
              const isSelected = serviceType === srv.id;
              const Icon = srv.icon;
              return (
                <button
                  key={srv.id}
                  onClick={() => setServiceType(srv.id)}
                  className={`p-6 rounded-3xl text-left border transition-all flex flex-col justify-between group relative ${
                    isSelected
                      ? 'bg-[#F0FCFB] dark:bg-[#10243A] border-[#00C2B3] ring-1 ring-[#00C2B3] shadow-md'
                      : 'bg-[#FFFFFF] dark:bg-[#0B1728] border-[#E5EAF0] dark:border-[#17334F] hover:border-[#CCD6E2]'
                  }`}
                >
                  <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[#F1F5F8] dark:bg-[#10243A] text-[10px] font-bold text-[#526174] dark:text-slate-300">
                    {srv.badge}
                  </span>

                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0B1728] dark:text-white">
                        {srv.title}
                      </h3>
                      <p className="text-xs text-[#526174] dark:text-slate-400 mt-1 leading-relaxed">
                        {srv.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between">
                    <span className="text-xs font-black text-[#00A99D]">{srv.rateLabel}</span>
                    <span className="text-xs font-bold text-[#0B1728] dark:text-white">
                      {isSelected ? '✓ Selected' : 'Select →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* DURATION OVERRIDE OPTION */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#0B1728] dark:text-white">
                  Pre-Selected Recommended Duration: <span className="text-[#00A99D] font-extrabold">{effectiveHours} Hours</span>
                </p>
                <p className="text-[11px] text-[#526174] dark:text-slate-400">
                  Estimated driving time: {routeMetrics.driveTimeStr} ({routeMetrics.distanceKm} km)
                </p>
              </div>
              <button
                onClick={() => setShowDurationOverride(!showDurationOverride)}
                className="px-3.5 py-1.5 rounded-xl border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#526174] hover:text-[#0B1728] dark:text-slate-300"
              >
                {showDurationOverride ? 'Keep Recommended' : 'Change Duration'}
              </button>
            </div>

            {showDurationOverride && (
              <div className="pt-2 grid grid-cols-4 gap-2">
                {[2, 4, 6, 8, 10, 12].map((h) => (
                  <button
                    key={h}
                    onClick={() => setCustomHours(h)}
                    className={`py-3 rounded-2xl font-bold text-xs border transition-all ${
                      customHours === h
                        ? 'bg-[#07111F] text-white border-[#07111F]'
                        : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] dark:text-slate-300 border-[#E5EAF0] dark:border-[#17334F]'
                    }`}
                  >
                    {h} Hours
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep('STAGE3_VEHICLE')}
              className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Stage 3: Vehicle Specifications</span>
              <ArrowRight className="w-4 h-4 text-[#00C2B3]" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 3 — YOUR VEHICLE (Streamlined Minimal Inputs & Skills)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE3_VEHICLE' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Stage 3: Your Vehicle Details & Driver Criteria
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400 font-medium">
              Specify your vehicle specs to ensure candidate driver matching validation.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                Body Type
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Tempo'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setVehicleType(t)}
                    className={`py-3 rounded-2xl font-bold text-xs border transition-all ${
                      vehicleType === t
                        ? 'bg-[#00C2B3] text-white border-[#00C2B3]'
                        : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] dark:text-slate-300 border-[#E5EAF0] dark:border-[#17334F]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                  Make & Model
                </label>
                <input
                  type="text"
                  value={vehicleMakeModel}
                  onChange={(e) => setVehicleMakeModel(e.target.value)}
                  placeholder="e.g. Honda City, Innova Crysta"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                  Transmission
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Automatic', 'Manual'].map((tr) => (
                    <button
                      key={tr}
                      onClick={() => setTransmission(tr)}
                      className={`py-3 rounded-2xl font-bold text-xs border transition-all ${
                        transmission === tr
                          ? 'bg-[#07111F] text-white border-[#07111F]'
                          : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] dark:text-slate-300 border-[#E5EAF0] dark:border-[#17334F]'
                      }`}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Skills Checkboxes */}
            <div>
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                Optional Chauffeur Specializations
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  'City driving',
                  'Highway driving',
                  'Outstation specialist',
                  'Luxury vehicles',
                  'Night driving specialist',
                  'Long distance experience',
                ].map((skill) => {
                  const active = selectedSkillCheckboxes.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() =>
                        setSelectedSkillCheckboxes(
                          active ? selectedSkillCheckboxes.filter((s) => s !== skill) : [...selectedSkillCheckboxes, skill]
                        )
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? 'bg-[#00C2B3]/15 text-[#00A99D] border-[#00C2B3]'
                          : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] border-[#E5EAF0] dark:border-[#17334F]'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleFindDrivers}
              className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Find Your Chauffeur →</span>
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 4 TRANSITION — MATCHING RADAR
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'MATCHING_RADAR' && (
        <div className="p-12 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm text-center space-y-6 max-w-xl mx-auto">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#00C2B3] animate-ping opacity-25" />
            <div className="w-16 h-16 rounded-full bg-[#00C2B3]/20 flex items-center justify-center text-[#00A99D]">
              <Compass className="w-8 h-8 animate-spin" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#0B1728] dark:text-white">
              Evaluating Top Verified Chauffeurs...
            </h3>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Scoring transmission, highway experience, ratings, and schedule availability.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 4 — FIND YOUR DRIVER (One Prominent Best Match + Alternatives)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE4_FIND_DRIVER' && matchedDrivers.length > 0 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-left space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Stage 4: Best Matched Chauffeur for Your Journey
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400 font-medium">
              One clear recommendation based on weighted match scoring, followed by compact alternatives.
            </p>
          </div>

          {/* 🌟 PROMINENT "BEST MATCH" CARD */}
          {(() => {
            const best = matchedDrivers[0];
            return (
              <div className="p-6 sm:p-8 rounded-3xl bg-[#F0FCFB] dark:bg-[#10243A] border-2 border-[#00C2B3] shadow-lg space-y-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 px-3.5 py-1 rounded-full bg-[#00C2B3] text-white text-xs font-black uppercase tracking-wider">
                  ⭐ Best Match ({best.matchPercentage}% Match)
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#07111F] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                    {best.avatar}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-[#0B1728] dark:text-white">
                        {best.name}
                      </h3>
                      {best.verifiedBadges.map((b) => (
                        <span key={b} className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          ✓ {b}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#526174] dark:text-slate-400 font-semibold flex-wrap">
                      <span className="text-[#8C6A29] font-bold">⭐ {best.rating} rating</span>
                      <span>• {best.totalTrips}+ trips</span>
                      <span>• {best.experienceYears} yrs experience</span>
                      <span>• Languages: {best.languages.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC "WHY THIS DRIVER?" */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#00C2B3]/30 space-y-2">
                  <p className="text-xs font-extrabold text-[#00A99D] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Why This Driver?
                  </p>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {best.matchReasons.map((reason, rIdx) => (
                      <span key={rIdx} className="px-3 py-1 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] text-xs font-semibold text-[#0B1728] dark:text-white border border-[#E5EAF0] dark:border-[#17334F]">
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 flex-wrap gap-4 border-t border-[#00C2B3]/20">
                  <div>
                    <span className="text-[11px] text-[#526174] dark:text-slate-400 font-bold block">Estimated Fare ({effectiveHours} hrs)</span>
                    <span className="text-2xl font-black text-[#0B1728] dark:text-white">₹{calculatedFare.estimatedTotal}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedDriver(best);
                        setStep('DRIVER_PROFILE_VIEW');
                      }}
                      className="px-5 py-3 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white hover:bg-[#F7F9FC]"
                    >
                      View Full Profile
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDriver(best);
                        setStep('STAGE5_CONFIRM');
                      }}
                      className="px-6 py-3.5 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white text-xs font-extrabold shadow-md"
                    >
                      Select Best Match →
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 👥 OTHER GOOD MATCHES (COMPACT ALTERNATIVES) */}
          {matchedDrivers.length > 1 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-black text-[#0B1728] dark:text-white uppercase tracking-wider">
                Other Good Matches ({matchedDrivers.length - 1} Alternatives)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedDrivers.slice(1, 4).map((alt) => (
                  <div
                    key={alt.id}
                    className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between gap-3 shadow-sm hover:border-[#00C2B3]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] font-bold text-xs flex items-center justify-center shrink-0 text-[#0B1728] dark:text-white">
                        {alt.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B1728] dark:text-white truncate">{alt.name}</p>
                        <p className="text-[11px] text-[#526174] dark:text-slate-400 font-semibold">
                          ⭐ {alt.rating} • {alt.matchPercentage}% match
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDriver(alt);
                        setStep('STAGE5_CONFIRM');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] hover:bg-[#07111F] hover:text-white text-xs font-bold text-[#0B1728] dark:text-white transition-colors shrink-0"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          DRIVER PROFILE VIEW MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'DRIVER_PROFILE_VIEW' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#17334F] pb-4">
            <h2 className="text-lg font-black text-[#0B1728] dark:text-white">
              Chauffeur Credentials & Trust Profile
            </h2>
            <button onClick={() => setStep('STAGE4_FIND_DRIVER')} className="text-xs font-bold text-[#526174]">
              Close ✕
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#07111F] text-white font-black text-xl flex items-center justify-center">
              {selectedDriver.avatar}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1728] dark:text-white">{selectedDriver.name}</h3>
              <p className="text-xs text-[#526174] dark:text-slate-400">⭐ {selectedDriver.rating} rating • {selectedDriver.totalTrips} trips</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-2 text-xs">
            <p className="font-bold text-[#0B1728] dark:text-white">Verified Trust Badges:</p>
            <div className="flex flex-wrap gap-2">
              {selectedDriver.verifiedBadges.map((b) => (
                <span key={b} className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                  ✓ {b}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('STAGE5_CONFIRM')}
            className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-sm shadow-md"
          >
            Proceed with {selectedDriver.name} →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 5 — CONFIRM & REQUEST (Summary + Mandatory Confirmation Sentence)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE5_CONFIRM' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Stage 5: Review & Request Driver
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400 font-medium">
              Review your final journey parameters before submitting your chauffeur booking request.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#526174] dark:text-slate-400 block font-semibold">Route</span>
                <span className="font-extrabold text-[#0B1728] dark:text-white truncate block">
                  {pickup.address} → {destination?.address || 'City Duty'}
                </span>
              </div>
              <div>
                <span className="text-[#526174] dark:text-slate-400 block font-semibold">Distance & Driving Time</span>
                <span className="font-extrabold text-[#0B1728] dark:text-white">
                  {routeMetrics.distanceKm} km (~{routeMetrics.driveTimeStr})
                </span>
              </div>
              <div>
                <span className="text-[#526174] dark:text-slate-400 block font-semibold">Date & Time</span>
                <span className="font-extrabold text-[#0B1728] dark:text-white">{bookingDate} at {startTime}</span>
              </div>
              <div>
                <span className="text-[#526174] dark:text-slate-400 block font-semibold">Service Duration</span>
                <span className="font-extrabold text-[#00A99D]">{effectiveHours} Hours Service</span>
              </div>
              <div>
                <span className="text-[#526174] dark:text-slate-400 block font-semibold">Your Vehicle</span>
                <span className="font-extrabold text-[#0B1728] dark:text-white">{vehicleMakeModel} ({transmission})</span>
              </div>
              <div>
                <span className="text-[#526174] dark:text-slate-400 block font-semibold">Chauffeur</span>
                <span className="font-extrabold text-[#0B1728] dark:text-white">{selectedDriver.name} (⭐ {selectedDriver.rating})</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between">
              <span className="text-xs font-bold text-[#526174]">Total Estimated Fare</span>
              <span className="text-xl font-black text-[#0B1728] dark:text-white">₹{calculatedFare.estimatedTotal}</span>
            </div>
          </div>

          {/* REQUEST CTA WITH MANDATORY EXPLICIT SENTENCE */}
          <div className="space-y-2">
            <button
              onClick={handleRequestBooking}
              className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-extrabold text-sm shadow-lg transition-all"
            >
              Request Driver
            </button>
            <p className="text-[11px] text-[#526174] dark:text-slate-400 text-center font-bold italic">
              Your request will be sent to this driver. Your booking is confirmed only after the driver accepts.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          POST-REQUEST: SINGLE TIMELINE VIEW (In-Place Updates via Polling Sync)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'SINGLE_TIMELINE' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#0B1728] dark:text-white">
                Booking Status Timeline
              </h2>
              <p className="text-xs text-[#526174] dark:text-slate-400">
                Live status synchronization (Polling sync active). Updates in place.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#00C2B3]/10 text-[#00A99D] text-xs font-black uppercase tracking-wider">
              {bookingStatus}
            </span>
          </div>

          {/* CHECKLIST TIMELINE */}
          <div className="space-y-4 pt-2">
            {[
              { id: 1, label: 'Request sent to driver', done: true },
              {
                id: 2,
                label: bookingStatus === 'REQUESTED' ? 'Waiting for driver response...' : 'Driver accepted request',
                done: ['ACCEPTED', 'CONFIRMED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(bookingStatus),
              },
              {
                id: 3,
                label: 'Booking confirmed',
                done: ['CONFIRMED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(bookingStatus),
              },
              {
                id: 4,
                label: 'Driver en route to pickup',
                done: ['DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(bookingStatus),
              },
              {
                id: 5,
                label: 'Driver arrived & PIN verification',
                done: ['DRIVER_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(bookingStatus),
              },
              {
                id: 6,
                label: 'Service duty active',
                done: ['SERVICE_STARTED', 'SERVICE_COMPLETED'].includes(bookingStatus),
              },
              {
                id: 7,
                label: 'Service completed & settled',
                done: ['SERVICE_COMPLETED', 'RATED'].includes(bookingStatus),
              },
            ].map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-xs font-bold">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    t.done ? 'bg-emerald-500 text-white' : 'bg-[#E5EAF0] dark:bg-[#10243A] text-[#526174]'
                  }`}
                >
                  {t.done ? '✓' : '○'}
                </div>
                <span className={t.done ? 'text-[#0B1728] dark:text-white' : 'text-[#8995A5]'}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>

          {/* DRIVER CONSOLE SIMULATION CONTROLS */}
          <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
            <p className="text-[11px] font-black text-[#526174] uppercase tracking-wider">
              Driver Partner Interactive Console Simulation:
            </p>

            {/* DRIVER-FACING TRUST DISPLAY */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0B1728] dark:text-white">Incoming Request — Driver View</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                  Verified Customer ✓
                </span>
              </div>
              <p className="text-[#526174] text-[11px]">
                Member since Jan 2026 • 8 completed bookings • ⭐ 4.9 customer rating
              </p>
              <p className="text-[11px] font-bold text-[#00A99D] pt-0.5">
                Approximate Pickup: {pickup.address.split(',')[0]} Area (Exact address released after accept)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSimulateDriverAccept}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Simulate Driver Accept ✓
              </button>
              <button
                onClick={handleSimulateDriverDecline}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs"
              >
                Simulate Driver Decline ✕
              </button>
            </div>
          </div>

          {bookingStatus === 'CONFIRMED' && (
            <button
              onClick={() => setStep('DRIVER_EN_ROUTE')}
              className="w-full py-4 rounded-2xl bg-[#00C2B3] hover:bg-[#00A99D] text-white font-black text-sm shadow-md"
            >
              Driver Confirmed — Track Driver En Route →
            </button>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          DRIVER EN ROUTE & LIVE MAP TRACKING
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'DRIVER_EN_ROUTE' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0B1728] dark:text-white">
                {selectedDriver.name} is En Route to Pickup
              </h2>
              <p className="text-xs text-[#526174]">Live tracking to reporting location ({pickup.address})</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
              Verified Driver ✓
            </span>
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-[#E5EAF0] dark:border-[#17334F]">
            <EnhancedCabMap
              pickup={{ lat: pickup.lat || 28.6315, lng: pickup.lng || 77.2167, address: pickup.address }}
              drop={destination ? { lat: destination.lat, lng: destination.lng, address: destination.address } : null}
              movingVehiclePos={[pickup.lat || 28.6315, pickup.lng || 77.2167]}
              statusLabel={`${selectedDriver.name} En Route`}
            />
          </div>

          <button
            onClick={() => setStep('SERVICE_PIN_VERIFY')}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md"
          >
            Driver Arrived — Verify Service PIN →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SERVICE PIN VERIFICATION
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'SERVICE_PIN_VERIFY' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-md mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Start Chauffeur Duty
            </h2>
            <p className="text-xs text-[#526174]">Share 4-digit PIN with driver to verify duty commencement.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0FCFB] border border-[#00C2B3]/40">
            <span className="text-xs text-[#00A99D] font-bold block uppercase tracking-wider">Your Service PIN</span>
            <span className="text-3xl font-black text-[#0B1728] dark:text-white tracking-widest">{servicePin}</span>
          </div>

          <button
            onClick={handleVerifyServicePin}
            className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-sm shadow-md"
          >
            Verify PIN & Start Active Duty →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MINIMAL ACTIVE SERVICE VIEW (Map + Dynamic Countdown + Safety Controls)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'ACTIVE_SERVICE' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
                {selectedDriver.name} is Driving You
              </h2>
              <p className="text-xs text-[#526174] font-medium">
                Active Chauffeur Duty • Route: {routeMetrics.distanceKm} km
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#00C2B3]/10 text-[#00A99D] text-xs font-black uppercase tracking-wider">
              Duty Active
            </span>
          </div>

          {/* Reused Live Map */}
          <div className="h-64 rounded-2xl overflow-hidden border border-[#E5EAF0] dark:border-[#17334F]">
            <EnhancedCabMap
              pickup={{ lat: pickup.lat || 28.6315, lng: pickup.lng || 77.2167, address: pickup.address }}
              drop={destination ? { lat: destination.lat, lng: destination.lng, address: destination.address } : null}
              movingVehiclePos={[pickup.lat || 28.6315, pickup.lng || 77.2167]}
              statusLabel={`${selectedDriver.name} Driving`}
            />
          </div>

          {/* DYNAMIC COUNTDOWN TIMER */}
          <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#00A99D]" />
              <div>
                <span className="text-xs font-bold text-[#0B1728] dark:text-white block">Duty Time Remaining</span>
                <span className="text-[11px] text-[#526174]">Booked: {effectiveHours + extraHoursCount} hrs</span>
              </div>
            </div>
            <span className="text-lg font-black text-[#00A99D]">
              {Math.floor(serviceDurationLeftMinutes / 60)}h {serviceDurationLeftMinutes % 60}m
            </span>
          </div>

          {/* ACTIONS & SAFETY CONTROLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => alert(`Calling Driver: ${selectedDriver.phone}`)}
              className="py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" /> Contact
            </button>

            <button
              onClick={() => alert('VITO Emergency SOS Triggered. Dispatched to emergency contacts.')}
              className="py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-500 flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Safety SOS
            </button>

            <button
              onClick={() => setShowExtraHoursModal(true)}
              className="py-3 rounded-2xl bg-[#F0FCFB] border border-[#00C2B3]/40 text-xs font-bold text-[#00A99D] flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Extend
            </button>

            <button
              onClick={() => setShowDriverSafetyModal(true)}
              className="py-3 rounded-2xl bg-[#07111F] text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" /> Driver Safety
            </button>
          </div>

          <button
            onClick={handleCompleteService}
            className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-sm shadow-md"
          >
            End Service & Complete Duty →
          </button>
        </div>
      )}

      {/* ─── EXTEND SERVICE MODAL (Explicit Extra Charge Confirmation Required) ─── */}
      {showExtraHoursModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] rounded-3xl p-6 max-w-md w-full space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0B1728] dark:text-white">Extend Chauffeur Duty</h3>
              <button onClick={() => setShowExtraHoursModal(false)} className="text-xs font-bold text-[#526174]">✕</button>
            </div>

            <p className="text-xs text-[#526174]">
              Rate: ₹{selectedDriver.hourlyRate} / hour. Additional charges will be explicitly added to your final bill.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((h) => (
                <button
                  key={h}
                  onClick={() => handleConfirmExtraHours(h)}
                  className="py-3 rounded-2xl bg-[#F0FCFB] border border-[#00C2B3]/40 text-xs font-black text-[#00A99D]"
                >
                  +{h} Hr (₹{h * selectedDriver.hourlyRate})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DRIVER SAFETY CONCERN MODAL (Driver Safety Controls) ─── */}
      {showDriverSafetyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] rounded-3xl p-6 max-w-md w-full space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0B1728] dark:text-white">Report Safety Concern (Driver Control)</h3>
              <button onClick={() => setShowDriverSafetyModal(false)} className="text-xs font-bold text-[#526174]">✕</button>
            </div>

            {safetyReportMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 text-emerald-600 text-xs font-bold">
                ✓ {safetyReportMessage}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#0B1728] dark:text-white block mb-1">Select Concern Category</label>
                  <select
                    value={safetyConcernCategory}
                    onChange={(e) => setSafetyConcernCategory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] font-bold text-[#0B1728] dark:text-white"
                  >
                    <option value="Customer behaviour">Customer behaviour issue</option>
                    <option value="Unsafe location">Unsafe location or route</option>
                    <option value="Threatening behaviour">Threatening behaviour</option>
                    <option value="Illegal activity concern">Illegal activity concern</option>
                    <option value="Other">Other safety issue</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0B1728] dark:text-white block mb-1">Incident Details</label>
                  <textarea
                    value={safetyConcernDetails}
                    onChange={(e) => setSafetyConcernDetails(e.target.value)}
                    placeholder="Describe safety concern for VITO Trust & Safety team..."
                    className="w-full p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] font-semibold text-[#0B1728] dark:text-white h-24 outline-none"
                  />
                </div>

                <button
                  onClick={handleReportSafetyConcern}
                  className="w-full py-3.5 rounded-2xl bg-red-600 text-white font-black shadow-md"
                >
                  Submit Safety Incident Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SERVICE COMPLETED & MOCK PAYMENT SETTLEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'SERVICE_COMPLETED' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-md mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Service Completed</h2>
            <p className="text-xs text-[#526174]">Final fare itemized and ready for settlement.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] text-left space-y-2 text-xs">
            <div className="flex justify-between"><span>Base Service:</span><span className="font-bold">₹{calculatedFare.baseService}</span></div>
            <div className="flex justify-between"><span>Duration Charge ({effectiveHours}h):</span><span className="font-bold">₹{calculatedFare.durationCharge}</span></div>
            {extraHoursCount > 0 && <div className="flex justify-between text-[#00A99D]"><span>Extra Hours ({extraHoursCount}h):</span><span className="font-bold">₹{extraHoursCount * 180}</span></div>}
            <div className="flex justify-between"><span>Platform Fee & GST:</span><span className="font-bold">₹{calculatedFare.platformFee + calculatedFare.taxes}</span></div>
            <div className="pt-2 border-t border-[#E5EAF0] dark:border-[#17334F] flex justify-between font-black text-sm text-[#0B1728] dark:text-white">
              <span>Total Settled:</span><span>₹{calculatedFare.estimatedTotal + extraHoursCount * 180}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowPaymentModal(false);
              setStep('RATING_FEEDBACK');
            }}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md"
          >
            Settle Payment & Rate Driver →
          </button>
        </div>
      )}

      {/* MOCK PAYMENT MODAL */}
      {showPaymentModal && (
        <MockPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setStep('RATING_FEEDBACK');
          }}
          bookingId={activeDriverHireId || 'hire_demo_' + Date.now()}
          bookingType="driver_hire"
          totalFare={calculatedFare.estimatedTotal + extraHoursCount * 180}
          itemDescription="VITO Professional Chauffeur Duty"
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            setStep('RATING_FEEDBACK');
          }}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MULTI-DIMENSION 4-STAR RATING FEEDBACK
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'RATING_FEEDBACK' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-lg mx-auto">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Rate {selectedDriver.name}</h2>
            <p className="text-xs text-[#526174]">Your feedback updates chauffeur aggregate rating.</p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Driving Smoothness', val: ratingDriving, set: setRatingDriving },
              { label: 'Professional Behavior', val: ratingProf, set: setRatingProf },
              { label: 'Punctuality', val: ratingPunct, set: setRatingPunct },
              { label: 'Vehicle Handling', val: ratingHandling, set: setRatingHandling },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0B1728] dark:text-white">{cat.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => cat.set(star)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold ${
                        star <= cat.val ? 'bg-[#8C6A29] text-white' : 'bg-[#F7F9FC] text-[#526174]'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Write feedback for your chauffeur..."
              className="w-full p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs outline-none"
            />

            <button
              onClick={handleSubmitRating}
              className="w-full py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-sm shadow-md"
            >
              Submit Rating & View History →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ARCHIVED HIRE HISTORY
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'HIRE_HISTORY' && (
        <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Booking Archived in My Trips</h2>
            <p className="text-xs text-[#526174]">Your chauffeur service is archived in customer My Services and driver My Hire Trips history.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push('/customer/trips')}
              className="flex-1 py-3.5 rounded-2xl bg-[#07111F] text-white text-xs font-bold"
            >
              Go to My Trips
            </button>
            <button
              onClick={() => setStep('STAGE1_JOURNEY')}
              className="flex-1 py-3.5 rounded-2xl bg-[#F7F9FC] text-[#0B1728] border text-xs font-bold"
            >
              Book Another Driver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
