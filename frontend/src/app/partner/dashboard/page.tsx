'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
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
  ShieldAlert,
  FileCheck,
  Key,
  RotateCcw,
  Building2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface FleetMetrics {
  totalVehicles: number;
  availableVehicles: number;
  currentlyRented: number;
  pendingVerification: number;
  upcomingBookingsCount: number;
  activeRentals: number;
  pendingReturns: number;
  damageCases: number;
  totalGrossRevenue: number;
  platformFee: number;
  netEarnings: number;
  todayEarnings: number;
}

interface PartnerProfile {
  partnerId?: string;
  businessName: string;
  fullName?: string;
  partnerType?: string;
  city: string;
  verificationStatus: string;
  walletBalance: number;
}

interface BookingRecord {
  _id: string;
  bookingId?: string;
  userId?: { name: string; email: string; phone: string };
  vehicleId?: { name?: string; category?: string; registrationNumber?: string; pricePerDay?: number };
  pickupDateTime?: string;
  returnDateTime?: string;
  status: string;
  pricing?: { securityDeposit?: number; totalPayable?: number };
}

interface VehicleRecord {
  _id: string;
  vehicleId?: string;
  name: string;
  registrationNumber: string;
  category: string;
  status: string;
  availabilityStatus: string;
  pricePerDay: number;
  isBookable?: boolean;
}

export default function PartnerDashboardOverviewPage() {
  const { user } = useAuth();

  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [stats, setStats] = useState<FleetMetrics>({
    totalVehicles: 0,
    availableVehicles: 0,
    currentlyRented: 0,
    pendingVerification: 0,
    upcomingBookingsCount: 0,
    activeRentals: 0,
    pendingReturns: 0,
    damageCases: 0,
    totalGrossRevenue: 0,
    platformFee: 0,
    netEarnings: 0,
    todayEarnings: 0,
  });
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await fetchAPI<{
        partnerProfile: PartnerProfile;
        stats: FleetMetrics;
        vehicles: VehicleRecord[];
        upcomingBookings: BookingRecord[];
      }>('/api/partner/dashboard-metrics');

      if (res.data) {
        setPartnerProfile(res.data.partnerProfile);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.vehicles) setVehicles(res.data.vehicles);
        if (res.data.upcomingBookings) setUpcomingBookings(res.data.upcomingBookings);
      }
    } catch {
      // Fallback default state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  const isNewPartner = !loading && stats.totalVehicles === 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ── 1. BUSINESS GREETING & HEADER ── */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#0B101E] border border-teal-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-teal-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-teal-500/15 border border-teal-500/30 text-teal-300">
                RENTAL HOST CONSOLE
              </span>
              {partnerProfile?.partnerType && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 uppercase">
                  {partnerProfile.partnerType.replace(/_/g, ' ')}
                </span>
              )}
              {partnerProfile?.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Host
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Clock className="w-3.5 h-3.5" /> Verification Pending
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">{partnerProfile?.businessName || partnerProfile?.fullName || user?.name || 'Rental Host'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Live fleet management, verified vehicle availability, booking settlements, and real-time revenue analytics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/10 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/partner/vehicles/new"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </Link>
          </div>
        </div>

        {/* ── 2. REAL METRICS GRID (10 Data Points Derived from MongoDB) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-6 mt-6 border-t border-white/[0.08]">
          {/* Total Vehicles */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Fleet</span>
              <CarFront className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl font-black text-white">{loading ? '...' : stats.totalVehicles}</p>
            <p className="text-[10px] text-slate-500">Registered</p>
          </div>

          {/* Available */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Available</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-emerald-400">{loading ? '...' : stats.availableVehicles}</p>
            <p className="text-[10px] text-emerald-400/70">Ready for Rent</p>
          </div>

          {/* Active Rentals */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-cyan-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Rentals</span>
              <Key className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-cyan-300">{loading ? '...' : stats.activeRentals}</p>
            <p className="text-[10px] text-cyan-400/70">On Road Now</p>
          </div>

          {/* Pending Verification */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Verification</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-amber-400">{loading ? '...' : stats.pendingVerification}</p>
            <p className="text-[10px] text-amber-400/70">Under Review</p>
          </div>

          {/* Upcoming Bookings */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Upcoming</span>
              <CalendarDays className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-blue-300">{loading ? '...' : stats.upcomingBookingsCount}</p>
            <p className="text-[10px] text-blue-400/70">Confirmed</p>
          </div>

          {/* Pending Returns */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Returns Due</span>
              <RotateCcw className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-purple-300">{loading ? '...' : stats.pendingReturns}</p>
            <p className="text-[10px] text-purple-400/70">Awaiting Handover</p>
          </div>

          {/* Damage Cases */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Damage Cases</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-rose-400">{loading ? '...' : stats.damageCases}</p>
            <p className="text-[10px] text-rose-400/70">Under Review</p>
          </div>

          {/* Gross Booking Volume */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Gross Volume</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-white">₹{loading ? '...' : stats.totalGrossRevenue.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500">Completed Trips</p>
          </div>

          {/* Platform Fee (15%) */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Platform Fee</span>
              <span className="text-[10px] text-slate-500">15%</span>
            </div>
            <p className="text-2xl font-black text-slate-300">₹{loading ? '...' : stats.platformFee.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500">Insurance & Ops</p>
          </div>

          {/* Net Earnings */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/50 to-[#070A12] border border-teal-500/30 space-y-1">
            <div className="flex items-center justify-between text-teal-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Net Earnings</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl font-black text-teal-300">₹{loading ? '...' : stats.netEarnings.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-teal-400/80">Net Payout</p>
          </div>
        </div>
      </section>

      {/* ── 3. FIRST-TIME EMPTY STATE (Zero Vehicles) ── */}
      {isNewPartner && (
        <section className="p-8 sm:p-10 rounded-3xl bg-[#0B101E] border border-teal-500/30 text-center space-y-8 relative">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Welcome to VITO Rentals — Get Ready to Earn
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              You haven&apos;t added any vehicles to your rental fleet yet. Complete these simple steps to start receiving self-drive bookings with guaranteed payments.
            </p>
          </div>

          {/* Numbered Setup Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-[#070A12] border border-white/10 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h3 className="text-sm font-bold text-white">Complete Profile</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide your registered business name, operating city, and contact details.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#070A12] border border-white/10 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <h3 className="text-sm font-bold text-white">Partner Verification</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                VITO operations team verifies your identity and business authorization.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#070A12] border border-teal-500/30 bg-teal-950/10 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <h3 className="text-sm font-bold text-white">Add Your Vehicle</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter make, model, registration number, fuel, transmission, and pricing.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#070A12] border border-white/10 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-black text-xs">
                  4
                </div>
                <h3 className="text-sm font-bold text-white">Upload Documents</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select real files for RC, Insurance, PUC, and photos with our native file picker.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#070A12] border border-white/10 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-black text-xs">
                  5
                </div>
                <h3 className="text-sm font-bold text-white">Submit for Review</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Admin review activates your vehicle in the customer search engine within 24 hours.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#070A12] border border-white/10 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-black text-xs">
                  6
                </div>
                <h3 className="text-sm font-bold text-white">Receive Bookings</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete digital handovers and enjoy guaranteed net payouts.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/partner/vehicles/new"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-teal-500/25 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Vehicle</span>
            </Link>
          </div>
        </section>
      )}

      {/* ── 4. UPCOMING BOOKINGS DATA TABLE (Real DB Records) ── */}
      {!isNewPartner && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Upcoming & Pending Bookings</h2>
              <p className="text-xs text-slate-400">Customer self-drive reservations awaiting handover</p>
            </div>
            <Link
              href="/partner/bookings"
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All Bookings</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 rounded-2xl bg-[#0B101E] border border-white/10 text-center text-xs text-slate-400 animate-pulse">
              Loading active fleet booking records...
            </div>
          ) : upcomingBookings.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B101E]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070A12] text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Booking ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Rental Dates</th>
                    <th className="px-4 py-3">Deposit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {upcomingBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-teal-400">
                        {b.bookingId || `#${b._id.substring(0, 8)}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {b.userId?.name || 'Customer'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">{b.vehicleId?.name || 'Vehicle'}</span>
                        <span className="block text-[10px] text-slate-500">{b.vehicleId?.registrationNumber || ''}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {b.pickupDateTime ? new Date(b.pickupDateTime).toLocaleDateString('en-IN') : 'N/A'} -{' '}
                        {b.returnDateTime ? new Date(b.returnDateTime).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-400">
                        ₹{(b.pricing?.securityDeposit || 3000).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            b.status === 'CONFIRMED' || b.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : b.status === 'READY_FOR_PICKUP'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/partner/handover?bookingId=${b._id}`}
                          className="text-teal-400 hover:text-teal-300 font-bold text-[11px] hover:underline"
                        >
                          Handover Checklist →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#0B101E] border border-white/10 text-center space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Upcoming Bookings Right Now</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Once customers book your eligible vehicles from the VITO discovery engine, new reservations will appear here with instant handover workflows.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── 5. QUICK ACCESS ACTION GRID ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/partner/fleet"
          className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 hover:border-teal-500/40 transition-all group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0">
            <CarFront className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">Manage Fleet Cars</h3>
            <p className="text-xs text-slate-400">View status, edit pricing, upload documents, and toggle availability.</p>
          </div>
        </Link>

        <Link
          href="/partner/handover"
          className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 hover:border-cyan-500/40 transition-all group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Handover & Returns</h3>
            <p className="text-xs text-slate-400">Perform pre-rental inspections, odometer checks, and photo logs.</p>
          </div>
        </Link>

        <Link
          href="/partner/earnings"
          className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 hover:border-emerald-500/40 transition-all group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Payouts & Finance</h3>
            <p className="text-xs text-slate-400">Review transparent 80% net earnings breakdown and payout history.</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
