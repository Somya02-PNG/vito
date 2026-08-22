'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CarFront,
  User,
  ChevronRight,
  RefreshCw,
  Search,
  Key,
  DollarSign,
} from 'lucide-react';
import { SkeletonList, SkeletonStatGrid } from '@/components/ui/SkeletonCard';

interface Booking {
  _id: string;
  bookingId?: string;
  userId?: { name: string; email: string; phone: string };
  vehicleId?: { name?: string; category?: string; registrationNumber?: string; pricePerDay?: number };
  pickupLocation: string;
  returnLocation: string;
  pickupDateTime: string;
  returnDateTime: string;
  status: string;
  pricing?: { totalPayable?: number; securityDeposit?: number };
  createdAt: string;
}

type FilterTab = 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled';

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{ bookings: Booking[] }>('/api/partner/bookings');
      setBookings(res.data?.bookings || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    const s = (b.status || '').toUpperCase();
    if (tab === 'upcoming' && s !== 'CONFIRMED' && s !== 'READY_FOR_PICKUP' && s !== 'PAYMENT_PENDING') return false;
    if (tab === 'active' && s !== 'ACTIVE' && s !== 'EXTENDED' && s !== 'HANDOVER_PENDING') return false;
    if (tab === 'completed' && s !== 'COMPLETED' && s !== 'PAYMENT_COMPLETED' && s !== 'RATED') return false;
    if (tab === 'cancelled' && s !== 'CANCELLED') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const customerName = (b.userId?.name || '').toLowerCase();
      const vehicleName = (b.vehicleId?.name || '').toLowerCase();
      const reg = (b.vehicleId?.registrationNumber || '').toLowerCase();
      const bId = (b.bookingId || b._id).toLowerCase();
      return customerName.includes(q) || vehicleName.includes(q) || reg.includes(q) || bId.includes(q);
    }
    return true;
  });

  const counts = {
    all: bookings.length,
    upcoming: bookings.filter((b) => ['CONFIRMED', 'READY_FOR_PICKUP', 'PAYMENT_PENDING'].includes(b.status.toUpperCase())).length,
    active: bookings.filter((b) => ['ACTIVE', 'EXTENDED', 'HANDOVER_PENDING'].includes(b.status.toUpperCase())).length,
    completed: bookings.filter((b) => ['COMPLETED', 'PAYMENT_COMPLETED', 'RATED'].includes(b.status.toUpperCase())).length,
    cancelled: bookings.filter((b) => b.status.toUpperCase() === 'CANCELLED').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-2 sm:px-4 py-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/partner/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Fleet Rental Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time reservations, digital handover check-ins, and return settlements.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── SUMMARY STATS ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
            <p className="text-2xl font-black text-white">{counts.all}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-blue-500/20 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming</span>
            <p className="text-2xl font-black text-blue-300">{counts.upcoming}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-cyan-500/20 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On Road Now</span>
            <p className="text-2xl font-black text-cyan-300">{counts.active}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-emerald-500/20 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
            <p className="text-2xl font-black text-emerald-400">{counts.completed}</p>
          </div>
        </div>
      )}

      {/* ── CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#0B101E] border border-white/10 rounded-xl overflow-x-auto">
          {(['all', 'upcoming', 'active', 'completed', 'cancelled'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                tab === t ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t} ({counts[t]})
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search booking ID, customer, car..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0B101E] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ── BOOKINGS LIST ── */}
      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#0B101E] border border-white/10 text-center space-y-2">
          <CalendarDays className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400">No reservations matching current filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B101E]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070A12] text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Security Deposit</th>
                <th className="px-4 py-3">Total Payable</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filtered.map((b) => (
                <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-teal-400">
                    {b.bookingId || `#${b._id.substring(0, 8)}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white block">{b.userId?.name || 'Customer'}</span>
                    <span className="text-[10px] text-slate-400">{b.userId?.phone || ''}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white block">{b.vehicleId?.name || 'Vehicle'}</span>
                    <span className="text-[10px] text-slate-500">{b.vehicleId?.registrationNumber || ''}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(b.pickupDateTime).toLocaleDateString('en-IN')} -{' '}
                    {new Date(b.returnDateTime).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-400">
                    ₹{(b.pricing?.securityDeposit || 3000).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    ₹{(b.pricing?.totalPayable || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        b.status === 'CONFIRMED' || b.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : b.status === 'READY_FOR_PICKUP'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : b.status === 'COMPLETED'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
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
                      Handover →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
