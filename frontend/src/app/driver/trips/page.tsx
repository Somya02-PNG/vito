'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  Navigation2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  DollarSign,
  Filter,
  CalendarDays,
  ChevronRight,
  Car,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList, SkeletonStatGrid } from '@/components/ui/SkeletonCard';

interface DriverTrip {
  _id: string;
  pickup: { address: string };
  drop: { address: string };
  status: string;
  fare?: number;
  createdAt: string;
  customer?: { name: string };
  distance?: number;
  duration?: number;
  rating?: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: 'Completed', color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'bg-red-500/10 text-red-300 border-red-500/20' },
  active: { label: 'Active', color: '#06B6D4', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  ongoing: { label: 'Ongoing', color: '#06B6D4', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
};

type FilterType = 'all' | 'completed' | 'cancelled';

export default function DriverTripsPage() {
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ rides: DriverTrip[] }>('/api/rides/driver/history');
      setTrips(res.data?.rides || []);
    } catch {
      // Try alternate endpoint
      try {
        const res2 = await fetchAPI<{ rides: DriverTrip[] }>('/api/rides/my');
        setTrips(res2.data?.rides || []);
      } catch (err: any) {
        setError(err?.message || 'Could not load trip history');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const filtered = filter === 'all' ? trips : trips.filter((t) => t.status === filter);
  const completed = trips.filter((t) => t.status === 'completed');
  const totalEarned = completed.reduce((sum, t) => sum + (t.fare || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">My Trips</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Your complete trip history as a VITO driver</p>
      </div>

      {/* Summary Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Trips', value: trips.length },
            { label: 'Completed', value: completed.length },
            { label: 'Total Earned', value: `₹${totalEarned.toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[#0B101E] border border-cyan-500/20 text-center">
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0B101E] border border-white/[0.06] rounded-xl w-fit">
        {(['all', 'completed', 'cancelled'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="p-5 rounded-2xl bg-[#0B101E] border border-cyan-500/20">
        {loading ? (
          <SkeletonList count={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTrips} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Navigation2}
            title={filter === 'all' ? 'No trips yet' : `No ${filter} trips`}
            description="Your completed and cancelled trips will appear here."
            accentColor="#06B6D4"
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((trip) => {
              const statusConf = STATUS_MAP[trip.status] ?? { label: trip.status, color: '#94A3B8', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
              return (
                <div key={trip._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusConf.bg}`}>{statusConf.label}</span>
                      {trip.customer?.name && <span className="text-[11px] text-slate-400 truncate">{trip.customer.name}</span>}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                      {trip.pickup?.address} → {trip.drop?.address}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {trip.fare ? (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-white">₹{trip.fare.toFixed(0)}</p>
                    </div>
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
