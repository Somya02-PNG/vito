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
} from 'lucide-react';
import AddressAutocomplete, { PlaceResult } from '@/components/AddressAutocomplete';
import MockPaymentModal from '@/components/MockPaymentModal';

// Reusing existing Leaflet map from Cab module — strictly NO duplication!
const EnhancedCabMap = dynamic(() => import('@/components/cab/EnhancedCabMap'), { ssr: false });

// ─── 24-Step State Machine ──────────────────────────────────────────────────
export type DriverHireStep =
  | 'LANDING'              // Screen 1: Welcome & Value Prop
  | 'SERVICE_SELECT'       // Screen 2: 5 Service Types
  | 'PICKUP_LOCATION'      // Screen 3: Pickup Input (reusing AddressAutocomplete)
  | 'DESTINATION_LOCATION' // Screen 4: Destination (conditional)
  | 'DATE_TIME'            // Screen 5: Date & Start Time
  | 'DURATION_SELECT'      // Screen 6: Hours or Days + Return toggle
  | 'VEHICLE_INFO'         // Screen 7: Vehicle Type, Model, Transmission, Fuel
  | 'DRIVER_REQUIREMENTS'  // Screen 8: Experience, Languages, Skills, Preferences
  | 'PRICE_ESTIMATE'       // Screen 9: Itemized Price Breakdown
  | 'MATCHING_RADAR'       // Screen 10: Matching Radar
  | 'RECOMMENDED_DRIVERS'  // Screen 11: Recommended Scored Drivers List
  | 'DRIVER_PROFILE_VIEW'  // Screen 12: Full Driver Profile + Dynamic "Why this driver"
  | 'BOOKING_SUMMARY'      // Screen 13: Summary Card + Request CTA
  | 'DRIVER_SIDE_REQUEST'  // Screen 14: Driver Side Incoming Request Simulation
  | 'BOOKING_CONFIRMED'    // Screen 15: Confirmed Card or Declined Branch
  | 'UPCOMING_SERVICES'    // Screen 16: Scheduled Service Card & Cancellation Policy
  | 'REMINDER_ALERTS'      // Screen 17: 24h / 1h Before Notification View
  | 'DRIVER_EN_ROUTE'      // Screen 18: Live Map Tracking Driver to Pickup (Reused Map)
  | 'DRIVER_ARRIVED'       // Screen 19: Driver Arrived & Vehicle Match Checklist
  | 'SERVICE_PIN_VERIFY'   // Screen 20: 4-digit Service PIN Verification
  | 'ACTIVE_SERVICE'       // Screen 21: Duration Time Countdown & Extra Hours
  | 'SERVICE_COMPLETED'    // Screen 22: Final Billing & Payment
  | 'RATING_FEEDBACK'      // Screen 23: Multi-Dimension 4-Star Rating
  | 'HIRE_HISTORY';        // Screen 24: History in My Trips

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
  const [step, setStep] = useState<DriverHireStep>('LANDING');

  // Service Configuration
  const [serviceType, setServiceType] = useState<string>('full_day');
  const [pickup, setPickup] = useState<PlaceResult>({
    address: 'Connaught Place, New Delhi',
    lat: 28.6315,
    lng: 77.2167,
  });
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow default
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [hours, setHours] = useState<number>(8);
  const [durationDays, setDurationDays] = useState<number>(1);
  const [returnRequired, setReturnRequired] = useState<boolean>(true);

  // Vehicle Details (Screen 7)
  const [vehicleType, setVehicleType] = useState<string>('Sedan');
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>('Honda City');
  const [transmission, setTransmission] = useState<string>('Automatic');
  const [fuel, setFuel] = useState<string>('Petrol');

  // Driver Requirements (Screen 8)
  const [minExperience, setMinExperience] = useState<number>(5);
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English']);
  const [experienceTags, setExperienceTags] = useState<string[]>([
    'City driving',
    'Automatic vehicles',
  ]);
  const [preferences, setPreferences] = useState<string[]>(['Family travel']);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Results & Matched Drivers (Screen 10 & 11)
  const [loadingMatch, setLoadingMatch] = useState<boolean>(false);
  const [matchedDrivers, setMatchedDrivers] = useState<DriverCandidate[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverCandidate | null>(null);
  const [activeDriverHireId, setActiveDriverHireId] = useState<string | null>(null);
  const [servicePin, setServicePin] = useState<string>('4829');

  // Live Service & Extra Hours (Screen 21)
  const [serviceDurationLeftMinutes, setServiceDurationLeftMinutes] = useState<number>(480);
  const [extraHoursCount, setExtraHoursCount] = useState<number>(0);
  const [showExtraHoursModal, setShowExtraHoursModal] = useState<boolean>(false);
  const [driverArrivalProgress, setDriverArrivalProgress] = useState<number>(0);

  // Multi-Dimension Rating (Screen 23)
  const [ratingDriving, setRatingDriving] = useState<number>(5);
  const [ratingProf, setRatingProf] = useState<number>(5);
  const [ratingPunct, setRatingPunct] = useState<number>(5);
  const [ratingHandling, setRatingHandling] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // ─── Reusable Price Calculation (Screen 9) ──────────────────────────────────
  const calculatedFare = useMemo(() => {
    let baseService = 200;
    let durationCharge = 0;
    let outstationAllowance = 0;

    if (serviceType === 'hourly') {
      durationCharge = Math.max(2, hours) * (selectedDriver?.hourlyRate || 180);
      baseService = 150;
    } else if (serviceType === 'full_day') {
      durationCharge = Math.max(1, durationDays) * 1400;
      baseService = 200;
    } else if (serviceType === 'outstation') {
      durationCharge = Math.max(1, durationDays) * 1800;
      outstationAllowance = Math.max(1, durationDays) * 400;
      if (!returnRequired) outstationAllowance += 300;
    } else if (serviceType === 'airport') {
      baseService = 250;
      durationCharge = 450;
    } else if (serviceType === 'event') {
      baseService = 300;
      durationCharge = Math.max(4, hours) * 220;
    }

    if (vehicleType.toLowerCase().includes('luxury')) durationCharge += 300;

    const startH = parseInt(startTime.split(':')[0], 10) || 9;
    const endH = (startH + hours) % 24;
    const isNight = startH >= 22 || startH < 6 || endH >= 22 || endH < 6 || serviceType === 'outstation';
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
  }, [serviceType, hours, durationDays, returnRequired, startTime, vehicleType, selectedDriver]);

  // ─── API: Find Drivers & Matching Radar (Screen 10) ──────────────────────────
  const handleFindDrivers = async () => {
    setStep('MATCHING_RADAR');
    setLoadingMatch(true);

    try {
      const res = await fetchAPI<{ drivers: DriverCandidate[] }>('/api/driver-hire/match-drivers', {
        method: 'POST',
        body: {
          serviceType,
          hours,
          durationDays,
          isOutstation: serviceType === 'outstation',
          startTime,
          vehicleDetails: { type: vehicleType, makeModel: vehicleMakeModel, transmission, fuel },
          requirements: { minExperience, languages, experienceTags, preferences, specialNotes },
          bookingDate,
        },
      });

      setTimeout(() => {
        if (res.data?.drivers && res.data.drivers.length > 0) {
          setMatchedDrivers(res.data.drivers);
          setSelectedDriver(res.data.drivers[0]);
        }
        setLoadingMatch(false);
        setStep('RECOMMENDED_DRIVERS');
      }, 3000);
    } catch {
      setTimeout(() => {
        setLoadingMatch(false);
        setStep('RECOMMENDED_DRIVERS');
      }, 2500);
    }
  };

  // ─── API: Submit Booking Request (Screen 13) ─────────────────────────────────
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
          hours,
          durationDays,
          returnRequired,
          isOutstation: serviceType === 'outstation',
          vehicleDetails: { type: vehicleType, makeModel: vehicleMakeModel, transmission, fuel },
          requirements: { minExperience, languages, experienceTags, preferences, specialNotes },
          fareBreakdown: calculatedFare,
        },
      });

      if (res.data?.booking) {
        setActiveDriverHireId(res.data.booking._id);
        setServicePin(res.data.servicePin || '4829');
      }

      setStep('DRIVER_SIDE_REQUEST');
    } catch {
      setActiveDriverHireId('hire_demo_' + Date.now());
      setServicePin('4829');
      setStep('DRIVER_SIDE_REQUEST');
    }
  };

  // ─── Simulate Driver Arrival Animation (Screen 18 -> 19) ────────────────────
  const startDriverArrivalTracking = () => {
    setStep('DRIVER_EN_ROUTE');
    setDriverArrivalProgress(0);

    const duration = 6000;
    const interval = 100;
    let current = 0;
    const total = duration / interval;

    const timer = setInterval(() => {
      current++;
      setDriverArrivalProgress(current / total);
      if (current >= total) {
        clearInterval(timer);
        setStep('DRIVER_ARRIVED');
      }
    }, interval);
  };

  // ─── Start Active Service (Screen 20 -> 21) ──────────────────────────────────
  const handleVerifyServicePin = async () => {
    try {
      if (activeDriverHireId) {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/verify-pin`, {
          method: 'POST',
          body: { pin: servicePin },
        });
      }
      setStep('ACTIVE_SERVICE');
      setServiceDurationLeftMinutes(hours * 60);
    } catch {
      setStep('ACTIVE_SERVICE');
      setServiceDurationLeftMinutes(hours * 60);
    }
  };

  // ─── Add Extra Hours (Screen 21) ─────────────────────────────────────────────
  const handleConfirmExtraHours = async (addedHours: number) => {
    try {
      if (activeDriverHireId) {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/extra-hours`, {
          method: 'POST',
          body: { extraHours: addedHours },
        });
      }
      setExtraHoursCount((prev) => prev + addedHours);
      setServiceDurationLeftMinutes((prev) => prev + addedHours * 60);
      setShowExtraHoursModal(false);
    } catch {
      setExtraHoursCount((prev) => prev + addedHours);
      setServiceDurationLeftMinutes((prev) => prev + addedHours * 60);
      setShowExtraHoursModal(false);
    }
  };

  // ─── Complete Service & Submit Rating (Screen 22 & 23) ──────────────────────
  const handleCompleteService = async () => {
    try {
      if (activeDriverHireId) {
        await fetchAPI(`/api/driver-hire/${activeDriverHireId}/complete`, {
          method: 'POST',
          body: { paymentMethod: 'UPI' },
        });
      }
      setStep('SERVICE_COMPLETED');
      setShowPaymentModal(true);
    } catch {
      setStep('SERVICE_COMPLETED');
      setShowPaymentModal(true);
    }
  };

  const handleSubmitRating = async () => {
    try {
      if (activeDriverHireId) {
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
      }
      setStep('HIRE_HISTORY');
    } catch {
      setStep('HIRE_HISTORY');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ════════════════════════════════════════════════════════════════════════
          TOP STEP NAVIGATION & PROGRESS BREADCRUMB
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0] dark:border-[#17334F]">
        <div className="flex items-center gap-3">
          {step !== 'LANDING' && (
            <button
              onClick={() => {
                if (step === 'SERVICE_SELECT') setStep('LANDING');
                else if (step === 'PICKUP_LOCATION') setStep('SERVICE_SELECT');
                else if (step === 'DESTINATION_LOCATION') setStep('PICKUP_LOCATION');
                else if (step === 'DATE_TIME') setStep('DESTINATION_LOCATION');
                else if (step === 'DURATION_SELECT') setStep('DATE_TIME');
                else if (step === 'VEHICLE_INFO') setStep('DURATION_SELECT');
                else if (step === 'DRIVER_REQUIREMENTS') setStep('VEHICLE_INFO');
                else if (step === 'PRICE_ESTIMATE') setStep('DRIVER_REQUIREMENTS');
                else if (step === 'RECOMMENDED_DRIVERS') setStep('PRICE_ESTIMATE');
                else if (step === 'DRIVER_PROFILE_VIEW') setStep('RECOMMENDED_DRIVERS');
                else if (step === 'BOOKING_SUMMARY') setStep('RECOMMENDED_DRIVERS');
                else setStep('LANDING');
              }}
              className="w-8 h-8 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] hover:bg-[#E5EAF0] flex items-center justify-center text-[#526174] dark:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A45C]" />
              <p className="text-[10px] font-bold text-[#8C6A29] uppercase tracking-widest">
                VITO Professional Chauffeur Services
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1728] dark:text-white tracking-tight">
              {step === 'LANDING' && 'Hire a Professional Driver'}
              {step === 'SERVICE_SELECT' && 'Select Service Package'}
              {step === 'PICKUP_LOCATION' && 'Set Pickup Point'}
              {step === 'DESTINATION_LOCATION' && 'Set Destination'}
              {step === 'DATE_TIME' && 'Select Date & Reporting Time'}
              {step === 'DURATION_SELECT' && 'Choose Trip Duration'}
              {step === 'VEHICLE_INFO' && 'Your Vehicle Specifications'}
              {step === 'DRIVER_REQUIREMENTS' && 'Chauffeur Requirements & Skills'}
              {step === 'PRICE_ESTIMATE' && 'Itemized Fare Estimate'}
              {step === 'MATCHING_RADAR' && 'Matching Top-Rated Drivers...'}
              {step === 'RECOMMENDED_DRIVERS' && 'Recommended Verified Chauffeurs'}
              {step === 'DRIVER_PROFILE_VIEW' && 'Driver Credentials & Match Reasoning'}
              {step === 'BOOKING_SUMMARY' && 'Review & Request Chauffeur'}
              {step === 'DRIVER_SIDE_REQUEST' && 'Driver Response Console'}
              {step === 'BOOKING_CONFIRMED' && 'Booking Confirmed'}
              {step === 'UPCOMING_SERVICES' && 'Scheduled Service & Policies'}
              {step === 'REMINDER_ALERTS' && 'Service Reminders'}
              {step === 'DRIVER_EN_ROUTE' && 'Driver En Route to Pickup'}
              {step === 'DRIVER_ARRIVED' && 'Driver Arrived at Location'}
              {step === 'SERVICE_PIN_VERIFY' && 'Service PIN Verification'}
              {step === 'ACTIVE_SERVICE' && 'Active Chauffeur Duty'}
              {step === 'SERVICE_COMPLETED' && 'Service Completed & Billing'}
              {step === 'RATING_FEEDBACK' && 'Rate Your Chauffeur Experience'}
              {step === 'HIRE_HISTORY' && 'Driver Hire Booking History'}
            </h1>
          </div>
        </div>

        {step !== 'LANDING' && (
          <button
            onClick={() => setStep('LANDING')}
            className="text-xs font-semibold text-[#8995A5] hover:text-[#0B1728] px-3 py-1.5 rounded-xl border border-[#E5EAF0] dark:border-[#17334F]"
          >
            Start Over
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 1 — LANDING (Do NOT show marketplace immediately)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'LANDING' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#C9A45C]/15 text-[#8C6A29] flex items-center justify-center mx-auto shadow-sm">
            <UserCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1728] dark:text-white tracking-tight">
              Find the Right Driver for Your Journey
            </h2>
            <p className="text-sm text-[#526174] dark:text-slate-400 leading-relaxed font-medium">
              Professional, verified chauffeurs for your personal car. Whether for hourly city errands, full-day family travel, outstation highway trips, or wedding events — we match you with background-verified drivers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2 text-left">
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-1">
              <ShieldCheck className="w-5 h-5 text-[#16A67A]" />
              <p className="text-xs font-bold text-[#0B1728] dark:text-white">100% Background Verified</p>
              <p className="text-[11px] text-[#526174] dark:text-slate-400">Police verified & commercial license check</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-1">
              <Car className="w-5 h-5 text-[#00A99D]" />
              <p className="text-xs font-bold text-[#0B1728] dark:text-white">Your Car, Our Chauffeur</p>
              <p className="text-[11px] text-[#526174] dark:text-slate-400">Manual, automatic, EV, and luxury sedans</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-1">
              <Clock className="w-5 h-5 text-[#3984E8]" />
              <p className="text-xs font-bold text-[#0B1728] dark:text-white">Transparent Hourly Billing</p>
              <p className="text-[11px] text-[#526174] dark:text-slate-400">Zero hidden costs, OTP service tracking</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setStep('SERVICE_SELECT')}
              className="px-8 py-4 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-sm shadow-lg shadow-[#07111F]/20 flex items-center justify-center gap-2 mx-auto transition-all active:scale-95"
            >
              <span>Get Started — Select Service Type</span>
              <ArrowRight className="w-4 h-4 text-[#00C2B3]" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 2 — SERVICE TYPE SELECTION
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'SERVICE_SELECT' && (
        <div className="space-y-6">
          <div className="text-left space-y-1">
            <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Choose Service Type
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Selecting a service type dynamically adapts the duration, pricing rules, and driver matching requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_TYPES.map((srv) => {
              const isSelected = serviceType === srv.id;
              const Icon = srv.icon;
              return (
                <button
                  key={srv.id}
                  onClick={() => {
                    setServiceType(srv.id);
                    setStep('PICKUP_LOCATION');
                  }}
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
                    <div className="w-11 h-11 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center group-hover:scale-105 transition-transform">
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
                    <span className="text-xs font-bold text-[#0B1728] dark:text-white group-hover:translate-x-1 transition-transform">
                      Select →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 3 — PICKUP LOCATION (Reusing exact Cab AddressAutocomplete)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'PICKUP_LOCATION' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Where should the driver meet you?
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Provide your reporting address, home, office, or hotel where the driver will report.
            </p>
          </div>

          <div className="space-y-4">
            <AddressAutocomplete
              label="Pickup Location / Meeting Point"
              value={pickup.address}
              onChange={(val) => setPickup((prev) => ({ ...prev, address: val }))}
              placeholder="Search address or landmark..."
              onSelect={(place) => setPickup(place)}
            />

            <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A67A] shrink-0" />
              <div className="text-xs min-w-0">
                <span className="font-bold text-[#0B1728] dark:text-white block truncate">
                  Selected Meeting Point:
                </span>
                <span className="text-[#526174] dark:text-slate-400 truncate block">
                  {pickup.address}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (serviceType === 'hourly' || serviceType === 'full_day') {
                  setStep('DESTINATION_LOCATION');
                } else {
                  setStep('DESTINATION_LOCATION');
                }
              }}
              className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all"
            >
              Continue to Destination & Dates →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 4 — DESTINATION (Conditional by service type)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'DESTINATION_LOCATION' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Destination{' '}
              {serviceType === 'hourly' || serviceType === 'full_day'
                ? '(Optional for City Duty)'
                : '(Required for Outstation / Airport)'}
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              {serviceType === 'outstation'
                ? 'Specify outstation destination city (e.g. Jaipur, Agra, Chandigarh).'
                : 'Enter your primary destination or leave blank if you have multiple stops.'}
            </p>
          </div>

          <div className="space-y-4">
            <AddressAutocomplete
              label="Destination Address / City"
              value={destination?.address || ''}
              onChange={(val) => setDestination((prev) => prev ? { ...prev, address: val } : { address: val, lat: 28.5562, lng: 77.1000 })}
              placeholder="Enter destination city, terminal or address..."
              onSelect={(place) => setDestination(place)}
            />

            {/* Quick popular destination tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {['IGI Airport Terminal 3', 'Jaipur City Center', 'Agra Taj Express', 'Cyber City Gurugram'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDestination({ address: d, lat: 28.5562, lng: 77.1000 })}
                  className="px-3 py-1 rounded-full bg-[#F1F5F8] dark:bg-[#10243A] text-xs font-semibold text-[#526174] dark:text-slate-300 hover:bg-[#E5EAF0]"
                >
                  📍 {d}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('DATE_TIME')}
              className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all"
            >
              Continue to Date & Time →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 5 & 6 — DATE, TIME & DURATION
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'DATE_TIME' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Schedule & Duration
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Driver hire is scheduled in advance to ensure our top-rated chauffeurs are reserved exclusively for you.
            </p>
          </div>

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

          {/* Duration Options */}
          {serviceType === 'hourly' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block">
                Booking Duration (Hours)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 4, 6, 8].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHours(h)}
                    className={`py-3 rounded-2xl font-bold text-xs border transition-all ${
                      hours === h
                        ? 'bg-[#07111F] text-white border-[#07111F]'
                        : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] dark:text-slate-300 border-[#E5EAF0] dark:border-[#17334F]'
                    }`}
                  >
                    {h} Hours
                  </button>
                ))}
              </div>
            </div>
          )}

          {serviceType === 'outstation' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                  Trip Duration (Days)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDurationDays(d)}
                      className={`py-3 rounded-2xl font-bold text-xs border transition-all ${
                        durationDays === d
                          ? 'bg-[#07111F] text-white border-[#07111F]'
                          : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] dark:text-slate-300 border-[#E5EAF0] dark:border-[#17334F]'
                      }`}
                    >
                      {d} Day{d > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Return Required Toggle */}
              <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0B1728] dark:text-white">
                    Return to Origin Required?
                  </p>
                  <p className="text-[11px] text-[#526174] dark:text-slate-400">
                    Will the driver accompany you back to the pickup city?
                  </p>
                </div>
                <button
                  onClick={() => setReturnRequired(!returnRequired)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    returnRequired
                      ? 'bg-[#16A67A] text-white shadow-sm'
                      : 'bg-[#E5EAF0] text-[#526174]'
                  }`}
                >
                  {returnRequired ? 'Yes (Roundtrip)' : 'No (One-Way)'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setStep('VEHICLE_INFO')}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all"
          >
            Continue to Vehicle Details →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 7 — VEHICLE INFORMATION (Critical & unique to Driver Hire)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'VEHICLE_INFO' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Your Vehicle Information
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Our matching algorithm verifies that candidate drivers have verified driving experience with your exact vehicle transmission and body style.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                Vehicle Body Type
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
                  Vehicle Make & Model
                </label>
                <input
                  type="text"
                  value={vehicleMakeModel}
                  onChange={(e) => setVehicleMakeModel(e.target.value)}
                  placeholder="e.g. Honda City, Innova Crysta, BMW 320d"
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

            <div>
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                Fuel Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Petrol', 'Diesel', 'CNG', 'EV'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFuel(f)}
                    className={`py-2.5 rounded-2xl font-bold text-xs border transition-all ${
                      fuel === f
                        ? 'bg-[#00C2B3] text-white border-[#00C2B3]'
                        : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] dark:text-slate-300 border-[#E5EAF0] dark:border-[#17334F]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep('DRIVER_REQUIREMENTS')}
              className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all"
            >
              Continue to Driver Requirements →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 8 — DRIVER REQUIREMENTS & PREFERENCES
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'DRIVER_REQUIREMENTS' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Driver Experience & Preferences
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Specify your chauffeur criteria to calculate the weighted match score.
            </p>
          </div>

          <div className="space-y-5">
            {/* Driving Experience Radio */}
            <div>
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1.5">
                Minimum Driving Experience
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 10].map((exp) => (
                  <button
                    key={exp}
                    onClick={() => setMinExperience(exp)}
                    className={`py-3 rounded-2xl font-bold text-xs border transition-all ${
                      minExperience === exp
                        ? 'bg-[#07111F] text-white border-[#07111F]'
                        : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] dark:text-slate-300 border-[#E5EAF0] dark:border-[#17334F]'
                    }`}
                  >
                    {exp}+ Years
                  </button>
                ))}
              </div>
            </div>

            {/* Languages Checkboxes */}
            <div>
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1.5">
                Languages Spoken
              </label>
              <div className="flex flex-wrap gap-2">
                {['Hindi', 'English', 'Punjabi', 'Other Regional'].map((lang) => {
                  const active = languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() =>
                        setLanguages(active ? languages.filter((l) => l !== lang) : [...languages, lang])
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? 'bg-[#00C2B3]/15 text-[#00A99D] border-[#00C2B3]'
                          : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] border-[#E5EAF0]'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accessibility / Family Preferences */}
            <div>
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1.5">
                Optional Passenger & Accessibility Preferences
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Elderly passenger assistance',
                  'Family travel & kids',
                  'Night driving specialist',
                  'Long-distance experience',
                  'Female driver preferred',
                ].map((pref) => {
                  const active = preferences.includes(pref);
                  return (
                    <button
                      key={pref}
                      onClick={() =>
                        setPreferences(active ? preferences.filter((p) => p !== pref) : [...preferences, pref])
                      }
                      className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all flex items-center gap-2 ${
                        active
                          ? 'bg-[#16A67A]/10 text-[#16A67A] border-[#16A67A]'
                          : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] border-[#E5EAF0]'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${active ? 'bg-[#16A67A] text-white border-[#16A67A]' : 'border-[#CCD6E2]'}`}>
                        {active && '✓'}
                      </span>
                      <span>{pref}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Requirements Text */}
            <div>
              <label className="text-xs font-bold text-[#526174] dark:text-slate-400 block mb-1">
                Special Instructions (Optional)
              </label>
              <input
                type="text"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g. Needs to assist with heavy luggage, formal wedding dress code..."
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
              />
            </div>

            <button
              onClick={() => setStep('PRICE_ESTIMATE')}
              className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all"
            >
              Continue to Fare Breakdown →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 9 — PRICE ESTIMATE BREAKDOWN
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'PRICE_ESTIMATE' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Itemized Service Fare Estimate
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Calculated via VITO DriverPricingService with transparent rates and zero hidden charges.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#17334F]">
              <span className="text-[#526174] dark:text-slate-400">Base Booking Fee:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">₹{calculatedFare.baseService}</span>
            </div>

            <div className="flex justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#17334F]">
              <span className="text-[#526174] dark:text-slate-400">
                Duration Charge ({serviceType === 'hourly' ? `${hours} hrs` : `${durationDays} day(s)`}):
              </span>
              <span className="font-bold text-[#0B1728] dark:text-white">₹{calculatedFare.durationCharge}</span>
            </div>

            {calculatedFare.outstationAllowance > 0 && (
              <div className="flex justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#17334F]">
                <span className="text-[#526174] dark:text-slate-400">Outstation & Stay Allowance:</span>
                <span className="font-bold text-[#0B1728] dark:text-white">₹{calculatedFare.outstationAllowance}</span>
              </div>
            )}

            {calculatedFare.nightCharge > 0 && (
              <div className="flex justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#17334F]">
                <span className="text-[#526174] dark:text-slate-400">Night Duty Allowance (10 PM - 6 AM):</span>
                <span className="font-bold text-[#F4A340]">₹{calculatedFare.nightCharge}</span>
              </div>
            )}

            <div className="flex justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#17334F]">
              <span className="text-[#526174] dark:text-slate-400">Platform & 24/7 Safety Fee:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">₹{calculatedFare.platformFee}</span>
            </div>

            <div className="flex justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#17334F]">
              <span className="text-[#526174] dark:text-slate-400">GST (5%):</span>
              <span className="font-bold text-[#0B1728] dark:text-white">₹{calculatedFare.taxes}</span>
            </div>

            <div className="flex justify-between pt-2 text-sm font-black">
              <span className="text-[#0B1728] dark:text-white">Estimated Total:</span>
              <span className="text-[#00A99D]">₹{calculatedFare.estimatedTotal}</span>
            </div>
          </div>

          <button
            onClick={handleFindDrivers}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all flex items-center justify-center gap-2"
          >
            <span>Find & Match Drivers</span>
            <Sparkles className="w-4 h-4 text-[#00C2B3]" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 10 — MATCHING RADAR (Weighted Score Computation)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'MATCHING_RADAR' && (
        <div className="p-12 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-center space-y-6 max-w-md mx-auto">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#00C2B3]/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-[#C9A45C]/40 animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-[#07111F] text-white flex items-center justify-center shadow-lg">
              <UserCheck className="w-7 h-7 text-[#00C2B3]" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-[#0B1728] dark:text-white">
              Scoring Candidate Chauffeurs...
            </h3>
            <p className="text-xs text-[#526174] dark:text-slate-400 mt-1 leading-relaxed">
              Evaluating verified drivers on {vehicleMakeModel} ({transmission}) compatibility, {minExperience}+ yrs experience, and schedule availability.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 11 — RECOMMENDED DRIVERS LIST (Ranked by Match %)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'RECOMMENDED_DRIVERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
                Recommended Drivers — {matchedDrivers.length} Candidates Matched
              </h2>
              <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
                Ranked by weighted algorithm matching your vehicle transmission, experience, and service criteria.
              </p>
            </div>
            <span className="badge-vito-available">
              Verified Chauffeurs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchedDrivers.map((driver) => (
              <div
                key={driver.id}
                className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top: Avatar + Name + Checkmark + Match % */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#07111F] text-white flex items-center justify-center text-sm font-black uppercase shadow-sm">
                        {driver.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-[#0B1728] dark:text-white">
                            {driver.name}
                          </h4>
                          <ShieldCheck className="w-4 h-4 text-[#16A67A]" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className="font-bold text-[#8C6A29] flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-[#C9A45C] text-[#C9A45C]" />
                            {driver.rating}
                          </span>
                          <span className="text-[#8995A5]">·</span>
                          <span className="text-[#526174] dark:text-slate-400">{driver.totalTrips}+ trips</span>
                        </div>
                      </div>
                    </div>

                    <span className="badge-vito-gold">
                      ★ {driver.matchPercentage}% Match
                    </span>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1">
                    {driver.skills.slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-[#F1F5F8] dark:bg-[#10243A] text-[10px] font-semibold text-[#526174] dark:text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Verification Badges (Identical pattern) */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F7F2] text-[#16A67A] text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      DL Verified
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EDF4FD] text-[#3984E8] text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      Background Verified
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-black text-[#0B1728] dark:text-white">
                      ₹{driver.calculatedPrice || calculatedFare.estimatedTotal}
                    </span>
                    <span className="text-[10px] text-[#8995A5] block">Est. for duration</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setStep('DRIVER_PROFILE_VIEW');
                      }}
                      className="px-3 py-2 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] text-xs font-bold text-[#526174] dark:text-slate-300 hover:bg-[#E5EAF0]"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setStep('BOOKING_SUMMARY');
                      }}
                      className="px-3 py-2 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm hover:bg-[#0B1728]"
                    >
                      Select Driver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 12 — DRIVER PROFILE FULL VIEW (Dynamic "Why this driver?")
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'DRIVER_PROFILE_VIEW' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5EAF0] dark:border-[#17334F]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-[#07111F] text-white flex items-center justify-center text-xl font-black uppercase shadow-md">
                {selectedDriver.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[#0B1728] dark:text-white">
                    {selectedDriver.name}
                  </h3>
                  <span className="badge-vito-gold">
                    ★ {selectedDriver.matchPercentage}% Match
                  </span>
                </div>
                <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
                  ⭐ {selectedDriver.rating} Rating · {selectedDriver.totalTrips}+ Trips · {selectedDriver.experienceYears} Years Experience
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep('RECOMMENDED_DRIVERS')}
              className="p-2 rounded-xl bg-[#F1F5F8] text-[#526174]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic "Why this driver?" Section */}
          <div className="p-4 rounded-2xl bg-[#F0FCFB] dark:bg-[#10243A] border border-[#00C2B3]/30 space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#00A99D] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Why this driver matches your requirements?
            </h4>
            <div className="space-y-1">
              {selectedDriver.matchReasons?.map((reason, i) => (
                <p key={i} className="text-xs text-[#0B1728] dark:text-slate-200 font-medium">
                  ✓ {reason}
                </p>
              ))}
            </div>
          </div>

          {/* Verified Badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8995A5]">
              Verified Credentials
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] text-xs font-semibold text-[#16A67A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Commercial DL Verified (RTO)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] text-xs font-semibold text-[#16A67A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Police Background Clear</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('BOOKING_SUMMARY')}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all"
          >
            Select & Review Booking Summary →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 13 — BOOKING SUMMARY ("Request Driver" CTA)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'BOOKING_SUMMARY' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Review Driver Hire Request
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              This sends a booking request to the selected chauffeur.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Chauffeur:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">{selectedDriver.name} (⭐ {selectedDriver.rating})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Service Type:</span>
              <span className="font-bold text-[#0B1728] dark:text-white uppercase">{serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Schedule:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">{bookingDate} at {startTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Pickup Location:</span>
              <span className="font-bold text-[#0B1728] dark:text-white truncate max-w-[280px]">{pickup.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Your Vehicle:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">{vehicleMakeModel} ({transmission} {fuel})</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E5EAF0] dark:border-[#17334F] text-sm font-black">
              <span>Estimated Fare:</span>
              <span className="text-[#00A99D]">₹{selectedDriver.calculatedPrice || calculatedFare.estimatedTotal}</span>
            </div>
          </div>

          <button
            onClick={handleRequestBooking}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all flex items-center justify-center gap-2"
          >
            <span>Request Driver</span>
            <ArrowRight className="w-4 h-4 text-[#00C2B3]" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 14 — DRIVER SIDE: INCOMING REQUEST SIMULATION
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'DRIVER_SIDE_REQUEST' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl space-y-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#17334F]">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#00C2B3] animate-pulse" />
              <h3 className="text-sm font-black tracking-wider uppercase text-[#00C2B3]">
                Driver Console · Incoming Duty Request
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00C2B3]/20 text-[#00C2B3]">
              Active Slot
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-sm font-bold text-white">
              Customer: {user?.name || 'Traveler'} (ID: #VITO-DH-204)
            </p>
            <div className="p-4 rounded-2xl bg-[#0B1728] border border-[#17334F] space-y-2">
              <p><strong>Package:</strong> {serviceType.toUpperCase()} ({hours} Hours)</p>
              <p><strong>Pickup:</strong> {pickup.address}</p>
              <p><strong>Vehicle:</strong> {vehicleMakeModel} ({transmission} · {fuel})</p>
              <p><strong>Schedule:</strong> {bookingDate} at {startTime}</p>
              <p className="text-[#00C2B3] font-bold text-sm pt-1 border-t border-[#17334F]">
                Estimated Driver Earnings: ₹{Math.round((selectedDriver.calculatedPrice || calculatedFare.estimatedTotal) * 0.85)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                setStep('BOOKING_CONFIRMED');
              }}
              className="py-3.5 rounded-xl bg-[#16A67A] hover:bg-[#128864] text-white font-bold text-xs shadow-md transition-all"
            >
              ✓ Accept Request
            </button>
            <button
              onClick={() => {
                alert('Simulated decline: Auto-suggesting next best match.');
                setStep('RECOMMENDED_DRIVERS');
              }}
              className="py-3.5 rounded-xl bg-[#E5484D] hover:bg-[#C93B40] text-white font-bold text-xs shadow-md transition-all"
            >
              ✗ Decline Request
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 15 — BOOKING CONFIRMED
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'BOOKING_CONFIRMED' && selectedDriver && (
        <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#16A67A]/10 text-[#16A67A] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#0B1728] dark:text-white">
              Booking Confirmed!
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Booking Reference: <strong className="text-[#0B1728] dark:text-white">#VITO-DH-8491</strong>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] text-left text-xs space-y-2">
            <p><strong>Driver:</strong> {selectedDriver.name} ({selectedDriver.phone})</p>
            <p><strong>Date & Time:</strong> {bookingDate} at {startTime}</p>
            <p><strong>Service:</strong> {serviceType.toUpperCase()} ({hours} Hours)</p>
            <p><strong>Meeting Point:</strong> {pickup.address}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('UPCOMING_SERVICES')}
              className="flex-1 py-3.5 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] text-xs font-bold text-[#526174] dark:text-slate-300"
            >
              View Upcoming Service Card
            </button>
            <button
              onClick={startDriverArrivalTracking}
              className="flex-1 py-3.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm"
            >
              Track Driver Arrival →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 16 — UPCOMING SERVICES LIST & CANCELLATION POLICY
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'UPCOMING_SERVICES' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0B1728] dark:text-white">
              Scheduled Driver Hire Service
            </h3>
            <span className="badge-vito-available">
              Confirmed
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-white flex items-center justify-center text-xs font-black">
                {selectedDriver.avatar}
              </div>
              <div>
                <p className="font-bold text-[#0B1728] dark:text-white">{selectedDriver.name}</p>
                <p className="text-[#526174] dark:text-slate-400">Reporting on {bookingDate} at {startTime}</p>
              </div>
            </div>

            {/* Cancellation Policy Banner */}
            <div className="p-3 rounded-xl bg-[#FEF6EB] text-[#8C6A29] border border-[#F4A340]/30 text-[11px] leading-relaxed">
              <strong>Cancellation Policy:</strong> Free cancellation up to 6 hours before reporting time. Cancellations within 6 hours incur a ₹200 driver compensation fee.
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('REMINDER_ALERTS')}
              className="flex-1 py-3.5 rounded-xl bg-[#F1F5F8] text-xs font-bold text-[#526174]"
            >
              View Reminders
            </button>
            <button
              onClick={startDriverArrivalTracking}
              className="flex-1 py-3.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm"
            >
              Start Live Duty Tracking →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 17 — REMINDERS HOOK
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'REMINDER_ALERTS' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4 max-w-xl mx-auto">
          <h3 className="text-base font-bold text-[#0B1728] dark:text-white">
            Automated In-App Reminders
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F0FCFB] border border-[#00C2B3]/30">
              <p className="font-bold text-[#00A99D]">🔔 24 Hours Before Reminder</p>
              <p className="text-[#526174] mt-0.5">Your driver service is scheduled tomorrow at {startTime}. Meeting location: {pickup.address}.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F0FCFB] border border-[#00C2B3]/30">
              <p className="font-bold text-[#00A99D]">🔔 1 Hour Before Arrival Alert</p>
              <p className="text-[#526174] mt-0.5">{selectedDriver.name} is preparing and will arrive at your pickup in approximately 1 hour.</p>
            </div>
          </div>
          <button
            onClick={startDriverArrivalTracking}
            className="w-full py-3.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm"
          >
            Track Driver Arrival →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 18 & 19 — DRIVER ARRIVAL (Reusing EnhancedCabMap!)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'DRIVER_EN_ROUTE' && selectedDriver && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-[#07111F] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#00C2B3] animate-pulse" />
              <div>
                <h3 className="text-sm font-black">Driver is On The Way</h3>
                <p className="text-xs text-slate-400">{selectedDriver.name} is arriving at your meeting point</p>
              </div>
            </div>
            <span className="badge-vito-live">
              ETA: 3 mins
            </span>
          </div>

          <div className="h-[420px] rounded-3xl overflow-hidden shadow-lg border border-[#E5EAF0]">
            <EnhancedCabMap
              pickup={{ lat: pickup.lat, lng: pickup.lng, address: pickup.address }}
              selectedDriver={{
                id: selectedDriver.id,
                name: selectedDriver.name,
                lat: selectedDriver.lat + (pickup.lat - selectedDriver.lat) * driverArrivalProgress,
                lng: selectedDriver.lng + (pickup.lng - selectedDriver.lng) * driverArrivalProgress,
                vehicleModel: 'Driver on foot / transit',
                rating: selectedDriver.rating,
                eta: '3 mins',
              }}
              liveEtaText="3 min"
              activeStep="DRIVER_EN_ROUTE"
            />
          </div>
        </div>
      )}

      {step === 'DRIVER_ARRIVED' && selectedDriver && (
        <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] shadow-sm text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#16A67A]/10 text-[#16A67A] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#0B1728] dark:text-white">
              Driver Arrived at Meeting Point
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400 mt-1">
              Please verify driver credentials before sharing the Service PIN.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#16A67A] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>3-Point Pre-Duty Safety Checklist</span>
            </div>
            <p>✓ Match Driver Name: {selectedDriver.name}</p>
            <p>✓ Match Driver Photo & ID Badge</p>
            <p>✓ Hand over vehicle keys for {vehicleMakeModel}</p>
          </div>

          <button
            onClick={() => setStep('SERVICE_PIN_VERIFY')}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728]"
          >
            Proceed to Service PIN Verification →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 20 — SERVICE PIN VERIFICATION
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'SERVICE_PIN_VERIFY' && (
        <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] shadow-sm text-center space-y-6 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-black text-[#0B1728] dark:text-white">
              Share 4-Digit Service PIN
            </h3>
            <p className="text-xs text-[#526174] dark:text-slate-400 mt-1">
              Show this PIN to your chauffeur to officially begin the duty timer.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#07111F] text-white">
            <p className="text-[10px] uppercase tracking-widest text-[#00C2B3] font-bold mb-1">
              Duty Start PIN
            </p>
            <p className="text-4xl font-mono font-black tracking-widest text-white">
              {servicePin}
            </p>
          </div>

          <button
            onClick={handleVerifyServicePin}
            className="w-full py-4 rounded-2xl bg-[#00C2B3] hover:bg-[#00A99D] text-white font-bold text-sm shadow-md transition-all"
          >
            ⚡ Auto-Verify PIN & Start Duty (Demo)
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 21 — ACTIVE SERVICE (Duration Countdown & Extra Hours)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'ACTIVE_SERVICE' && selectedDriver && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00C2B3] text-white flex items-center justify-center text-sm font-black">
                {selectedDriver.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedDriver.name}</h3>
                  <span className="badge-vito-live">Duty Active</span>
                </div>
                <p className="text-xs text-slate-400">
                  Vehicle: {vehicleMakeModel} ({transmission}) · Started at {startTime}
                </p>
              </div>
            </div>

            <div className="text-right flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Time Remaining</span>
                <span className="text-xl font-mono font-black text-[#00C2B3]">
                  {Math.floor(serviceDurationLeftMinutes / 60)}h {serviceDurationLeftMinutes % 60}m
                </span>
              </div>

              <button
                onClick={() => setShowExtraHoursModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              >
                + Add Hours
              </button>
            </div>
          </div>

          {/* Time Tracking Progress Bars */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] shadow-sm space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span>Booked: {hours + extraHoursCount} Hours</span>
              <span className="text-[#16A67A]">In-Service</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#F1F5F8] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00C2B3] to-[#16A67A] w-[65%]" />
            </div>
            <div className="flex justify-between text-[11px] text-[#8995A5]">
              <span>Started at {startTime}</span>
              <span>Extra Hours Added: {extraHoursCount} hrs</span>
            </div>
          </div>

          <button
            onClick={handleCompleteService}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728] transition-all"
          >
            End Service & View Final Bill →
          </button>

          {/* Extra Hours Confirmation Modal */}
          {showExtraHoursModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] shadow-2xl space-y-4 text-center">
                <h3 className="text-base font-bold text-[#0B1728] dark:text-white">
                  Extend Chauffeur Duty
                </h3>
                <p className="text-xs text-[#526174] dark:text-slate-400">
                  Additional hours are charged at the driver standard rate of ₹{selectedDriver.hourlyRate}/hr.
                </p>

                <div className="grid grid-cols-3 gap-2 py-2">
                  {[1, 2, 4].map((ext) => (
                    <button
                      key={ext}
                      onClick={() => handleConfirmExtraHours(ext)}
                      className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] hover:bg-[#00C2B3]/10 border border-[#E5EAF0] text-xs font-bold text-[#0B1728] dark:text-white"
                    >
                      +{ext} Hr (₹{ext * selectedDriver.hourlyRate})
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowExtraHoursModal(false)}
                  className="w-full py-2.5 text-xs text-[#8995A5] font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 22 — SERVICE COMPLETION & FINAL BILLING
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'SERVICE_COMPLETED' && selectedDriver && (
        <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] shadow-sm text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#16A67A]/10 text-[#16A67A] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#0B1728] dark:text-white">
              Service Completed
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400 mt-1">
              Final duty billing has been compiled. Total hours served: {hours + extraHoursCount} hrs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Base + Duration:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">₹{calculatedFare.durationCharge}</span>
            </div>
            {extraHoursCount > 0 && (
              <div className="flex justify-between">
                <span className="text-[#8995A5]">Extra Hours ({extraHoursCount} hrs):</span>
                <span className="font-bold text-[#0B1728] dark:text-white">₹{extraHoursCount * selectedDriver.hourlyRate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Platform & Safety Fee:</span>
              <span className="font-bold text-[#0B1728] dark:text-white">₹{calculatedFare.platformFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8995A5]">Taxes (GST 5%):</span>
              <span className="font-bold text-[#0B1728] dark:text-white">₹{calculatedFare.taxes}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E5EAF0] text-sm font-black">
              <span>Total Settled:</span>
              <span className="text-[#00A99D]">₹{calculatedFare.estimatedTotal + extraHoursCount * selectedDriver.hourlyRate}</span>
            </div>
          </div>

          <button
            onClick={() => setStep('RATING_FEEDBACK')}
            className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728]"
          >
            Rate Chauffeur & Leave Review →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 23 — MULTI-DIMENSION 4-STAR RATING
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'RATING_FEEDBACK' && selectedDriver && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] shadow-sm space-y-6 max-w-xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-[#0B1728] dark:text-white">
              Rate {selectedDriver.name}
            </h3>
            <p className="text-xs text-[#526174] dark:text-slate-400">
              Multi-dimension ratings help maintain elite quality and calibrate driver trust scores.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Safe Driving & Smooth Handling', value: ratingDriving, setter: setRatingDriving },
              { label: 'Professionalism & Courtesy', value: ratingProf, setter: setRatingProf },
              { label: 'Punctuality & Reporting', value: ratingPunct, setter: setRatingPunct },
              { label: 'Vehicle Care & Cleanliness', value: ratingHandling, setter: setRatingHandling },
            ].map((dim, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A]">
                <span className="text-xs font-semibold text-[#0B1728] dark:text-white">{dim.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => dim.setter(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-5 h-5 ${star <= dim.value ? 'fill-[#C9A45C] text-[#C9A45C]' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Leave an optional review for the chauffeur..."
              rows={3}
              className="w-full p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] text-xs font-semibold outline-none focus:border-[#00C2B3]"
            />

            <button
              onClick={handleSubmitRating}
              className="w-full py-4 rounded-2xl bg-[#07111F] text-white font-bold text-sm shadow-md hover:bg-[#0B1728]"
            >
              Submit Rating & View in History →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SCREEN 24 — DRIVER HIRE HISTORY
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'HIRE_HISTORY' && (
        <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] shadow-sm text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center mx-auto shadow-sm">
            <Compass className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
              Duty Recorded in My Trips!
            </h2>
            <p className="text-xs text-[#526174] dark:text-slate-400 mt-1">
              Your driver hire duty record and tax invoice are archived in your customer profile.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/customer/trips"
              className="flex-1 py-3.5 rounded-xl bg-[#F1F5F8] text-xs font-bold text-[#526174] text-center"
            >
              Go to My Trips
            </Link>
            <button
              onClick={() => setStep('LANDING')}
              className="flex-1 py-3.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm"
            >
              Book Another Driver
            </button>
          </div>
        </div>
      )}

      {/* Mock Payment Settlement Modal */}
      {showPaymentModal && (
        <MockPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={activeDriverHireId || 'dh_demo_101'}
          bookingType="driver_hire"
          totalFare={calculatedFare.estimatedTotal + extraHoursCount * (selectedDriver?.hourlyRate || 180)}
          itemDescription={`VITO Chauffeur Duty — ${selectedDriver?.name} (${hours + extraHoursCount} hrs)`}
          driverId={selectedDriver?.id}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            setStep('RATING_FEEDBACK');
          }}
        />
      )}
    </div>
  );
}
