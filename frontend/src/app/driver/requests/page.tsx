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

export default function DriverRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ rides: TripRequest[] }>('/api/rides/pending');
      setRequests(res.data?.rides || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleAction = async (rideId: string, action: 'accept' | 'decline') => {
    setActioningId(rideId);
    try {
      await fetchAPI(`/api/rides/${rideId}/${action}`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r._id !== rideId));
    } catch {
      // Silently fail, let the list refresh pick it up
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
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-500/50" />
            <h1 className="text-2xl font-black text-white tracking-tight">Trip Requests</h1>
          </div>
          <p className="text-sm text-slate-400 pl-4">Incoming ride requests — accept or decline within 30 seconds</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-cyan-300">Live</span>
          </div>
          <button
            onClick={fetchRequests}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Requests', value: requests.length, color: '#06B6D4' },
          { label: 'Auto-refresh', value: '15s', color: '#10B981' },
          { label: 'Your Status', value: 'Online', color: '#8B5CF6' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-[#0B101E] border border-white/[0.06] text-center">
            <p className="text-xl font-black text-white">{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Requests List */}
      <div className="p-5 rounded-2xl bg-[#0B101E] border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Incoming Requests
          </h3>
          <span className="text-xs text-slate-500">Auto-refreshing every 15s</span>
        </div>

        {loading ? (
          <SkeletonList count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRequests} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No pending requests"
            description="You're all caught up. New trip requests will appear here automatically."
            accentColor="#06B6D4"
            size="sm"
          />
        ) : (
          requests.map((req) => (
            <div
              key={req._id}
              className="p-5 rounded-2xl bg-[#0D1420] border border-cyan-500/20 space-y-4 animate-fadeInUp"
            >
              {/* Trip Route */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <div className="w-0.5 h-8 bg-slate-700 my-1" />
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Pickup</p>
                      <p className="text-xs font-semibold text-white leading-tight">{req.pickup.address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Dropoff</p>
                      <p className="text-xs font-semibold text-white leading-tight">{req.drop.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: DollarSign, label: 'Fare', value: req.estimatedFare ? `₹${req.estimatedFare}` : 'TBD' },
                  { icon: Navigation2, label: 'Distance', value: req.estimatedDistance ? `${req.estimatedDistance.toFixed(1)} km` : '—' },
                  { icon: Clock, label: 'Duration', value: req.estimatedDuration ? `${req.estimatedDuration} min` : '—' },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                      <Icon className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                      <p className="text-sm font-black text-white">{m.value}</p>
                      <p className="text-[9px] text-slate-500">{m.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Customer + Time */}
              {req.customer && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{req.customer.name}</p>
                    <p className="text-[10px] text-slate-500">Requested at {formatTime(req.createdAt)}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(req._id, 'decline')}
                  disabled={actioningId === req._id}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
                >
                  {actioningId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Decline
                </button>
                <button
                  onClick={() => handleAction(req._id, 'accept')}
                  disabled={actioningId === req._id}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-xs font-black transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-cyan-500/25"
                >
                  {actioningId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Accept Ride
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
