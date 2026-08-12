'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import {
  Power,
  TrendingUp,
  Navigation,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Radio,
  AlertCircle,
  Loader2,
  DollarSign,
  Compass,
} from 'lucide-react';

interface DriverStats {
  todayEarnings: number;
  weeklyEarnings: number;
  tripsCompleted: number;
  onlineHours: number;
}

interface DriverProfile {
  availability: boolean;
  rating: number;
  walletBalance: number;
  licenseNumber: string;
  verificationStatus: string;
}

export default function DriverHomePage() {
  const { user } = useAuth();

  const [isOnline, setIsOnline] = useState(true);
  const [driverData, setDriverData] = useState<DriverProfile | null>(null);
  const [stats, setStats] = useState<DriverStats>({
    todayEarnings: 0,
    weeklyEarnings: 0,
    tripsCompleted: 0,
    onlineHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch driver metrics from backend
  useEffect(() => {
    const fetchDriverStats = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI<{
          driver: DriverProfile;
          stats: DriverStats;
        }>('/api/driver/dashboard');

        if (res.data) {
          setDriverData(res.data.driver);
          setIsOnline(res.data.driver.availability ?? true);
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      } catch {
        // Fallback default values
      } finally {
        setLoading(false);
      }
    };

    fetchDriverStats();
  }, []);

  // Handle Online / Offline Duty Toggle
  const handleToggleDuty = async () => {
    setToggleLoading(true);
    try {
      const res = await fetchAPI<{ availability: boolean }>('/api/driver/toggle-availability', {
        method: 'PATCH',
      });
      if (res.data) {
        setIsOnline(res.data.availability);
      } else {
        setIsOnline(!isOnline);
      }
    } catch {
      setIsOnline(!isOnline);
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. PROMINENT ONLINE/OFFLINE DUTY TOGGLE & GREETING ── */}
      <section className="p-6 rounded-3xl bg-[#0F172A] border border-cyan-500/20 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-extrabold tracking-widest uppercase text-cyan-400">
                DUTY STATUS: {isOnline ? 'ONLINE & READY FOR DISPATCH' : 'OFFLINE'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome on Duty, <span className="text-cyan-300">{user?.name || 'Driver Partner'}</span>
            </h1>
          </div>

          {/* Duty Switch Button */}
          <button
            onClick={handleToggleDuty}
            disabled={toggleLoading}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-xl border active:scale-95 ${
              isOnline
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 shadow-black/40'
            }`}
          >
            {toggleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Power className={`w-5 h-5 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`} />
            )}
            <span>{isOnline ? 'GO OFFLINE' : 'GO ONLINE'}</span>
          </button>
        </div>

        {/* ── 2. METRICS CARDS (Today's Earnings, Trips, Rating) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Today's Earnings */}
          <div className="p-4 rounded-2xl bg-[#090D16] border border-cyan-500/15 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Earnings</p>
              <p className="text-xl font-extrabold text-white mt-0.5">
                ₹{loading ? '...' : (stats.todayEarnings || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Trips Completed */}
          <div className="p-4 rounded-2xl bg-[#090D16] border border-cyan-500/15 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Navigation className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trips Completed</p>
              <p className="text-xl font-extrabold text-white mt-0.5">
                {loading ? '...' : stats.tripsCompleted || 0}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="p-4 rounded-2xl bg-[#090D16] border border-cyan-500/15 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Driver Rating</p>
              <p className="text-xl font-extrabold text-white mt-0.5">
                {loading ? '...' : (driverData?.rating || 4.9).toFixed(1)} ★
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. MAP RADAR AREA & INCOMING REQUESTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incoming Requests Feed (Left 2 cols) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Incoming Dispatch Requests</span>
            </h2>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
              RADAR ACTIVE
            </span>
          </div>

          {!isOnline ? (
            <div className="p-10 rounded-3xl bg-[#0B101D] border border-white/5 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                <Power className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">You are currently Offline</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Toggle your duty switch to ONLINE above to start receiving ride requests in your area.
                </p>
              </div>
            </div>
          ) : (
            /* Empty State: No requests right now */
            <div className="p-10 rounded-3xl bg-[#0B101D] border border-cyan-500/15 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 animate-pulse">
                <Radio className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No requests right now</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Stay online. Nearby customer cab bookings and driver hire dispatches will appear here automatically.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Small Operational Map Placeholder (Right 1 col) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Coverage Zone</span>
            </h2>
            <span className="text-[10px] text-slate-400">GPS ACTIVE</span>
          </div>

          <div className="relative h-64 rounded-3xl bg-[#0B101D] border border-cyan-500/20 overflow-hidden flex items-center justify-center shadow-lg">
            {/* Grid overlay for high-contrast radar feel */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Radar Center Pulse */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping pointer-events-none" />
              </div>
              <p className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                {isOnline ? 'Zone: New Delhi NCR' : 'GPS Idle'}
              </p>
              <p className="text-[10px] text-slate-500">Live Telemetry Map Area</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
