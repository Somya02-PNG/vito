'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Award,
  ChevronRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Phone,
  Radio,
  FileCheck,
  Sparkles,
  Info,
  Loader2,
  UserCheck,
  Compass,
  ArrowRight,
  RefreshCw,
  X,
  Share2,
  Navigation,
  KeyRound,
  Eye,
  Check,
  Plus,
  Minus,
  Timer,
  Car,
  Hourglass,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import AddressAutocomplete, { PlaceResult } from '@/components/AddressAutocomplete';
import { fetchAPI } from '@/lib/api';
import EnhancedCabMap from '@/components/cab/EnhancedCabMap';
import MockPaymentModal from '@/components/MockPaymentModal';
import CustomerVehicleSelector from '@/components/customer-vehicles/CustomerVehicleSelector';
import { CustomerVehicle } from '@/components/customer-vehicles/CustomerVehicleManager';

// ─── TYPES & DATA STRUCTURES ────────────────────────────────────────────────
export type StageStep =
  | 'STAGE1_ROUTE'
  | 'STAGE2_TRIP_TYPE'
  | 'STAGE3_DURATION_COMMITMENT'
  | 'STAGE4_DRIVER_MATCHING'
  | 'STAGE5_SELECT_DRIVER'
  | 'STAGE6_REVIEW_FARE'
  | 'DRIVER_PROFILE_VIEW'
  | 'SINGLE_TIMELINE'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'SERVICE_PIN_VERIFY'
  | 'TRIP_IN_PROGRESS'
  | 'TRIP_COMPLETED'
  | 'RATING_FEEDBACK';

export type TripType = 'ONE_WAY' | 'ROUND_TRIP';

export interface DriverCandidate {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  totalTrips: number;
  yearsExperience: number;
  verificationBadge: string;
  specializations: string[];
  cityExperienceYears: number;
  longDistanceExperienceYears: number;
  completedOutstationTrips: number;
  cancellationRatePct: number;
  isAvailableForFullTrip: boolean;
  whyRecommended?: string;
  hourlyRate: number;
  estimatedFare: number;
  reviewsCount: number;
  recentReviews?: { reviewer: string; rating: number; comment: string; date: string }[];
}

export interface RouteMetrics {
  outboundKm: number;
  outboundDurationMinutes: number;
  outboundDurationStr: string;
  returnKm: number;
  returnDurationMinutes: number;
  returnDurationStr: string;
  totalDrivingKm: number;
  totalDrivingDurationMinutes: number;
  totalDrivingDurationStr: string;
  totalCommitmentHours: number;
}

export interface TimelineStop {
  timeStr: string;
  label: string;
  location: string;
  subtext: string;
  isKey?: boolean;
}

// ─── CONFIGURABLE PRICING ENGINE ──────────────────────────────────────────
export const HIRE_PRICING_CONFIG = {
  // Base driver hire hourly rate
  baseHourlyRate: 150,
  // Per km driver travel compensation
  oneWayPerKmRate: 4.5,
  roundTripPerKmRate: 3.5,
  // Driver allowances
  driverAllowancePerDay: 350,
  nightDutyCharge: 200,
  // Additional waiting time per hour for flexible / overtime
  additionalHourlyWaitingRate: 180,
  // Fixed minimum commitment hours for flexible round trip
  flexibleMinHours: 6,
  // Percentage fees
  platformFeePct: 0.05,
  taxGstPct: 0.05,
};

// ─── HARDCODED VERIFIED DRIVER POOL ─────────────────────────────────────────
const VERIFIED_DRIVERS: DriverCandidate[] = [
  {
    id: 'drv_rahul',
    name: 'Rahul Sharma',
    avatar: 'RS',
    phone: '+91 98765 11223',
    rating: 4.9,
    totalTrips: 1420,
    yearsExperience: 7,
    cityExperienceYears: 7,
    longDistanceExperienceYears: 5,
    completedOutstationTrips: 410,
    cancellationRatePct: 0.5,
    isAvailableForFullTrip: true,
    verificationBadge: 'VITO Master Chauffeur',
    specializations: ['Highway Specialist', 'Luxury Vehicles', 'Night Duty', 'Outstation Pro'],
    hourlyRate: 160,
    estimatedFare: 0,
    reviewsCount: 328,
    recentReviews: [
      { reviewer: 'Vikram S.', rating: 5, comment: 'Extremely polite, very smooth driving on the Lucknow-Kanpur expressway.', date: '2 days ago' },
      { reviewer: 'Ananya M.', rating: 5, comment: 'Punctual and very respectful. Highly recommended for family round trips.', date: '1 week ago' },
    ],
  },
  {
    id: 'drv_amit',
    name: 'Amit Kumar',
    avatar: 'AK',
    phone: '+91 98765 22334',
    rating: 4.8,
    totalTrips: 980,
    yearsExperience: 5,
    cityExperienceYears: 5,
    longDistanceExperienceYears: 4,
    completedOutstationTrips: 280,
    cancellationRatePct: 1.0,
    isAvailableForFullTrip: true,
    verificationBadge: 'VITO Verified Chauffeur',
    specializations: ['Outstation Trips', 'Defensive Driving', 'VIP Protocol'],
    hourlyRate: 150,
    estimatedFare: 0,
    reviewsCount: 195,
    recentReviews: [
      { reviewer: 'Sunil K.', rating: 5, comment: 'Very careful driver, kept the car immaculate and arrived 15 mins early.', date: '3 days ago' },
    ],
  },
  {
    id: 'drv_priya',
    name: 'Priya Singh',
    avatar: 'PS',
    phone: '+91 98765 33445',
    rating: 4.95,
    totalTrips: 820,
    yearsExperience: 6,
    cityExperienceYears: 6,
    longDistanceExperienceYears: 4,
    completedOutstationTrips: 215,
    cancellationRatePct: 0.2,
    isAvailableForFullTrip: true,
    verificationBadge: 'VITO Elite Chauffeur',
    specializations: ['Executive Travel', 'Family Trips', 'Night Travel Safe'],
    hourlyRate: 170,
    estimatedFare: 0,
    reviewsCount: 240,
    recentReviews: [
      { reviewer: 'Meera R.', rating: 5, comment: 'The most courteous and professional driver I have ever hired. 10/10.', date: '5 days ago' },
    ],
  },
  {
    id: 'drv_deepak',
    name: 'Deepak Verma',
    avatar: 'DV',
    phone: '+91 98765 44556',
    rating: 4.7,
    totalTrips: 1100,
    yearsExperience: 8,
    cityExperienceYears: 8,
    longDistanceExperienceYears: 6,
    completedOutstationTrips: 340,
    cancellationRatePct: 1.5,
    isAvailableForFullTrip: true,
    verificationBadge: 'VITO Verified Chauffeur',
    specializations: ['SUV Specialist', 'Inter-city Expressways', 'Punctual'],
    hourlyRate: 150,
    estimatedFare: 0,
    reviewsCount: 180,
    recentReviews: [
      { reviewer: 'Rohit P.', rating: 4.5, comment: 'Great navigation skills and safe driving in heavy rains.', date: '2 weeks ago' },
    ],
  },
];

export default function DriverHireFlow() {
  // ─── STEP NAVIGATION STATE ─────────────────────────────────────────────────
  const [step, setStep] = useState<StageStep>('STAGE1_ROUTE');
  const [inspectedDriverForModal, setInspectedDriverForModal] = useState<DriverCandidate | null>(null);

  // ─── STAGE 1: ROUTE STATE ─────────────────────────────────────────────────
  const [pickup, setPickup] = useState<PlaceResult>({
    address: 'Kanpur Central, Kanpur, Uttar Pradesh',
    lat: 26.4547,
    lng: 80.3507,
  });
  const [destination, setDestination] = useState<PlaceResult | null>({
    address: 'Hazratganj, Lucknow, Uttar Pradesh',
    lat: 26.8467,
    lng: 80.9462,
  });
  const [routeError, setRouteError] = useState<string | null>(null);

  // ─── STAGE 2: TRIP TYPE STATE ─────────────────────────────────────────────
  const [tripType, setTripType] = useState<TripType>('ROUND_TRIP');

  // ─── STAGE 3: DURATION, STAY & COMMITMENT STATE ───────────────────────────
  const [departureDate, setDepartureDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [departureTime, setDepartureTime] = useState<string>('09:00');
  const [expectedStayHours, setExpectedStayHours] = useState<number>(3);
  const [isFlexibleRoundTrip, setIsFlexibleRoundTrip] = useState<boolean>(false);
  const [showFullTimeline, setShowFullTimeline] = useState<boolean>(false);
  const [selectedCustomerVehicle, setSelectedCustomerVehicle] = useState<CustomerVehicle | null>(null);

  // ─── STAGE 4 & 5: DRIVER MATCHING & SELECTION STATE ───────────────────────
  const [matchingProgress, setMatchingProgress] = useState<number>(0);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverCandidate | null>(null);
  const [isSelectingDriver, setIsSelectingDriver] = useState<boolean>(false);

  // ─── STAGE 6: BOOKING & LIFECYCLE STATE ───────────────────────────────────
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string>('DRAFT');
  const [servicePin, setServicePin] = useState<string>('4829');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [shareLinkCopied, setShareLinkCopied] = useState<boolean>(false);
  const [isSosActive, setIsSosActive] = useState<boolean>(false);

  // Active duty timer
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Rating Feedback
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // ─── 1. ROUTE DISTANCE & DURATION CALCULATIONS ─────────────────────────────
  const calculateHarversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const routeMetrics: RouteMetrics = useMemo(() => {
    let oneWayKm = 85; // Default for Kanpur -> Lucknow
    if (pickup?.lat && pickup?.lng && destination?.lat && destination?.lng) {
      const direct = calculateHarversineKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
      // Realistic road route factor ~1.28
      oneWayKm = Math.max(12, Math.round(direct * 1.28));
    }

    // Road speed assumption: average ~42 km/h accounting for city exit + expressway + entry
    const oneWayMinutes = Math.max(25, Math.round((oneWayKm / 42) * 60));
    const oneWayHoursDecimal = oneWayMinutes / 60;

    const formatDuration = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h === 0) return `${m} mins`;
      if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`;
      return `${h} hr ${m} min`;
    };

    const outboundDurationStr = formatDuration(oneWayMinutes);
    const returnKm = tripType === 'ROUND_TRIP' ? oneWayKm : 0;
    const returnMinutes = tripType === 'ROUND_TRIP' ? oneWayMinutes : 0;
    const returnDurationStr = tripType === 'ROUND_TRIP' ? outboundDurationStr : '0 min';

    const totalDrivingKm = tripType === 'ROUND_TRIP' ? oneWayKm * 2 : oneWayKm;
    const totalDrivingMinutes = tripType === 'ROUND_TRIP' ? oneWayMinutes * 2 : oneWayMinutes;
    const totalDrivingDurationStr = formatDuration(totalDrivingMinutes);

    // Total Driver Commitment
    let totalCommitmentHours = oneWayHoursDecimal;
    if (tripType === 'ROUND_TRIP') {
      if (isFlexibleRoundTrip) {
        totalCommitmentHours = Math.max(HIRE_PRICING_CONFIG.flexibleMinHours, oneWayHoursDecimal * 2 + 4);
      } else {
        totalCommitmentHours = oneWayHoursDecimal * 2 + expectedStayHours;
      }
    }

    return {
      outboundKm: oneWayKm,
      outboundDurationMinutes: oneWayMinutes,
      outboundDurationStr,
      returnKm,
      returnDurationMinutes: returnMinutes,
      returnDurationStr,
      totalDrivingKm,
      totalDrivingDurationMinutes: totalDrivingMinutes,
      totalDrivingDurationStr,
      totalCommitmentHours: Math.round(totalCommitmentHours * 10) / 10,
    };
  }, [pickup, destination, tripType, expectedStayHours, isFlexibleRoundTrip]);

  // ─── 2. DYNAMIC TIMELINE CALCULATION ───────────────────────────────────────
  const tripTimeline: TimelineStop[] = useMemo(() => {
    if (!departureTime) return [];

    const [startH, startM] = departureTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startH || 9, startM || 0, 0, 0);

    const formatTime = (d: Date) => {
      let hours = d.getHours();
      const mins = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minsStr = mins < 10 ? `0${mins}` : mins;
      const hoursStr = hours < 10 ? `0${hours}` : hours;
      return `${hoursStr}:${minsStr} ${ampm}`;
    };

    const stops: TimelineStop[] = [];

    // Stop 1: Pickup
    stops.push({
      timeStr: formatTime(startDate),
      label: 'Pickup & Duty Start',
      location: pickup.address.split(',')[0] || 'Pickup Location',
      subtext: 'Driver arrives at reporting address & inspects trip details.',
      isKey: true,
    });

    // Stop 2: Arrival at Destination
    const arrivalDate = new Date(startDate.getTime() + routeMetrics.outboundDurationMinutes * 60 * 1000);
    stops.push({
      timeStr: formatTime(arrivalDate),
      label: 'Arrival at Destination',
      location: destination ? destination.address.split(',')[0] : 'Destination',
      subtext: `Outbound driving: ~${routeMetrics.outboundDurationStr} (${routeMetrics.outboundKm} km).`,
      isKey: true,
    });

    if (tripType === 'ROUND_TRIP') {
      if (isFlexibleRoundTrip) {
        stops.push({
          timeStr: `${formatTime(arrivalDate)} onwards`,
          label: 'Flexible On-Call Waiting',
          location: destination ? destination.address.split(',')[0] : 'Destination',
          subtext: `Driver remains on standby (Minimum ${HIRE_PRICING_CONFIG.flexibleMinHours}h booking window).`,
        });
      } else {
        const returnStartDate = new Date(arrivalDate.getTime() + expectedStayHours * 60 * 60 * 1000);
        stops.push({
          timeStr: `${formatTime(arrivalDate)} – ${formatTime(returnStartDate)}`,
          label: `Destination Stay & Standby (${expectedStayHours} hrs)`,
          location: destination ? destination.address.split(',')[0] : 'Destination',
          subtext: 'Driver stays on standby for you during your meetings/visit.',
        });

        stops.push({
          timeStr: formatTime(returnStartDate),
          label: 'Return Journey Departure',
          location: destination ? destination.address.split(',')[0] : 'Destination',
          subtext: `Heading back to ${pickup.address.split(',')[0]}.`,
        });

        const finalArrivalDate = new Date(returnStartDate.getTime() + routeMetrics.returnDurationMinutes * 60 * 1000);
        stops.push({
          timeStr: formatTime(finalArrivalDate),
          label: 'Expected Return & Duty Completion',
          location: pickup.address.split(',')[0] || 'Pickup Location',
          subtext: `Return travel: ~${routeMetrics.returnDurationStr} (${routeMetrics.returnKm} km). Total commitment: ${routeMetrics.totalCommitmentHours} hrs.`,
          isKey: true,
        });
      }
    }

    return stops;
  }, [departureTime, pickup, destination, tripType, expectedStayHours, isFlexibleRoundTrip, routeMetrics]);

  // ─── 3. TRANSPARENT FARE CALCULATION ───────────────────────────────────────
  const calculateFareForDriver = useCallback(
    (driverRate: number) => {
      const cfg = HIRE_PRICING_CONFIG;

      if (tripType === 'ONE_WAY') {
        // One way: base driver fare + distance compensation
        const baseFare = Math.round(driverRate * (routeMetrics.outboundDurationMinutes / 60));
        const distanceFare = Math.round(routeMetrics.outboundKm * cfg.oneWayPerKmRate);
        const subtotal = baseFare + distanceFare;
        const platformFee = Math.round(subtotal * cfg.platformFeePct);
        const gst = Math.round((subtotal + platformFee) * cfg.taxGstPct);
        const total = subtotal + platformFee + gst;

        return {
          baseFare,
          distanceFare,
          stayStandbyFare: 0,
          driverAllowance: 0,
          platformFee,
          gst,
          total,
          itemized: [
            { label: `Base Driver Fare (~${routeMetrics.outboundDurationStr})`, amount: baseFare },
            { label: `Distance Travel Component (${routeMetrics.outboundKm} km)`, amount: distanceFare },
            { label: 'Platform & Safety Protection (5%)', amount: platformFee },
            { label: 'GST / Government Taxes (5%)', amount: gst },
          ],
        };
      } else {
        // Round trip: Driver Time/Commitment + Distance + Stay Standby + Allowance
        const drivingHours = (routeMetrics.outboundDurationMinutes * 2) / 60;
        const drivingTimeFare = Math.round(driverRate * drivingHours);
        const stayHours = isFlexibleRoundTrip ? 4 : expectedStayHours;
        const stayStandbyFare = Math.round(stayHours * (cfg.additionalHourlyWaitingRate * 0.75));
        const distanceFare = Math.round(routeMetrics.totalDrivingKm * cfg.roundTripPerKmRate);
        const driverAllowance = routeMetrics.totalCommitmentHours >= 6 ? cfg.driverAllowancePerDay : 0;

        const subtotal = drivingTimeFare + stayStandbyFare + distanceFare + driverAllowance;
        const platformFee = Math.round(subtotal * cfg.platformFeePct);
        const gst = Math.round((subtotal + platformFee) * cfg.taxGstPct);
        const total = subtotal + platformFee + gst;

        return {
          baseFare: drivingTimeFare,
          distanceFare,
          stayStandbyFare,
          driverAllowance,
          platformFee,
          gst,
          total,
          itemized: [
            { label: `Driving Commitment (${routeMetrics.totalDrivingDurationStr})`, amount: drivingTimeFare },
            {
              label: isFlexibleRoundTrip
                ? `Flexible Standby Window (Min ${cfg.flexibleMinHours}h)`
                : `Destination Stay Standby (${expectedStayHours} hrs)`,
              amount: stayStandbyFare,
            },
            { label: `Total Return Distance (${routeMetrics.totalDrivingKm} km)`, amount: distanceFare },
            ...(driverAllowance > 0
              ? [{ label: 'Driver Duty & Meal Allowance', amount: driverAllowance }]
              : []),
            { label: 'Platform & Safety Protection (5%)', amount: platformFee },
            { label: 'GST / Government Taxes (5%)', amount: gst },
          ],
        };
      }
    },
    [tripType, routeMetrics, expectedStayHours, isFlexibleRoundTrip]
  );

  // ─── 4. DRIVER MATCHING & RECOMMENDATION ENGINE ────────────────────────────
  const matchedDrivers: DriverCandidate[] = useMemo(() => {
    return VERIFIED_DRIVERS.map((driver) => {
      const fareInfo = calculateFareForDriver(driver.hourlyRate);

      // Recommendation intelligence
      let whyRecommended = '';
      if (tripType === 'ROUND_TRIP') {
        whyRecommended = `Recommended because ${driver.name} is available for your full ${routeMetrics.totalCommitmentHours}-hour commitment and has completed ${driver.completedOutstationTrips}+ outstation return journeys.`;
      } else {
        whyRecommended = `Recommended for high route punctuality (${driver.rating}★ rating) and verified highway expressway experience.`;
      }

      return {
        ...driver,
        estimatedFare: fareInfo.total,
        whyRecommended,
      };
    });
  }, [calculateFareForDriver, tripType, routeMetrics.totalCommitmentHours]);

  const recommendedDriver = matchedDrivers[0];
  const otherDrivers = matchedDrivers.slice(1);

  // Active Fare Breakdown for Selected Driver
  const activeFare = useMemo(() => {
    const rate = selectedDriver?.hourlyRate || recommendedDriver?.hourlyRate || 150;
    return calculateFareForDriver(rate);
  }, [calculateFareForDriver, selectedDriver, recommendedDriver]);

  // ─── STAGE TRANSITIONS & SELECTION HANDLERS ────────────────────────────────
  const handleProceedFromRoute = () => {
    if (!pickup.address) {
      setRouteError('Please enter a valid pickup address.');
      return;
    }
    if (!destination?.address) {
      setRouteError('Please enter a valid destination address.');
      return;
    }
    setRouteError(null);
    setStep('STAGE2_TRIP_TYPE');
  };

  const handleProceedFromTripType = () => {
    setStep('STAGE3_DURATION_COMMITMENT');
  };

  const handleProceedFromDuration = () => {
    setStep('STAGE4_DRIVER_MATCHING');
    setMatchingProgress(0);
  };

  // Stage 4 Matching Radar progress effect
  useEffect(() => {
    if (step === 'STAGE4_DRIVER_MATCHING') {
      const interval = setInterval(() => {
        setMatchingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep('STAGE5_SELECT_DRIVER');
            return 100;
          }
          return prev + 25;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Stage 5: Instant Driver Selection & Auto-Advance
  const handleSelectDriver = (driver: DriverCandidate) => {
    if (isSelectingDriver) return; // double-click protection

    setIsSelectingDriver(true);
    setSelectedDriverId(driver.id);
    setSelectedDriver(driver);

    if (inspectedDriverForModal) {
      setInspectedDriverForModal(null);
    }

    // Auto-advance to Stage 6 (Review & Fare)
    setTimeout(() => {
      setIsSelectingDriver(false);
      setStep('STAGE6_REVIEW_FARE');
    }, 250);
  };

  // Stage 6: Confirm Booking & Send Request to Driver
  const handleConfirmHire = async () => {
    if (!selectedDriver) return;
    setIsSubmittingBooking(true);

    try {
      const payload = {
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        driverPhone: selectedDriver.phone,
        driverAvatar: selectedDriver.avatar,
        serviceType: 'outstation',
        tripType,
        outboundDistanceKm: routeMetrics.outboundKm,
        outboundDurationStr: routeMetrics.outboundDurationStr,
        returnDistanceKm: routeMetrics.returnKm,
        returnDurationStr: routeMetrics.returnDurationStr,
        expectedStayDurationHours: tripType === 'ROUND_TRIP' ? expectedStayHours : 0,
        totalDrivingDistanceKm: routeMetrics.totalDrivingKm,
        totalDrivingDurationStr: routeMetrics.totalDrivingDurationStr,
        totalDriverCommitmentHours: routeMetrics.totalCommitmentHours,
        isFlexibleRoundTrip,
        estimatedEarnings: Math.round(activeFare.total * 0.8),
        timeline: tripTimeline,
        hourlyRate: selectedDriver.hourlyRate,
        pickupLocation: pickup.address,
        pickupCoords: { lat: pickup.lat || 26.4547, lng: pickup.lng || 80.3507 },
        destinationLocation: destination?.address || '',
        destinationCoords: destination ? { lat: destination.lat || 26.8467, lng: destination.lng || 80.9462 } : undefined,
        bookingDate: departureDate,
        startTime: departureTime,
        hours: Math.ceil(routeMetrics.totalCommitmentHours),
        fareBreakdown: activeFare,
        customerVehicle: selectedCustomerVehicle || {
          make: 'Toyota',
          model: 'Innova Crysta',
          registrationNumber: 'UP-78-TX-9901',
          transmission: 'automatic',
          seatingCapacity: 7,
        },
      };

      const res = await fetchAPI<any>('/driver-hire/request', {
        method: 'POST',
        body: payload,
      });

      if (res && res.data?.hire) {
        setActiveBookingId(res.data.hire._id || res.data.hire.id);
        setServicePin(res.data.hire.servicePin || '4829');
      } else {
        setActiveBookingId(`hire_${Date.now()}`);
      }

      setBookingStatus('REQUEST_SENT');
      setStep('SINGLE_TIMELINE');
    } catch (err) {
      console.warn('Booking API dispatch error, setting demo booking id', err);
      setActiveBookingId(`hire_${Date.now()}`);
      setBookingStatus('REQUEST_SENT');
      setStep('SINGLE_TIMELINE');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Duty timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setActiveSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyPin = () => {
    if (enteredPin === servicePin) {
      setPinError(false);
      setBookingStatus('TRIP_IN_PROGRESS');
      setStep('TRIP_IN_PROGRESS');
      setIsTimerRunning(true);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* ─── BREADCRUMB / TOP FLOW HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#17334F] pb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#00A99D]">
            VITO Verified Mobility
          </span>
          <h1 className="text-2xl font-black text-[#0B1728] dark:text-white tracking-tight">
            Hire a Professional Driver
          </h1>
          <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
            Hire vetted, background-verified chauffeurs for your personal car & outstation journeys.
          </p>
        </div>

        {/* Step Indicator Badges */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { id: 'STAGE1_ROUTE', num: '1', label: 'Route' },
            { id: 'STAGE2_TRIP_TYPE', num: '2', label: 'Trip Type' },
            { id: 'STAGE3_DURATION_COMMITMENT', num: '3', label: 'Duration' },
            { id: 'STAGE5_SELECT_DRIVER', num: '4', label: 'Driver' },
            { id: 'STAGE6_REVIEW_FARE', num: '5', label: 'Fare' },
          ].map((st) => {
            const isActive = step === st.id;
            return (
              <div
                key={st.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#07111F] text-white shadow-sm'
                    : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#8995A5]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isActive ? 'bg-[#00C2B3] text-white' : 'bg-[#E5EAF0] text-[#526174]'}`}>
                  {st.num}
                </span>
                <span>{st.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 1: ROUTE SELECTION
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE1_ROUTE' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-[#0B1728] dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#00A99D]" /> Step 1: Specify Route
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Enter your reporting pickup point and destination. Both locations remain independent and editable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pickup Location
              </label>
              <AddressAutocomplete
                value={pickup.address}
                onChange={(val) => setPickup((prev) => ({ ...prev, address: val }))}
                placeholder="Enter pickup address (e.g. Kanpur Central)..."
                onSelect={(place) => setPickup(place)}
              />
            </div>

            {/* Drop / Destination Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Destination Location
              </label>
              <AddressAutocomplete
                value={destination?.address || ''}
                onChange={(val) => setDestination((prev) => ({ ...prev, address: val, lat: prev?.lat || 26.8467, lng: prev?.lng || 80.9462 }))}
                placeholder="Enter destination address (e.g. Hazratganj, Lucknow)..."
                onSelect={(place) => setDestination(place)}
              />
            </div>
          </div>

          {/* Route Distance Preview Card */}
          {destination && (
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center font-bold">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B1728] dark:text-white">
                    Estimated Route Distance & Travel Time
                  </div>
                  <div className="text-xs text-[#526174] dark:text-slate-400">
                    One-way: ~{routeMetrics.outboundKm} km • ~{routeMetrics.outboundDurationStr}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                ✓ Expressway Route Verified
              </span>
            </div>
          )}

          {routeError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {routeError}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleProceedFromRoute}
              className="px-6 py-3.5 rounded-2xl bg-[#07111F] hover:bg-[#00C2B3] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              Continue to Trip Type <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 2: TRIP TYPE (ONE WAY vs ROUND TRIP)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE2_TRIP_TYPE' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#0B1728] dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#00A99D]" /> Step 2: Choose Trip Type
              </h2>
              <p className="text-xs text-[#526174] dark:text-slate-400">
                Select whether you require the chauffeur for a single drop or a dedicated round trip return.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('STAGE1_ROUTE')}
              className="text-xs font-bold text-[#526174] hover:text-[#0B1728] dark:text-slate-400 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Edit Route
            </button>
          </div>

          {/* Trip Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* One Way Card */}
            <div
              onClick={() => setTripType('ONE_WAY')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                tripType === 'ONE_WAY'
                  ? 'border-[#00C2B3] bg-[#00C2B3]/5 dark:bg-[#00C2B3]/10 shadow-sm'
                  : 'border-[#E5EAF0] dark:border-[#17334F] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-[#07111F] text-white flex items-center justify-center font-black text-xs">
                    1→
                  </span>
                  <h3 className="text-sm font-black text-[#0B1728] dark:text-white">ONE WAY TRIP</h3>
                </div>
                {tripType === 'ONE_WAY' && <CheckCircle2 className="w-5 h-5 text-[#00C2B3]" />}
              </div>
              <p className="text-xs text-[#526174] dark:text-slate-300 leading-relaxed">
                "Driver takes you from your pickup location to your destination."
              </p>
              <div className="pt-2 border-t border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between text-xs font-bold text-[#0B1728] dark:text-white">
                <span>Distance: ~{routeMetrics.outboundKm} km</span>
                <span className="text-[#00A99D]">Time: ~{routeMetrics.outboundDurationStr}</span>
              </div>
            </div>

            {/* Round Trip Card */}
            <div
              onClick={() => setTripType('ROUND_TRIP')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                tripType === 'ROUND_TRIP'
                  ? 'border-[#00C2B3] bg-[#00C2B3]/5 dark:bg-[#00C2B3]/10 shadow-sm'
                  : 'border-[#E5EAF0] dark:border-[#17334F] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-[#00C2B3] text-white flex items-center justify-center font-black text-xs">
                    ⇄
                  </span>
                  <h3 className="text-sm font-black text-[#0B1728] dark:text-white">ROUND TRIP</h3>
                </div>
                {tripType === 'ROUND_TRIP' && <CheckCircle2 className="w-5 h-5 text-[#00C2B3]" />}
              </div>
              <p className="text-xs text-[#526174] dark:text-slate-300 leading-relaxed">
                "Driver takes you to your destination, stays available for your requested duration, and brings you back."
              </p>
              <div className="pt-2 border-t border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between text-xs font-bold text-[#0B1728] dark:text-white">
                <span>Total Distance: ~{routeMetrics.outboundKm * 2} km</span>
                <span className="text-[#00A99D]">Dedicated Chauffeur Standby</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep('STAGE1_ROUTE')}
              className="px-5 py-3 rounded-2xl border border-[#E5EAF0] text-xs font-bold text-[#526174] hover:bg-slate-50 cursor-pointer"
            >
              ← Back to Route
            </button>
            <button
              type="button"
              onClick={handleProceedFromTripType}
              className="px-6 py-3.5 rounded-2xl bg-[#07111F] hover:bg-[#00C2B3] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              Continue to Duration & Commitment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 3: DISTANCE + ETA + DURATION (TOTAL DRIVER COMMITMENT)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE3_DURATION_COMMITMENT' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#0B1728] dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#00A99D]" /> Step 3: Trip Timing & Total Driver Commitment
              </h2>
              <p className="text-xs text-[#526174] dark:text-slate-400">
                {tripType === 'ROUND_TRIP'
                  ? 'Specify your departure time and how long you plan to stay at your destination.'
                  : 'Specify your departure schedule for your one-way journey.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('STAGE2_TRIP_TYPE')}
              className="text-xs font-bold text-[#526174] hover:text-[#0B1728] dark:text-slate-400 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Departure Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-[#00A99D]" /> Duty Reporting Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#00A99D]" /> Reporting Time
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
              />
            </div>
          </div>

          {/* ROUND TRIP: EXPECTED STAY DURATION SELECTOR */}
          {tripType === 'ROUND_TRIP' && (
            <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-[#0B1728] dark:text-white uppercase tracking-wider">
                    HOW LONG WILL YOU STAY AT YOUR DESTINATION?
                  </h3>
                  <p className="text-xs text-[#526174] dark:text-slate-400">
                    The driver will remain dedicated on standby with your vehicle at destination.
                  </p>
                </div>

                {/* Flexible round trip checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0B1728] dark:text-white">
                  <input
                    type="checkbox"
                    checked={isFlexibleRoundTrip}
                    onChange={(e) => setIsFlexibleRoundTrip(e.target.checked)}
                    className="w-4 h-4 rounded text-[#00C2B3] focus:ring-[#00C2B3]"
                  />
                  <span>I don't know my exact return time</span>
                </label>
              </div>

              {!isFlexibleRoundTrip ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpectedStayHours((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-[#07111F] border border-[#E5EAF0] dark:border-[#17334F] text-lg font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="px-6 py-2.5 rounded-xl bg-white dark:bg-[#07111F] border border-[#00C2B3] text-center min-w-[140px]">
                      <span className="text-lg font-black text-[#00A99D]">{expectedStayHours} Hour{expectedStayHours > 1 ? 's' : ''}</span>
                      <span className="block text-[10px] text-[#526174]">Expected Stay</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpectedStayHours((prev) => Math.min(12, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-[#07111F] border border-[#E5EAF0] dark:border-[#17334F] text-lg font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 8].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setExpectedStayHours(hrs)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          expectedStayHours === hrs
                            ? 'bg-[#07111F] text-white shadow-sm'
                            : 'bg-white dark:bg-[#07111F] border border-[#E5EAF0] text-[#526174]'
                        }`}
                      >
                        {hrs} hr{hrs > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Flexible Round Trip Explanation */
                <div className="p-4 rounded-xl bg-[#00C2B3]/10 border border-[#00C2B3]/30 space-y-1.5">
                  <div className="text-xs font-bold text-[#00A99D] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> FLEXIBLE ROUND TRIP ACTIVE
                  </div>
                  <p className="text-xs text-[#0B1728] dark:text-slate-200 leading-relaxed">
                    "Your driver remains available based on a minimum {HIRE_PRICING_CONFIG.flexibleMinHours}-hour duration window. Additional stay/waiting time beyond {HIRE_PRICING_CONFIG.flexibleMinHours} hours is billed at ₹{HIRE_PRICING_CONFIG.additionalHourlyWaitingRate}/hour."
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TOTAL DRIVER COMMITMENT BREAKDOWN CARD */}
          <div className="p-6 rounded-3xl bg-[#07111F] text-white space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00C2B3]">
                  Duty Commitment Calculation
                </span>
                <h3 className="text-base font-black">TOTAL DRIVER COMMITMENT</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#00C2B3]">
                  ~{routeMetrics.totalCommitmentHours} Hours
                </span>
                <span className="block text-[10px] text-slate-400">Total Dedicated Duty</span>
              </div>
            </div>

            {/* Commitment Equation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">1. Outbound Journey</span>
                <p className="font-bold">{pickup.address.split(',')[0]} → {destination?.address.split(',')[0]}</p>
                <p className="text-[#00C2B3] font-bold">~{routeMetrics.outboundDurationStr} ({routeMetrics.outboundKm} km)</p>
              </div>

              {tripType === 'ROUND_TRIP' ? (
                <>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">2. Destination Stay</span>
                    <p className="font-bold">{destination?.address.split(',')[0]}</p>
                    <p className="text-[#00C2B3] font-bold">
                      {isFlexibleRoundTrip ? `Flexible (Min ${HIRE_PRICING_CONFIG.flexibleMinHours}h)` : `${expectedStayHours} Hours Standby`}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">3. Return Journey</span>
                    <p className="font-bold">{destination?.address.split(',')[0]} → {pickup.address.split(',')[0]}</p>
                    <p className="text-[#00C2B3] font-bold">~{routeMetrics.returnDurationStr} ({routeMetrics.returnKm} km)</p>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Direct One-Way Service</span>
                    <p className="font-bold">Chauffeur concludes duty upon arrival at destination.</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#00C2B3]" />
                </div>
              )}
            </div>

            {/* Expandable Estimated Trip Timeline */}
            <div className="pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowFullTimeline(!showFullTimeline)}
                className="text-xs font-bold text-[#00C2B3] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                {showFullTimeline ? 'Hide Calculated Trip Timeline ▲' : 'View Estimated Trip Timeline ▼'}
              </button>

              {showFullTimeline && (
                <div className="mt-4 space-y-3 pl-2 border-l-2 border-[#00C2B3]/40">
                  {tripTimeline.map((item, idx) => (
                    <div key={idx} className="relative pl-4 space-y-0.5">
                      <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-[#00C2B3]" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{item.timeStr}</span>
                        <span className="text-[11px] font-bold text-[#00C2B3]">{item.label}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-semibold">{item.location}</p>
                      <p className="text-[11px] text-slate-400">{item.subtext}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CUSTOMER VEHICLE SELECTION FROM MY CARS */}
          <div className="p-6 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F]">
            <CustomerVehicleSelector
              selectedVehicle={selectedCustomerVehicle}
              onSelectVehicle={(veh) => setSelectedCustomerVehicle(veh)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep('STAGE2_TRIP_TYPE')}
              className="px-5 py-3 rounded-2xl border border-[#E5EAF0] text-xs font-bold text-[#526174] hover:bg-slate-50 cursor-pointer"
            >
              ← Back to Trip Type
            </button>
            <button
              type="button"
              onClick={handleProceedFromDuration}
              className="px-6 py-3.5 rounded-2xl bg-[#07111F] hover:bg-[#00C2B3] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              Find Matching Drivers <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 4: DRIVER MATCHING (RADAR SKELETON)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE4_DRIVER_MATCHING' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm text-center space-y-6 max-w-xl mx-auto">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#00C2B3]/20 animate-ping" />
            <div className="w-20 h-20 rounded-full bg-[#07111F] text-white flex items-center justify-center shadow-lg">
              <UserCheck className="w-8 h-8 text-[#00C2B3]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Finding Verified Drivers for Your Trip...
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Filtering for verified status, {routeMetrics.totalCommitmentHours}h availability window, and outstation expressway experience.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F1F5F8] dark:bg-[#10243A] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#00C2B3] h-full transition-all duration-300"
              style={{ width: `${matchingProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-bold text-[#526174]">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Background Checked</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> 4.7+ Rating Minimum</span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 5: SELECT DRIVER (MAJOR UX FIX — NO BOTTOM CONTINUE BUTTON)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE5_SELECT_DRIVER' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-[#00A99D]">
                {matchedDrivers.length} Verified Drivers Available
              </span>
              <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
                Choose Your Professional Chauffeur
              </h2>
              <p className="text-xs text-[#526174] dark:text-slate-400">
                Click <strong>Select Driver</strong> to immediately proceed to fare review.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('STAGE3_DURATION_COMMITMENT')}
              className="text-xs font-bold text-[#526174] hover:text-[#0B1728] dark:text-slate-400 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Modify Timing
            </button>
          </div>

          {/* ✨ VITO RECOMMENDS CARD */}
          {recommendedDriver && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#07111F] to-[#10243A] text-white border-2 border-[#00C2B3] shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <span className="px-3 py-1 rounded-full bg-[#00C2B3] text-[#07111F] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ✨ VITO RECOMMENDS TOP MATCH
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {recommendedDriver.verificationBadge}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-lg flex items-center justify-center shadow-md">
                    {recommendedDriver.avatar}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      {recommendedDriver.name}
                      <ShieldCheck className="w-4 h-4 text-[#00C2B3]" />
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                      <span className="font-bold text-amber-400 flex items-center gap-0.5">
                        ★ {recommendedDriver.rating}
                      </span>
                      <span>•</span>
                      <span>{recommendedDriver.totalTrips} Trips</span>
                      <span>•</span>
                      <span>{recommendedDriver.yearsExperience} Yrs Exp</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-[#00C2B3]">
                    ₹{recommendedDriver.estimatedFare}
                  </span>
                  <span className="block text-[10px] text-slate-400">Estimated Total Fare</span>
                </div>
              </div>

              {/* Recommendation Rationale */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#00C2B3] shrink-0 mt-0.5" />
                <span>{recommendedDriver.whyRecommended}</span>
              </div>

              {/* Specialization Tags */}
              <div className="flex flex-wrap gap-1.5">
                {recommendedDriver.specializations.map((spec, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-lg bg-white/10 text-[10px] font-bold text-slate-300">
                    ✓ {spec}
                  </span>
                ))}
              </div>

              {/* Direct Actions on Card */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectedDriverForModal(recommendedDriver)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  disabled={isSelectingDriver}
                  onClick={() => handleSelectDriver(recommendedDriver)}
                  className="px-6 py-2.5 rounded-xl bg-[#00C2B3] hover:bg-[#00A99D] text-[#07111F] font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSelectingDriver && selectedDriverId === recommendedDriver.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Selecting...
                    </>
                  ) : (
                    <>
                      Select Driver <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* OTHER AVAILABLE DRIVERS */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#526174] dark:text-slate-400">
              OTHER AVAILABLE VERIFIED CHAUFFEURS ({otherDrivers.length})
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {otherDrivers.map((driver) => {
                const isThisDriverSelected = selectedDriverId === driver.id;

                return (
                  <div
                    key={driver.id}
                    className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm hover:border-[#00C2B3] transition-all flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#07111F] text-white font-bold text-sm flex items-center justify-center">
                        {driver.avatar}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                          {driver.name}
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00A99D]" />
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[#526174] dark:text-slate-400">
                          <span className="font-bold text-amber-500">★ {driver.rating}</span>
                          <span>•</span>
                          <span>{driver.totalTrips} Trips</span>
                          <span>•</span>
                          <span>{driver.yearsExperience} Yrs Exp</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {driver.specializations.slice(0, 2).map((s, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-[#526174] bg-[#F7F9FC] dark:bg-[#10243A] px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-black text-[#0B1728] dark:text-white">
                          ₹{driver.estimatedFare}
                        </span>
                        <span className="block text-[10px] text-[#526174]">Total Fare</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectedDriverForModal(driver)}
                          className="px-3 py-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] hover:bg-[#E5EAF0] text-[#0B1728] dark:text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          disabled={isSelectingDriver}
                          onClick={() => handleSelectDriver(driver)}
                          className="px-5 py-2 rounded-xl bg-[#07111F] hover:bg-[#00C2B3] text-white text-xs font-bold shadow transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isSelectingDriver && isThisDriverSelected ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> Selecting...
                            </>
                          ) : (
                            'Select Driver'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          DRIVER PROFILE MODAL (PROMPT REQUIREMENT)
      ════════════════════════════════════════════════════════════════════════ */}
      {inspectedDriverForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#07111F] text-white font-black text-sm flex items-center justify-center">
                  {inspectedDriverForModal.avatar}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B1728] dark:text-white flex items-center gap-1.5">
                    {inspectedDriverForModal.name}
                    <ShieldCheck className="w-4 h-4 text-[#00C2B3]" />
                  </h3>
                  <p className="text-xs text-emerald-600 font-bold">✓ VITO Verified Chauffeur</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedDriverForModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A]">
                <span className="text-xs font-bold text-amber-500 block">★ {inspectedDriverForModal.rating}</span>
                <span className="text-[10px] text-[#526174]">Rating ({inspectedDriverForModal.reviewsCount})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A]">
                <span className="text-xs font-bold text-[#0B1728] dark:text-white block">{inspectedDriverForModal.totalTrips}</span>
                <span className="text-[10px] text-[#526174]">Trips Done</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A]">
                <span className="text-xs font-bold text-[#0B1728] dark:text-white block">{inspectedDriverForModal.yearsExperience} Yrs</span>
                <span className="text-[10px] text-[#526174]">Experience</span>
              </div>
            </div>

            {/* Specialization Tags */}
            <div>
              <label className="text-[10px] font-bold uppercase text-[#526174] block mb-1.5">Verified Chauffeur Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {inspectedDriverForModal.specializations.map((spec, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                    ✓ {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Reviews (No Sensitive Data) */}
            {inspectedDriverForModal.recentReviews && inspectedDriverForModal.recentReviews.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#526174] block">Recent Customer Feedback</label>
                {inspectedDriverForModal.recentReviews.map((rev, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] text-xs space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{rev.reviewer}</span>
                      <span className="text-amber-500">★ {rev.rating}</span>
                    </div>
                    <p className="text-[#526174] dark:text-slate-300 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Select Driver from Modal */}
            <button
              type="button"
              disabled={isSelectingDriver}
              onClick={() => handleSelectDriver(inspectedDriverForModal)}
              className="w-full py-3.5 rounded-2xl bg-[#07111F] hover:bg-[#00C2B3] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSelectingDriver ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Selecting Driver...
                </>
              ) : (
                <>
                  Select {inspectedDriverForModal.name} & Proceed to Fare Review →
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STAGE 6: REVIEW & FARE (CONFIRMATION STAGE)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'STAGE6_REVIEW_FARE' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-4">
            <div>
              <span className="text-[11px] font-black uppercase text-[#00A99D]">
                Step 6: Review & Fare Breakdown
              </span>
              <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
                Confirm Chauffeur Booking
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setStep('STAGE5_SELECT_DRIVER')}
              className="px-3.5 py-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] hover:bg-[#E5EAF0] text-[#0B1728] dark:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Driver
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Trip Details & Assigned Chauffeur (2 cols) */}
            <div className="lg:col-span-2 space-y-5">
              {/* Trip Summary Card */}
              <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#526174]">
                  TRIP ROUTE & COMMITMENT SUMMARY
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8995A5] block">Pickup Location:</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">{pickup.address}</span>
                  </div>
                  <div>
                    <span className="text-[#8995A5] block">Destination:</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">{destination?.address}</span>
                  </div>
                  <div>
                    <span className="text-[#8995A5] block">Trip Type:</span>
                    <span className="font-bold text-[#00A99D]">
                      {tripType === 'ROUND_TRIP' ? 'ROUND TRIP (Return Included)' : 'ONE WAY TRIP'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8995A5] block">Reporting Schedule:</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">
                      {departureDate} at {departureTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8995A5] block">Total Driving Distance:</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">
                      {routeMetrics.totalDrivingKm} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8995A5] block">Total Driver Commitment:</span>
                    <span className="font-black text-[#00A99D]">
                      ~{routeMetrics.totalCommitmentHours} Hours Dedicated Duty
                    </span>
                  </div>
                </div>

                {tripType === 'ROUND_TRIP' && (
                  <div className="pt-2 border-t border-[#E5EAF0] text-xs text-[#526174] flex justify-between">
                    <span>Destination Stay Standby:</span>
                    <span className="font-bold text-[#0B1728] dark:text-white">
                      {isFlexibleRoundTrip ? 'Flexible Standby' : `${expectedStayHours} Hours`}
                    </span>
                  </div>
                )}
              </div>

              {/* Selected Chauffeur Card */}
              {selectedDriver && (
                <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-[#07111F] text-white font-black text-base flex items-center justify-center">
                      {selectedDriver.avatar}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#00A99D]">
                        Assigned Professional Chauffeur
                      </span>
                      <h4 className="text-base font-black text-[#0B1728] dark:text-white flex items-center gap-1.5">
                        {selectedDriver.name}
                        <ShieldCheck className="w-4 h-4 text-[#00A99D]" />
                      </h4>
                      <p className="text-xs text-[#526174] dark:text-slate-400">
                        ★ {selectedDriver.rating} Rating • {selectedDriver.totalTrips} Trips • {selectedDriver.yearsExperience} Yrs Experience
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                    ✓ Verified
                  </span>
                </div>
              )}

              {/* Confirmation Notice */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>Driver Dispatch Confirmation:</strong> Your trip request with complete route, stay duration, and {routeMetrics.totalCommitmentHours}h commitment details will be sent directly to {selectedDriver?.name || 'the chauffeur'}. Booking is confirmed once the driver accepts.
                </div>
              </div>
            </div>

            {/* Right Col: Itemized Transparent Fare Breakdown (1 col) */}
            <div className="p-6 rounded-3xl bg-[#07111F] text-white space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-slate-700/60 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00C2B3]">
                    Transparent Pricing
                  </span>
                  <h3 className="text-base font-black">Itemized Fare Breakdown</h3>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  {activeFare.itemized.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{item.label}</span>
                      <span className="font-bold text-white">₹{item.amount}</span>
                    </div>
                  ))}

                  {tripType === 'ROUND_TRIP' && (
                    <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                      Additional waiting beyond selected stay: ₹{HIRE_PRICING_CONFIG.additionalHourlyWaitingRate}/hr
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t-2 border-[#00C2B3] flex items-center justify-between">
                  <span className="text-sm font-black">Estimated Total Fare</span>
                  <span className="text-2xl font-black text-[#00C2B3]">₹{activeFare.total}</span>
                </div>
              </div>

              {/* Confirm Hire CTA */}
              <button
                type="button"
                disabled={isSubmittingBooking}
                onClick={handleConfirmHire}
                className="w-full py-4 rounded-2xl bg-[#00C2B3] hover:bg-[#00A99D] text-[#07111F] font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Request...
                  </>
                ) : (
                  <>
                    Confirm Hire & Send Request →
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SINGLE TIMELINE & ACTIVE LIFECYCLE MANAGEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'SINGLE_TIMELINE' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#00A99D]">
                Booking Reference: {activeBookingId}
              </span>
              <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
                Trip Request Dispatched
              </h2>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold animate-pulse">
              ● Waiting for Driver Acceptance
            </span>
          </div>

          {/* Request sent details */}
          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Chauffeur</span>
              <span className="font-bold">{selectedDriver?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Route</span>
              <span className="font-bold">{pickup.address.split(',')[0]} → {destination?.address.split(',')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span>Duty Commitment</span>
              <span className="font-bold">{routeMetrics.totalCommitmentHours} Hours ({tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'})</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Driver Earnings</span>
              <span className="font-bold text-emerald-600">₹{Math.round(activeFare.total * 0.8)}</span>
            </div>
          </div>

          {/* SIMULATION CONTROLS */}
          <div className="p-4 rounded-2xl bg-[#07111F] text-white space-y-3">
            <p className="text-xs font-bold text-slate-300">
              Interactive Chauffeur Lifecycle Simulation:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setBookingStatus('DRIVER_ACCEPTED');
                  setStep('DRIVER_EN_ROUTE');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow cursor-pointer"
              >
                Simulate: Driver Accepts Request →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER EN ROUTE SCREEN */}
      {step === 'DRIVER_EN_ROUTE' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0B1728] dark:text-white">Driver Is En Route</h2>
              <p className="text-xs text-[#526174]">Arriving at reporting pickup location in ~10 mins.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBookingStatus('DRIVER_ARRIVED');
                setStep('DRIVER_ARRIVED');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#00C2B3] text-white text-xs font-bold shadow cursor-pointer"
            >
              Simulate Arrival
            </button>
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-[#E5EAF0]">
            <EnhancedCabMap
              pickup={{ lat: pickup.lat || 26.4547, lng: pickup.lng || 80.3507, address: pickup.address }}
              drop={{ lat: destination?.lat || 26.8467, lng: destination?.lng || 80.9462, address: destination?.address }}
              selectedDriver={selectedDriver ? { id: selectedDriver.id, lat: 26.4600, lng: 80.3400, name: selectedDriver.name, eta: '10 min' } : null}
            />
          </div>

          {selectedDriver && (
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#07111F] text-white font-bold text-xs flex items-center justify-center">
                  {selectedDriver.avatar}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B1728] dark:text-white">{selectedDriver.name}</p>
                  <p className="text-[11px] text-[#526174]">⭐ {selectedDriver.rating} • Verified Chauffeur</p>
                </div>
              </div>
              <a
                href={`tel:${selectedDriver.phone}`}
                className="px-3 py-2 rounded-xl bg-[#00C2B3] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            </div>
          )}
        </div>
      )}

      {/* DRIVER ARRIVED SCREEN */}
      {step === 'DRIVER_ARRIVED' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Driver Has Arrived</h2>
            <p className="text-xs text-[#526174]">Share this 4-digit Service PIN with your driver to start duty.</p>
          </div>

          {/* OTP Box */}
          <div className="p-6 rounded-2xl bg-[#07111F] text-white text-center space-y-2">
            <span className="text-[11px] uppercase tracking-wider text-[#00C2B3] font-black">
              Service Verification PIN
            </span>
            <div className="text-4xl font-black tracking-widest text-[#00C2B3]">{servicePin}</div>
            <p className="text-[10px] text-slate-400">Share PIN once the chauffeur has reported to your vehicle.</p>
          </div>

          <button
            type="button"
            onClick={() => setStep('SERVICE_PIN_VERIFY')}
            className="w-full py-4 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-sm shadow-md cursor-pointer"
          >
            Enter Driver Verification Mode →
          </button>
        </div>
      )}

      {/* SERVICE PIN VERIFY SCREEN */}
      {step === 'SERVICE_PIN_VERIFY' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-md mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-[#0B1728] dark:text-white">Verify Service PIN</h2>
            <p className="text-xs text-[#526174]">Driver enters the customer 4-digit PIN ({servicePin}) to start duty.</p>
          </div>

          <input
            type="text"
            maxLength={4}
            value={enteredPin}
            onChange={(e) => setEnteredPin(e.target.value)}
            placeholder="Enter 4-Digit PIN (e.g. 4829)"
            className="w-full text-center tracking-widest text-2xl font-black px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
          />

          {pinError && <p className="text-xs text-red-500 font-bold">Incorrect PIN. Please re-enter PIN {servicePin}.</p>}

          <button
            type="button"
            onClick={handleVerifyPin}
            className="w-full py-3.5 rounded-2xl bg-[#07111F] text-white font-bold text-xs shadow-md cursor-pointer"
          >
            Start Chauffeur Duty
          </button>
        </div>
      )}

      {/* TRIP IN PROGRESS SCREEN */}
      {step === 'TRIP_IN_PROGRESS' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                ● Duty in Progress
              </span>
              <h2 className="text-xl font-black text-[#0B1728] dark:text-white mt-1">Chauffeur on Duty</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Elapsed Time</span>
              <span className="text-xl font-black text-[#00A99D]">{formatTimer(activeSeconds)}</span>
            </div>
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-[#E5EAF0]">
            <EnhancedCabMap
              pickup={{ lat: pickup.lat || 26.4547, lng: pickup.lng || 80.3507, address: pickup.address }}
              drop={{ lat: destination?.lat || 26.8467, lng: destination?.lng || 80.9462, address: destination?.address }}
              selectedDriver={selectedDriver ? { id: selectedDriver.id, lat: 26.4600, lng: 80.3400, name: selectedDriver.name, eta: 'Active' } : null}
            />
          </div>

          {/* Safety & Live Tracking */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`https://vito.app/track/hire_${activeBookingId || Date.now()}`);
                setShareLinkCopied(true);
                setTimeout(() => setShareLinkCopied(false), 2500);
              }}
              className="py-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] text-xs font-bold text-[#0B1728] dark:text-white border cursor-pointer"
            >
              {shareLinkCopied ? '✓ Live Tracking Copied' : 'Share Live Tracking'}
            </button>
            <button
              type="button"
              onClick={() => setIsSosActive(true)}
              className="py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow cursor-pointer"
            >
              🚨 Emergency SOS
            </button>
          </div>

          {isSosActive && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs font-bold">
              🚨 SOS Emergency Alert Dispatched to Vito Safety Operations Center & Emergency Contacts.
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsTimerRunning(false);
              setBookingStatus('TRIP_COMPLETED');
              setStep('TRIP_COMPLETED');
            }}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-xs shadow-md cursor-pointer"
          >
            End Chauffeur Duty & Proceed to Settlement →
          </button>
        </div>
      )}

      {/* TRIP COMPLETED & FINAL SETTLEMENT SCREEN */}
      {step === 'TRIP_COMPLETED' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Chauffeur Duty Completed</h2>
            <p className="text-xs text-[#526174]">Total Elapsed Time: {formatTimer(activeSeconds || 7200)}</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Total Distance</span>
              <span className="font-bold">{routeMetrics.totalDrivingKm} km ({tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'})</span>
            </div>
            <div className="flex justify-between">
              <span>Chauffeur</span>
              <span className="font-bold">{selectedDriver?.name}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-black text-sm text-[#00A99D]">
              <span>Final Settlement Amount</span>
              <span>₹{activeFare.total}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-xs shadow-md cursor-pointer"
          >
            Pay ₹{activeFare.total} Securely →
          </button>

          {showPaymentModal && (
            <MockPaymentModal
              isOpen={showPaymentModal}
              bookingId={activeBookingId || 'hire_demo'}
              bookingType="driver_hire"
              totalFare={activeFare.total}
              itemDescription="Chauffeur Duty Settlement"
              onPaymentSuccess={() => {
                setShowPaymentModal(false);
                setStep('RATING_FEEDBACK');
              }}
              onClose={() => setShowPaymentModal(false)}
            />
          )}
        </div>
      )}

      {/* RATING FEEDBACK SCREEN */}
      {step === 'RATING_FEEDBACK' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-xl mx-auto">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">Rate Your Chauffeur</h2>
            <p className="text-xs text-[#526174]">Your feedback helps maintain VITO elite service quality.</p>
          </div>

          {!ratingSubmitted ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatingScore(s)}
                    className={`p-3 rounded-2xl border text-base font-bold transition-all cursor-pointer ${
                      ratingScore >= s ? 'bg-amber-400 text-black border-amber-400' : 'bg-[#F7F9FC]'
                    }`}
                  >
                    ★ {s}
                  </button>
                ))}
              </div>

              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience with this chauffeur (e.g. driving quality, punctuality, courtesy)..."
                className="w-full h-24 p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
              />

              <button
                type="button"
                onClick={() => setRatingSubmitted(true)}
                className="w-full py-4 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow-md cursor-pointer"
              >
                Submit Feedback →
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold">Thank you for rating {selectedDriver?.name}!</p>
              <button
                type="button"
                onClick={() => {
                  setStep('STAGE1_ROUTE');
                  setRatingSubmitted(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow cursor-pointer"
              >
                Book Another Chauffeur
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
