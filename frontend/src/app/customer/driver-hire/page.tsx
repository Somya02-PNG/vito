'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
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
} from 'lucide-react';
import DriverTrustCard, { DriverTrustProfile } from '@/components/driver/DriverTrustCard';

interface DriverHireService {
  id: string;
  name: string;
  desc: string;
  rateLabel: string;
  recommended: boolean;
}

const HIRE_PLANS: DriverHireService[] = [
  {
    id: 'hourly',
    name: 'Hourly City Chauffeur',
    desc: 'For local errands, office commute, multiple city meetings, or evening dining',
    rateLabel: 'Starting from ₹160 / hour (Min 4 hrs)',
    recommended: false,
  },
  {
    id: 'full_day',
    name: 'Full Day (8 - 12 Hours)',
    desc: 'Dedicated professional driver for full-day family travel or business trips',
    rateLabel: 'Fixed ₹1,400 / 8 hrs + overtime',
    recommended: true,
  },
  {
    id: 'outstation',
    name: 'Outstation Multi-Day',
    desc: 'Experienced highway drivers for Jaipur, Agra, Chandigarh, Himachal & Uttarakhand',
    rateLabel: '₹1,800 / day + night allowance',
    recommended: false,
  },
];

const VERIFIED_CHAUFFEURS: DriverTrustProfile[] = [
  {
    id: 'd1',
    name: 'Ramesh Chandra',
    avatar: 'RC',
    rating: 4.92,
    totalTrips: 1140,
    experienceYears: 9,
    vehicleModel: 'Luxury Sedans & Automatic Cars',
    vehiclePlate: 'DL 01 AB 4829',
    phone: '+91 98765 12345',
    hourlyRate: 180,
    bestMatchPercentage: 98,
    matchReasons: [
      '9 years professional driving experience',
      'Familiar with VIP & luxury automatic sedans',
      '⭐ 4.92 rating across 1,140+ completed trips',
      'Police background verified & zero incident record',
      'Fluent in English & Hindi',
    ],
    verifiedBadges: ['Identity Verified', 'Driving License Verified', 'Police Background Verified'],
  },
  {
    id: 'd2',
    name: 'Gurpreet Singh',
    avatar: 'GS',
    rating: 4.95,
    totalTrips: 1480,
    experienceYears: 12,
    vehicleModel: 'SUVs & Outstation Long Hauls',
    vehiclePlate: 'DL 04 XY 7741',
    phone: '+91 97111 54321',
    hourlyRate: 220,
    bestMatchPercentage: 94,
    matchReasons: [
      '12 years highway & hills driving experience',
      'Specialized in Innova, Fortuner, and large SUVs',
      '⭐ 4.95 highest client trust rating',
      'Certified in defensive driving & first aid',
    ],
    verifiedBadges: ['Identity Verified', 'Driving License Verified', 'Police Background Verified'],
  },
  {
    id: 'd3',
    name: 'Sunita Malhotra',
    avatar: 'SM',
    rating: 4.88,
    totalTrips: 890,
    experienceYears: 7,
    vehicleModel: 'City Commute & Night Duty',
    vehiclePlate: 'DL 03 EV 9102',
    phone: '+91 98123 67890',
    hourlyRate: 170,
    bestMatchPercentage: 91,
    matchReasons: [
      '7 years commercial driving expertise',
      'Top-rated for punctuality and polite conduct',
      'Verified background & valid commercial badge',
    ],
    verifiedBadges: ['Identity Verified', 'Driving License Verified', 'Police Background Verified'],
  },
];

function DriverHirePageContent() {
  const [selectedPlan, setSelectedPlan] = useState<string>('full_day');
  const [selectedDriver, setSelectedDriver] = useState<DriverTrustProfile | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Form states
  const [city, setCity] = useState('Delhi NCR');
  const [date, setDate] = useState('2026-08-16');
  const [time, setTime] = useState('09:00 AM');
  const [carType, setCarType] = useState('Manual / Automatic Sedan');

  const handleBookDriver = (driver: DriverTrustProfile) => {
    setSelectedDriver(driver);
    setBookingConfirmed(true);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ─── Header: Professional Service Tone ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C9A45C]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#8C6A29]">
            Professional Chauffeur Services
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1728] dark:text-white tracking-tight">
          Hire a Verified Professional Driver
        </h1>
        <p className="text-sm sm:text-base text-[#526174] dark:text-slate-400 mt-1 font-medium">
          Pre-screened, background-verified chauffeurs for your personal car on hourly, daily, or outstation hire.
        </p>
      </div>

      {/* ─── 1. Package Selection Cards ─────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#8995A5] uppercase tracking-wider">
          Step 1: Choose Service Package
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HIRE_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-5 rounded-2xl text-left border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#F0FCFB] dark:bg-[#10243A] border-[#00C2B3] shadow-[0_4px_20px_rgba(0,194,179,0.15)] ring-1 ring-[#00C2B3]'
                    : 'bg-[#FFFFFF] dark:bg-[#0B1728] border-[#E5EAF0] dark:border-[#17334F] hover:border-[#CCD6E2]'
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#C9A45C] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0B1728] dark:text-white">
                      {plan.name}
                    </h4>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#00C2B3] border-[#00C2B3] text-white'
                          : 'border-[#CCD6E2]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-[#526174] dark:text-slate-400 leading-relaxed">
                    {plan.desc}
                  </p>
                </div>

                <p className="text-xs font-black text-[#00A99D] pt-4 mt-2 border-t border-[#E5EAF0] dark:border-[#17334F]">
                  {plan.rateLabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Trip Details Form ───────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-[#8995A5] uppercase tracking-wider">
          Step 2: Service Location & Schedule
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-[#526174] dark:text-slate-400 block mb-1">
              City / Region
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#526174] dark:text-slate-400 block mb-1">
              Reporting Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#526174] dark:text-slate-400 block mb-1">
              Reporting Time
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#526174] dark:text-slate-400 block mb-1">
              Your Vehicle Transmission
            </label>
            <select
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none focus:border-[#00C2B3]"
            >
              <option>Automatic Sedan / Hatchback</option>
              <option>Manual Sedan / Hatchback</option>
              <option>Automatic SUV / MUV</option>
              <option>Manual SUV / MUV</option>
              <option>Luxury European Car (BMW/Audi/Merc)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 3. Top Matched Drivers Grid with Best Match Framing ────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0B1728] dark:text-white uppercase tracking-wider">
              Step 3: Available Chauffeurs (Best Matches)
            </h3>
            <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
              Ranked by experience, vehicle transmission familiarity, and customer ratings.
            </p>
          </div>
          <span className="badge-vito-available">
            3 Chauffeurs Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {VERIFIED_CHAUFFEURS.map((driver) => (
            <DriverTrustCard
              key={driver.id}
              driver={driver}
              onSelect={() => handleBookDriver(driver)}
              actionLabel="Hire Chauffeur"
              variant="hire"
            />
          ))}
        </div>
      </div>

      {/* ─── Booking Confirmation Modal ─────────────────────────────────────── */}
      {bookingConfirmed && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#16A67A]/10 text-[#16A67A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-[#0B1728] dark:text-white">
                Chauffeur Booking Confirmed!
              </h3>
              <p className="text-xs text-[#526174] dark:text-slate-400 mt-1">
                Your booking reference is <strong className="text-[#0B1728] dark:text-white">#VITO-DH-8491</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8995A5]">Assigned Chauffeur:</span>
                <span className="font-bold text-[#0B1728] dark:text-white">{selectedDriver.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8995A5]">Schedule:</span>
                <span className="font-bold text-[#0B1728] dark:text-white">{date} at {time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8995A5]">Vehicle:</span>
                <span className="font-bold text-[#0B1728] dark:text-white">{carType}</span>
              </div>
              <div className="flex justify-between border-t border-[#E5EAF0] dark:border-[#17334F] pt-2">
                <span className="font-bold text-[#0B1728] dark:text-white">Rate:</span>
                <span className="font-black text-[#00A99D]">₹{selectedDriver.hourlyRate}/hr</span>
              </div>
            </div>

            <button
              onClick={() => setBookingConfirmed(false)}
              className="w-full py-3.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-md hover:bg-[#0B1728]"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDriverHirePage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <DriverHirePageContent />
    </ProtectedRoute>
  );
}
