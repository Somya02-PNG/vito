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
} from 'lucide-react';

interface RecentRide {
  _id: string;
  pickup: { address: string };
  drop: { address: string };
  fare: number;
  status: string;
  createdAt: string;
}

export default function CustomerHomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [pickupInput, setPickupInput] = useState('Current Location (GPS Verified)');
  const [dropInput, setDropInput] = useState('');
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const loadRecentRides = async () => {
      setLoadingRides(true);
      try {
        const res = await fetchAPI<{ rides: RecentRide[] }>('/api/rides/my');
        if (res.data?.rides) {
          setRecentRides(res.data.rides.slice(0, 3));
        }
      } catch {
        setRecentRides([]);
      } finally {
        setLoadingRides(false);
      }
    };

    loadRecentRides();
  }, []);

  const handleStartBooking = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/customer/cab${dropInput ? `?drop=${encodeURIComponent(dropInput)}` : ''}`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ════════════════════════════════════════════════════════════════════════
          1. HEADER GREETING
      ════════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C2B3]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#00A99D]">
            VITO Intelligent Mobility
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1728] dark:text-white tracking-tight">
          {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Traveler'} 👋
        </h1>
        <p className="text-sm sm:text-base text-[#526174] dark:text-slate-400 mt-1 font-medium">
          Where are you going today?
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          2. PRIMARY BOOKING WIDGET (Hero Dominant Element)
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
                Verified drivers, live GPS routing, and instant 4-digit OTP dispatch
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F2] text-[#16A67A] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#16A67A] animate-pulse" />
            Live Drivers Near You
          </span>
        </div>

        {/* Inputs Stack */}
        <form onSubmit={handleStartBooking} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          {/* Pickup Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#16A67A]" />
            <input
              type="text"
              value={pickupInput}
              onChange={(e) => setPickupInput(e.target.value)}
              placeholder="Enter pickup location..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs sm:text-sm font-semibold text-[#0B1728] dark:text-white placeholder:text-[#8995A5] outline-none focus:border-[#00C2B3] focus:ring-1 focus:ring-[#00C2B3] transition-all"
            />
          </div>

          {/* Destination Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#E5484D]" />
            <input
              type="text"
              value={dropInput}
              onChange={(e) => setDropInput(e.target.value)}
              placeholder="Where to? Enter destination, airport, hub..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs sm:text-sm font-semibold text-[#0B1728] dark:text-white placeholder:text-[#8995A5] outline-none focus:border-[#00C2B3] focus:ring-1 focus:ring-[#00C2B3] transition-all"
            />
          </div>

          {/* Book a Ride CTA */}
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-[#07111F] hover:bg-[#0B1728] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#07111F]/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <span>Book a Ride</span>
            <ArrowRight className="w-4 h-4 text-[#00C2B3]" />
          </button>
        </form>

        {/* Popular Destination Quick Chips */}
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
          3. QUICK SERVICES ROW (Cab / Hire Driver / Rental / Safety Center)
      ════════════════════════════════════════════════════════════════════════ */}
      <div>
        <h3 className="text-sm font-bold text-[#0B1728] dark:text-white uppercase tracking-wider mb-4">
          Explore VITO Mobility Services
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Book a Cab',
              desc: 'Point-to-point city rides with upfront pricing & OTP',
              href: '/customer/cab',
              icon: Car,
              accent: '#00C2B3',
              action: 'Book Ride →',
            },
            {
              title: 'Hire a Driver',
              desc: 'Professional verified chauffeurs on hourly / daily hire',
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
              desc: 'Emergency SOS, live GPS sharing & 24/7 safety team',
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
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
          4. RECENT TRIPS SECTION
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1728] dark:text-white uppercase tracking-wider">
            Recent Trips
          </h3>
          <Link
            href="/customer/trips"
            className="text-xs font-bold text-[#00A99D] hover:underline"
          >
            View All Trips →
          </Link>
        </div>

        {loadingRides ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-center text-xs text-[#8995A5]">
            Loading recent trip history...
          </div>
        ) : recentRides.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00C2B3]/10 flex items-center justify-center mx-auto text-[#00A99D]">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B1728] dark:text-white">
                No upcoming rides
              </p>
              <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
                Your next journey starts here. Book your ride across Delhi NCR in seconds.
              </p>
            </div>
            <Link
              href="/customer/cab"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00C2B3] text-white text-xs font-bold shadow-sm"
            >
              Book a Ride Now
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentRides.map((ride) => (
              <div
                key={ride._id}
                className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#00C2B3]/10 flex items-center justify-center text-[#00A99D] shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0B1728] dark:text-white truncate">
                      {ride.drop?.address || 'Destination'}
                    </p>
                    <p className="text-[11px] text-[#526174] dark:text-slate-400 truncate mt-0.5">
                      From: {ride.pickup?.address || 'Pickup location'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-[#0B1728] dark:text-white">
                    ₹{ride.fare}
                  </p>
                  <span className="badge-vito-completed mt-1">
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
