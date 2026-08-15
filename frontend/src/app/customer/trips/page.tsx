'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import {
  Compass,
  Navigation2,
  Clock,
  CheckCircle2,
  XCircle,
  Car,
  UserCheck,
  Key,
  Filter,
  ChevronRight,
  CalendarDays,
  MapPin,
  Star,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList, SkeletonStatGrid } from '@/components/ui/SkeletonCard';

type TripStatus = 'all' | 'active' | 'completed' | 'cancelled';
type TripType = 'ride' | 'rental' | 'driver_hire';

interface Trip {
  _id: string;
  type: TripType;
  status: string;
  pickup?: { address: string };
  drop?: { address: string };
  pickupLocation?: string;
  dropLocation?: string;
  createdAt: string;
  fare?: number;
  totalAmount?: number;
  driverName?: string;
  vehicleName?: string;
  rating?: number;
}

const TYPE_LABELS: Record<TripType, { label: string; icon: React.ElementType; color: string }> = {
  ride: { label: 'Cab Ride', icon: Car, color: '#3B82F6' },
  rental: { label: 'Rental', icon: Key, color: '#10B981' },
  driver_hire: { label: 'Driver Hire', icon: UserCheck, color: '#F59E0B' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  active: { label: 'Active', icon: Navigation2, color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  ongoing: { label: 'Ongoing', icon: Navigation2, color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: '#EF4444', bg: 'bg-red-500/10 text-red-300 border-red-500/20' },
  pending: { label: 'Pending', icon: Clock, color: '#F59E0B', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  accepted: { label: 'Accepted', icon: Clock, color: '#8B5CF6', bg: 'bg-violet-500/10 text-violet-300 border-violet-500/20' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CustomerTripsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TripStatus>('all');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ridesRes] = await Promise.allSettled([
        fetchAPI<{ rides: any[] }>('/api/rides/my'),
      ]);

      const allTrips: Trip[] = [];

      if (ridesRes.status === 'fulfilled' && ridesRes.value.data?.rides) {
        ridesRes.value.data.rides.forEach((r: any) => {
          allTrips.push({
            _id: r._id,
            type: 'ride',
            status: r.status,
            pickup: r.pickup,
            drop: r.drop,
            createdAt: r.createdAt,
            fare: r.fare,
            driverName: r.driverInfo?.name || r.driverId?.name || r.driver?.name,
            rating: r.rating,
          });
        });
      }

      setTrips(allTrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      setError(err?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const filtered = activeTab === 'all'
    ? trips
    : trips.filter((t) => {
        if (activeTab === 'active') return ['active', 'ongoing', 'pending', 'accepted'].includes(t.status);
        if (activeTab === 'completed') return t.status === 'completed';
        if (activeTab === 'cancelled') return t.status === 'cancelled';
        return true;
      });

  const stats = {
    total: trips.length,
    active: trips.filter((t) => ['active', 'ongoing', 'pending', 'accepted'].includes(t.status)).length,
    completed: trips.filter((t) => t.status === 'completed').length,
  };

  const tabs: { key: TripStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All Trips', count: trips.length },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'cancelled', label: 'Cancelled', count: trips.filter((t) => t.status === 'cancelled').length },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-blue-500/50" />
            <h1 className="text-2xl font-black text-white tracking-tight">My Trips</h1>
          </div>
          <p className="text-sm text-slate-400 pl-4">Your complete ride, rental, and driver hire history</p>
        </div>
        <Link
          href="/customer/cab"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all active:scale-95 shrink-0"
        >
          <Car className="w-4 h-4" />
          Book New Ride
        </Link>
      </div>

      {/* Stats Row */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Trips', value: stats.total, color: '#3B82F6' },
            { label: 'Active', value: stats.active, color: '#06B6D4' },
            { label: 'Completed', value: stats.completed, color: '#10B981' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0B0F1C] border border-white/[0.06] rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 rounded-2xl bg-[#0B0F1C] border border-white/[0.06]">
        {loading ? (
          <SkeletonList count={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTrips} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={activeTab === 'all' ? 'No trips yet' : `No ${activeTab} trips`}
            description={activeTab === 'all'
              ? 'Book your first ride, rent a vehicle, or hire a driver to get started.'
              : `You don't have any ${activeTab} trips right now.`}
            action={{ label: 'Book a Ride', href: '/customer/cab' }}
            accentColor="#3B82F6"
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((trip) => {
              const typeConf = TYPE_LABELS[trip.type];
              const statusConf = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG['pending'];
              const TypeIcon = typeConf.icon;
              const StatusIcon = statusConf.icon;

              return (
                <div
                  key={trip._id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-colors cursor-pointer group"
                >
                  {/* Type Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${typeConf.color}15`, border: `1px solid ${typeConf.color}30` }}
                  >
                    <TypeIcon className="w-5 h-5" style={{ color: typeConf.color }} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{typeConf.label}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusConf.bg}`}>
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {trip.pickup?.address || trip.pickupLocation || 'Pickup'} → {trip.drop?.address || trip.dropLocation || 'Destination'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(trip.createdAt)}
                      </span>
                      {trip.rating && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {trip.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    {(trip.fare || trip.totalAmount) ? (
                      <p className="text-sm font-bold text-white">₹{(trip.fare || trip.totalAmount || 0).toFixed(0)}</p>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors ml-auto mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
