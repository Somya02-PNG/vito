'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import {
  Radio,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Navigation2,
  User,
  DollarSign,
  RefreshCw,
  UserCheck,
  Car,
  Calendar,
  Briefcase,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface TripRequest {
  _id: string;
  pickup: { address: string; coordinates?: [number, number] };
  drop: { address: string };
  customer?: { name: string; phone: string };
  estimatedFare?: number;
  estimatedDistance?: number;
  estimatedDuration?: number;
  status: string;
  createdAt: string;
}

interface DriverHireRequest {
  _id: string;
  driverName: string;
  pickupLocation: string;
  serviceType: string;
  bookingDate: string;
  startTime: string;
  hours: number;
  totalFare: number;
  vehicleDetails?: {
    type: string;
    makeModel: string;
    transmission: string;
    fuel: string;
  };
  status: string;
  createdAt: string;
}

export default function DriverRequestsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'cab' | 'hire'>('hire');
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [hireRequests, setHireRequests] = useState<DriverHireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'cab') {
        const res = await fetchAPI<{ rides: TripRequest[] }>('/api/rides/pending');
        setRequests(res.data?.rides || []);
      } else {
        const res = await fetchAPI<{ hires: DriverHireRequest[] }>('/api/driver-hire/driver-hires');
        setHireRequests(res.data?.hires || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load incoming requests');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleAction = async (rideId: string, action: 'accept' | 'decline') => {
    setActioningId(rideId);
    try {
      if (activeTab === 'cab') {
        await fetchAPI(`/api/rides/${rideId}/${action}`, { method: 'POST' });
        setRequests((prev) => prev.filter((r) => r._id !== rideId));
      } else {
        await fetchAPI(`/api/driver-hire/${rideId}/respond`, {
          method: 'POST',
          body: { action },
        });
        setHireRequests((prev) => prev.filter((h) => h._id !== rideId));
      }
    } catch {
      // Silently refresh list
    } finally {
      setActioningId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-7 rounded-full bg-[#00C2B3]" />
            <h1 className="text-2xl font-black text-[#0B1728] dark:text-white tracking-tight">Duty Requests</h1>
          </div>
          <p className="text-sm text-[#526174] dark:text-slate-400 pl-4">Incoming cab rides and private chauffeur bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00C2B3]/10 border border-[#00C2B3]/20">
            <span className="w-2 h-2 rounded-full bg-[#00C2B3] animate-pulse" />
            <span className="text-xs font-bold text-[#00A99D]">Live Online</span>
          </div>
          <button
            onClick={fetchRequests}
            className="w-9 h-9 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] hover:bg-[#E5EAF0] border border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-center text-[#526174] dark:text-slate-300 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-[#F1F5F8] dark:bg-[#10243A] max-w-md">
        <button
          onClick={() => setActiveTab('hire')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'hire'
              ? 'bg-[#07111F] text-white shadow-md'
              : 'text-[#526174] dark:text-slate-400 hover:text-[#0B1728]'
          }`}
        >
          <UserCheck className="w-4 h-4 text-[#C9A45C]" />
          Driver Hire ({hireRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('cab')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cab'
              ? 'bg-[#07111F] text-white shadow-md'
              : 'text-[#526174] dark:text-slate-400 hover:text-[#0B1728]'
          }`}
        >
          <Car className="w-4 h-4 text-[#00C2B3]" />
          Cab Rides ({requests.length})
        </button>
      </div>

      {/* Requests List */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1728] dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00C2B3]" />
            {activeTab === 'hire' ? 'Incoming Chauffeur Hire Requests' : 'Incoming Instant Cab Rides'}
          </h3>
          <span className="text-xs text-[#8995A5]">Auto-refreshing every 15s</span>
        </div>

        {loading ? (
          <SkeletonList count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRequests} />
        ) : activeTab === 'hire' ? (
          hireRequests.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No pending chauffeur hire requests"
              description="New scheduled driver hire bookings matching your profile will appear here."
              accentColor="#C9A45C"
              size="sm"
            />
          ) : (
            hireRequests.map((hire) => (
              <div
                key={hire._id}
                className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-4 animate-fadeInUp"
              >
                <div className="flex items-center justify-between">
                  <span className="badge-vito-gold">
                    ★ {hire.serviceType?.toUpperCase() || 'FULL DAY'} ({hire.hours || 8} hrs)
                  </span>
                  <span className="text-sm font-black text-[#00A99D]">
                    ₹{hire.totalFare}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-[#0B1728] dark:text-white">
                    <strong>Pickup:</strong> {hire.pickupLocation}
                  </p>
                  <p className="text-[#526174] dark:text-slate-400">
                    <strong>Vehicle:</strong> {hire.vehicleDetails?.makeModel || 'Sedan'} ({hire.vehicleDetails?.transmission || 'Automatic'} · {hire.vehicleDetails?.fuel || 'Petrol'})
                  </p>
                  <p className="text-[#526174] dark:text-slate-400">
                    <strong>Schedule:</strong> {hire.bookingDate ? new Date(hire.bookingDate).toLocaleDateString('en-IN') : 'Scheduled'} at {hire.startTime || '09:00 AM'}
                  </p>
                </div>

                <div className="flex gap-3 pt-2 border-t border-[#E5EAF0] dark:border-[#17334F]">
                  <button
                    onClick={() => handleAction(hire._id, 'decline')}
                    disabled={actioningId === hire._id}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E5484D]/10 hover:bg-[#E5484D]/20 text-[#E5484D] text-xs font-bold transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                  <button
                    onClick={() => handleAction(hire._id, 'accept')}
                    disabled={actioningId === hire._id}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#07111F] hover:bg-[#0B1728] text-white text-xs font-black shadow-md transition-all"
                  >
                    <CheckCircle className="w-4 h-4 text-[#00C2B3]" />
                    Accept Chauffeur Duty
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          requests.length === 0 ? (
            <EmptyState
              icon={Radio}
              title="No pending cab requests"
              description="New instant ride requests will appear here automatically."
              accentColor="#00C2B3"
              size="sm"
            />
          ) : (
            requests.map((req) => (
              <div
                key={req._id}
                className="p-5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-4 animate-fadeInUp"
              >
                <div className="space-y-1 text-xs">
                  <p className="text-[#0B1728] dark:text-white"><strong>Pickup:</strong> {req.pickup.address}</p>
                  <p className="text-[#0B1728] dark:text-white"><strong>Drop:</strong> {req.drop.address}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(req._id, 'decline')}
                    disabled={actioningId === req._id}
                    className="flex-1 py-3 rounded-xl bg-[#E5484D]/10 text-[#E5484D] text-xs font-bold"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAction(req._id, 'accept')}
                    disabled={actioningId === req._id}
                    className="flex-[2] py-3 rounded-xl bg-[#07111F] text-white text-xs font-bold"
                  >
                    Accept Ride (₹{req.estimatedFare || 250})
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
