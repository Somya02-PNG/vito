'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  Car,
  User,
  ChevronRight,
  Filter,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface Booking {
  _id: string;
  vehicleName?: string;
  customerName?: string;
  customer?: { name: string };
  vehicle?: { name: string; registrationNumber: string };
  startDate?: string;
  endDate?: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
}

type FilterTab = 'all' | 'active' | 'upcoming' | 'completed';

const STATUS_MAP: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  upcoming: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  completed: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  cancelled: 'bg-red-500/10 text-red-300 border-red-500/20',
};

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>('all');

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ bookings: Booking[] }>('/api/rentals/partner/bookings');
      setBookings(res.data?.bookings || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => {
    const s = b.status.toLowerCase();
    if (tab === 'active') return s === 'active' || s === 'approved';
    if (tab === 'upcoming') return s === 'pending' || s === 'upcoming';
    if (tab === 'completed') return s === 'completed';
    return true;
  });

  const counts = {
    all: bookings.length,
    active: bookings.filter((b) => ['active', 'approved'].includes(b.status.toLowerCase())).length,
    upcoming: bookings.filter((b) => ['pending', 'upcoming'].includes(b.status.toLowerCase())).length,
    completed: bookings.filter((b) => b.status.toLowerCase() === 'completed').length,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Bookings</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">All vehicle and driver bookings across your fleet</p>
      </div>

      {/* Summary Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: counts.all, color: '#14B8A6' },
            { label: 'Active', value: counts.active, color: '#10B981' },
            { label: 'Upcoming', value: counts.upcoming, color: '#3B82F6' },
            { label: 'Completed', value: counts.completed, color: '#94A3B8' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[#0B101E] border border-teal-500/15 text-center">
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0B101E] border border-white/[0.06] rounded-xl w-fit">
        {(['all', 'active', 'upcoming', 'completed'] as FilterTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              tab === t ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
            {counts[t] > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t ? 'bg-white/20' : 'bg-white/5'}`}>{counts[t]}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/20">
        {loading ? (
          <SkeletonList count={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchBookings} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={tab === 'all' ? 'No bookings yet' : `No ${tab} bookings`}
            description="When customers book your vehicles, bookings will appear here."
            accentColor="#14B8A6"
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => {
              const statusClass = STATUS_MAP[b.status.toLowerCase()] ?? 'bg-slate-500/10 text-slate-300 border-slate-500/20';
              const customerName = b.customer?.name || b.customerName || 'Unknown';
              const vehicleName = b.vehicle?.name || b.vehicleName || 'Vehicle';
              return (
                <div key={b._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{vehicleName}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusClass}`}>{b.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <User className="w-3 h-3" />{customerName}
                    </p>
                    {(b.startDate || b.endDate) && (
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} — {b.endDate ? new Date(b.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    )}
                  </div>
                  {b.totalAmount ? (
                    <p className="text-sm font-black text-white shrink-0">₹{b.totalAmount.toFixed(0)}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
