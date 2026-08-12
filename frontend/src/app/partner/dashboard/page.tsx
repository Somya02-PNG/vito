'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  Building2,
  CarFront,
  CheckCircle2,
  Clock,
  CalendarDays,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface FleetStats {
  totalVehicles: number;
  availableVehicles: number;
  currentlyRented: number;
  pendingRequests: number;
  todayEarnings: number;
}

interface PartnerProfile {
  businessName: string;
  city: string;
  fleetCount: number;
  verificationStatus: string;
  walletBalance: number;
}

interface BookingRecord {
  _id: string;
  userId?: { name: string; email: string; phone: string };
  vehicleId?: { category: string; pricePerDay: number };
  startDate: string;
  endDate: string;
  status: string;
  depositAmount: number;
}

export default function PartnerDashboardOverviewPage() {
  const { user } = useAuth();

  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [stats, setStats] = useState<FleetStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    currentlyRented: 0,
    pendingRequests: 0,
    todayEarnings: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch partner metrics from backend API
  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI<{
          partnerProfile: PartnerProfile;
          stats: FleetStats;
          upcomingBookings: BookingRecord[];
        }>('/api/partner/dashboard');

        if (res.data) {
          setPartnerProfile(res.data.partnerProfile);
          if (res.data.stats) setStats(res.data.stats);
          if (res.data.upcomingBookings) setUpcomingBookings(res.data.upcomingBookings);
        }
      } catch {
        // Fallback default empty states
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  return (
    <div className="space-y-6">
      {/* ── 1. BUSINESS GREETING & HEADER ── */}
      <section className="p-6 rounded-3xl bg-[#0B101E] border border-teal-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 border border-teal-500/30 text-teal-300">
                FLEET MANAGEMENT CENTER
              </span>
              <span className="text-xs text-slate-400">
                {partnerProfile?.city ? `· ${partnerProfile.city}` : ''}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-teal-300">{partnerProfile?.businessName || user?.name || 'Fleet Operator'}</span>
            </h1>
            <p className="text-xs text-slate-400">
              Overview of your vehicle fleet utilization, bookings, and revenue metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/partner/fleet"
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 shrink-0"
            >
              <CarFront className="w-4 h-4" />
              <span>Manage Fleet</span>
            </Link>
          </div>
        </div>

        {/* ── 2. FLEET METRICS GRID (4 DATA DENSE CARDS) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Total Vehicles */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Fleet</p>
              <p className="text-2xl font-black text-white">{loading ? '...' : stats.totalVehicles}</p>
              <p className="text-[10px] text-slate-500">Registered Vehicles</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CarFront className="w-5 h-5" />
            </div>
          </div>

          {/* Available Vehicles */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Fleet</p>
              <p className="text-2xl font-black text-emerald-400">{loading ? '...' : stats.availableVehicles}</p>
              <p className="text-[10px] text-emerald-400/80">Ready for Rent</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Currently Rented */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Rentals</p>
              <p className="text-2xl font-black text-teal-300">{loading ? '...' : stats.currentlyRented}</p>
              <p className="text-[10px] text-teal-300/80">Currently On Road</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          {/* Today's Revenue / Pending Requests */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Requests</p>
              <p className="text-2xl font-black text-amber-400">{loading ? '...' : stats.pendingRequests}</p>
              <p className="text-[10px] text-amber-400/80">Awaiting Approval</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. UPCOMING BOOKINGS DATA TABLE / LIST ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Upcoming & Pending Bookings</h2>
            <p className="text-xs text-slate-400">Manage customer rental contracts for your fleet</p>
          </div>
          <Link href="/partner/bookings" className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1">
            <span>View All Bookings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 rounded-2xl bg-[#0B101E] border border-white/10 text-center text-xs text-slate-400 animate-pulse">
            Loading fleet booking records...
          </div>
        ) : upcomingBookings.length > 0 ? (
          /* Table-Friendly Data Dense Layout */
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B101E]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070A12] text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {upcomingBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-teal-400">#{b._id.substring(0, 8)}</td>
                    <td className="px-4 py-3 font-semibold text-white">{b.userId?.name || 'Customer'}</td>
                    <td className="px-4 py-3 capitalize">{b.vehicleId?.category || 'Vehicle'}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{b.depositAmount || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href="/partner/bookings" className="text-teal-400 hover:text-teal-300 font-bold text-[11px]">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State: No upcoming bookings */
          <div className="p-10 rounded-2xl bg-[#0B101E] border border-white/10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No upcoming booking requests</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When customers place self-drive rental bookings for your fleet vehicles, reservations will appear here for your review and handover confirmation.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
