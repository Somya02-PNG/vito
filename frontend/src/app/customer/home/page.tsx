'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import {
  MapPin,
  Search,
  Car,
  Key,
  UserCheck,
  Sparkles,
  ArrowRight,
  Calendar,
  Clock,
  Compass,
  Bookmark,
  Plus,
  Navigation,
  ShieldCheck,
} from 'lucide-react';

interface ActiveBooking {
  id: string;
  type: 'Ride' | 'Rental' | 'DriverHire';
  title: string;
  subtitle: string;
  date: string;
  status: string;
}

export default function CustomerHomePage() {
  const { user } = useAuth();

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Fetch active bookings from existing backend endpoints if available
  useEffect(() => {
    const loadActiveBookings = async () => {
      setLoadingBookings(true);
      try {
        const bookings: ActiveBooking[] = [];

        // Check active rides
        try {
          const rideRes = await fetchAPI<{ ride: any }>('/api/rides/active');
          if (rideRes.data?.ride) {
            const r = rideRes.data.ride;
            bookings.push({
              id: r._id,
              type: 'Ride',
              title: `Cab Ride to ${r.drop?.address || 'Destination'}`,
              subtitle: `Pickup: ${r.pickup?.address || 'Current location'}`,
              date: 'Active Now',
              status: r.status.toUpperCase(),
            });
          }
        } catch {}

        setActiveBookings(bookings);
      } catch {
        setActiveBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadActiveBookings();
  }, []);

  const quickActions = [
    {
      id: 'cab',
      title: 'Book Cab',
      desc: 'Instant ride hailing with live OTP tracking',
      href: `/customer/cab${destination ? `?destination=${encodeURIComponent(destination)}` : ''}`,
      icon: Car,
      gradient: 'from-blue-600 to-indigo-600',
      iconColor: 'text-blue-400',
      badge: 'Popular',
    },
    {
      id: 'rentals',
      title: 'Rent Vehicle',
      desc: 'Self-drive cars & scooters with daily rates',
      href: '/customer/rentals',
      icon: Key,
      gradient: 'from-emerald-600 to-teal-600',
      iconColor: 'text-emerald-400',
      badge: null,
    },
    {
      id: 'driver-hire',
      title: 'Hire Driver',
      desc: 'Verified professional drivers on hourly hire',
      href: '/customer/driver-hire',
      icon: UserCheck,
      gradient: 'from-amber-600 to-orange-600',
      iconColor: 'text-amber-400',
      badge: null,
    },
    {
      id: 'ai-planner',
      title: 'AI Trip Planner',
      desc: 'Smart itineraries & mobility recommendations',
      href: '/customer/ai-trip-planner',
      icon: Sparkles,
      gradient: 'from-violet-600 to-purple-600',
      iconColor: 'text-violet-400',
      badge: 'AI Powered',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. Greeting & Hero Search Section ── */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-indigo-950/70 border border-blue-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
            <Navigation className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>VITO Customer Portal</span>
          </div>

          {/* Greeting with User's Name */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Where are you going, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{user?.name || 'Traveler'}</span>?
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Enter your route inputs or choose a quick action below to start your trip.
            </p>
          </div>

          {/* Hero Search Box: Pickup & Destination */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Pickup Input */}
              <div className="relative flex items-center">
                <MapPin className="absolute left-3.5 w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Pickup location (Current Location)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Destination Input */}
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-blue-400" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to? (Destination address)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Link
                href={`/customer/cab${destination ? `?destination=${encodeURIComponent(destination)}` : ''}${pickup ? `&pickup=${encodeURIComponent(pickup)}` : ''}`}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                <span>Find Cab Options</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Quick Action Cards ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Quick Actions</h2>
          <span className="text-xs text-slate-500">Choose a service</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                href={action.href}
                className="group relative p-5 rounded-2xl bg-[#111827]/90 border border-white/[0.08] hover:border-blue-500/30 hover:bg-[#111827] transition-all duration-300 shadow-lg hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${action.gradient} p-0.5 shadow-md`}>
                      <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${action.iconColor}`} />
                      </div>
                    </div>
                    {action.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-blue-500/10 border border-blue-500/20 text-blue-300">
                        {action.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                  <span>Open Service</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 3. Upcoming / Active Bookings Section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Upcoming & Active Bookings</h2>
          <Link href="/customer/trips" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
            View All Trips →
          </Link>
        </div>

        {loadingBookings ? (
          <div className="p-8 rounded-2xl bg-[#111827]/60 border border-white/[0.06] text-center text-xs text-slate-500 animate-pulse">
            Checking active bookings...
          </div>
        ) : activeBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBookings.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-[#111827] border border-blue-500/20 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 uppercase">
                      {b.type}
                    </span>
                    <span className="text-xs font-bold text-white">{b.status}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="text-xs text-slate-400">{b.subtitle}</p>
                </div>
                <Link href="/customer/trips" className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500">
                  Track
                </Link>
              </div>
            ))}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="p-8 rounded-2xl bg-[#111827]/60 border border-white/[0.06] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No active or upcoming bookings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When you book a cab, rent a vehicle, or hire a driver, your active trip status will appear here.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── 4. Saved Places Section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Saved Places</h2>
          <button className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Place</span>
          </button>
        </div>

        {/* Saved Places Empty State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#111827]/60 border border-white/[0.06] border-dashed flex items-center gap-3.5 cursor-pointer hover:border-blue-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Home Address</p>
              <p className="text-[11px] text-slate-500">Save for 1-tap booking</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#111827]/60 border border-white/[0.06] border-dashed flex items-center gap-3.5 cursor-pointer hover:border-blue-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Workplace</p>
              <p className="text-[11px] text-slate-500">Save daily commute</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
