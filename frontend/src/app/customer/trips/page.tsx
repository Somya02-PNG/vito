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
  ride: { label: 'Cab Ride', icon: Car, color: '#00A99D' },
  rental: { label: 'Car Rental', icon: Key, color: '#3984E8' },
  driver_hire: { label: 'Chauffeur Hire', icon: UserCheck, color: '#C9A45C' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; badgeClass: string }> = {
  active: { label: 'Active', icon: Navigation2, badgeClass: 'badge-vito-live' },
  ongoing: { label: 'Ongoing', icon: Navigation2, badgeClass: 'badge-vito-live' },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, badgeClass: 'badge-vito-available' },
  SERVICE_STARTED: { label: 'In Service', icon: Navigation2, badgeClass: 'badge-vito-live' },
  SERVICE_COMPLETED: { label: 'Completed', icon: CheckCircle2, badgeClass: 'badge-vito-available' },
  completed: { label: 'Completed', icon: CheckCircle2, badgeClass: 'badge-vito-available' },
  cancelled: { label: 'Cancelled', icon: XCircle, badgeClass: 'badge-vito-danger' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, badgeClass: 'badge-vito-danger' },
  pending: { label: 'Pending', icon: Clock, badgeClass: 'badge-vito-pending' },
  REQUESTED: { label: 'Requested', icon: Clock, badgeClass: 'badge-vito-pending' },
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
      const [ridesRes, hiresRes] = await Promise.allSettled([
        fetchAPI<{ rides: any[] }>('/api/rides/my'),
        fetchAPI<{ hires: any[] }>('/api/driver-hire/my-hires'),
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

      if (hiresRes.status === 'fulfilled' && hiresRes.value.data?.hires) {
        hiresRes.value.data.hires.forEach((h: any) => {
          allTrips.push({
            _id: h._id,
            type: 'driver_hire',
            status: h.status,
            pickupLocation: h.pickupLocation,
            dropLocation: h.destinationLocation || `${h.hours || 8} hrs duty`,
            createdAt: h.createdAt,
            fare: h.totalFare,
            driverName: h.driverName,
            rating: h.multiRating?.averageRating,
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

  useEffect(() => {
    fetchTrips();
  }, []);

  const filtered = activeTab === 'all'
    ? trips
    : trips.filter((t) => {
        const s = t.status.toLowerCase();
        if (activeTab === 'active') return ['active', 'ongoing', 'pending', 'requested', 'confirmed', 'service_started'].includes(s);
        if (activeTab === 'completed') return ['completed', 'service_completed', 'rated', 'payment_completed'].includes(s);
        if (activeTab === 'cancelled') return ['cancelled', 'declined', 'expired'].includes(s);
        return true;
      });

  const stats = {
    total: trips.length,
    active: trips.filter((t) => ['active', 'ongoing', 'pending', 'requested', 'confirmed', 'service_started'].includes(t.status.toLowerCase())).length,
    completed: trips.filter((t) => ['completed', 'service_completed', 'rated', 'payment_completed'].includes(t.status.toLowerCase())).length,
  };

  const tabs: { key: TripStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All Trips & Duties', count: trips.length },
    { key: 'active', label: 'Active & Upcoming', count: stats.active },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'cancelled', label: 'Cancelled', count: trips.filter((t) => ['cancelled', 'declined', 'expired'].includes(t.status.toLowerCase())).length },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C2B3]" />
            <p className="text-[10px] font-bold text-[#8995A5] uppercase tracking-widest">
              VITO Mobility Activity
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1728] dark:text-white tracking-tight">
            My Trips & Services
          </h1>
          <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
            Your unified ride, rental, and private chauffeur hire records
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/customer/cab"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#07111F] hover:bg-[#0B1728] text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Car className="w-4 h-4 text-[#00C2B3]" />
            Book Cab
          </Link>
          <Link
            href="/customer/driver-hire"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F0FCFB] border border-[#00C2B3]/40 text-[#00A99D] font-bold text-xs shadow-sm hover:bg-[#E6FAF8] transition-all active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            Hire Driver
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Mobility Records', value: stats.total },
            { label: 'Active / Scheduled', value: stats.active },
            { label: 'Completed Safely', value: stats.completed },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-center shadow-sm">
              <p className="text-2xl font-black text-[#0B1728] dark:text-white">{s.value}</p>
              <p className="text-[11px] text-[#526174] dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#F1F5F8] dark:bg-[#10243A] rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-[#07111F] text-white shadow-md'
                : 'text-[#526174] dark:text-slate-400 hover:text-[#0B1728]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#E5EAF0] text-[#526174]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm">
        {loading ? (
          <SkeletonList count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTrips} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={activeTab === 'all' ? 'No trips or hires recorded' : `No ${activeTab} records`}
            description="Your next journey begins with VITO. Book an instant cab or hire a professional chauffeur."
            action={{ label: 'Hire a Driver', href: '/customer/driver-hire' }}
            accentColor="#00C2B3"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((trip) => {
              const typeConf = TYPE_LABELS[trip.type];
              const statusConf = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG['pending'];
              const TypeIcon = typeConf.icon;

              return (
                <div
                  key={trip._id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] hover:bg-[#F1F5F8] border border-[#E5EAF0] dark:border-[#17334F] transition-all cursor-pointer group"
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: `${typeConf.color}15`, border: `1px solid ${typeConf.color}35` }}
                  >
                    <TypeIcon className="w-5 h-5" style={{ color: typeConf.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#0B1728] dark:text-white">{typeConf.label}</span>
                      <span className={statusConf.badgeClass}>
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#526174] dark:text-slate-400 mt-1 truncate font-medium">
                      {trip.pickup?.address || trip.pickupLocation || 'Pickup'} → {trip.drop?.address || trip.dropLocation || 'Destination'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#8995A5]">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(trip.createdAt)}
                      </span>
                      {trip.driverName && (
                        <span>Chauffeur: {trip.driverName}</span>
                      )}
                      {trip.rating && (
                        <span className="text-[#8C6A29] font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#C9A45C] text-[#C9A45C]" />
                          {trip.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {trip.fare ? (
                      <p className="text-sm font-black text-[#0B1728] dark:text-white">₹{trip.fare.toFixed(0)}</p>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-[#8995A5] group-hover:text-[#0B1728] transition-colors ml-auto mt-1" />
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
