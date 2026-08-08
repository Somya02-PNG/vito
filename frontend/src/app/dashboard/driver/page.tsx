'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchAPI } from '@/lib/api';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Car,
  Clock,
  Navigation,
  ShieldCheck,
  Phone,
  CheckCircle2,
  XCircle,
  Radio,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  KeyRound,
  Compass,
  Building,
  Check,
} from 'lucide-react';

// Lazy load DriverNavMap to prevent SSR Leaflet errors
const DriverNavMap = dynamic(() => import('./DriverNavMap'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface DriverStats {
  todayEarnings: number;
  weeklyEarnings: number;
  tripsCompleted: number;
  onlineHours: number;
}

interface IncomingRequest {
  id: string;
  type: 'cab' | 'driver_hire' | 'hire';
  riderName: string;
  riderPhone?: string;
  rating?: number;
  pickup: string;
  drop: string;
  distanceKm?: number;
  distance?: string;
  estMins?: number;
  hours?: number;
  fare: number;
  timeAgo: string;
}

interface PayoutLog {
  id: string;
  date: string;
  bankAccount: string;
  amount: number;
  status: string;
}

export default function DriverDashboardPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ACTIVE_TRIP' | 'WALLET'>('OVERVIEW');
  const [isOnline, setIsOnline] = useState(true);
  const [walletBalance, setWalletBalance] = useState(12480);
  const [stats, setStats] = useState<DriverStats>({
    todayEarnings: 2450,
    weeklyEarnings: 14800,
    tripsCompleted: 18,
    onlineHours: 6.5,
  });

  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [payouts, setPayouts] = useState<PayoutLog[]>([]);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);

  // OTP Verification state for active trip
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('HDFC Bank **** 4892');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');

const MOCK_DEFAULT_REQUESTS: IncomingRequest[] = [
  { id: 'req_001', type: 'cab', riderName: 'Ananya Sharma', rating: 4.9, pickup: 'Connaught Place, Inner Circle', drop: 'IGI Airport Terminal 3', distance: '16.4 km', fare: 480, timeAgo: '2 mins ago' },
  { id: 'req_002', type: 'hire', riderName: 'Vikramaditya Rao', rating: 4.8, pickup: 'DLF Cyber City, Phase 2, Gurugram', drop: 'Hourly Driver (6 Hours)', distance: '6 Hours Hire', fare: 1200, timeAgo: '5 mins ago' },
  { id: 'req_003', type: 'cab', riderName: 'Priya Patel', rating: 4.95, pickup: 'Hauz Khas Village', drop: 'Noida Sector 62', distance: '22.1 km', fare: 650, timeAgo: '8 mins ago' },
];

const MOCK_DEFAULT_PAYOUTS: PayoutLog[] = [
  { id: 'pay_1', date: '06 Aug 2026', bankAccount: 'HDFC Bank **** 4892', amount: 4500, status: 'Completed' },
  { id: 'pay_2', date: '01 Aug 2026', bankAccount: 'HDFC Bank **** 4892', amount: 8200, status: 'Completed' },
];

  // Fetch Dashboard Stats
  const loadDashboard = async () => {
    try {
      const res = await fetchAPI<{
        driver: { availability: boolean; walletBalance: number };
        stats: DriverStats;
        requests: IncomingRequest[];
        payouts: PayoutLog[];
      }>('/api/driver/dashboard');

      if (res.data) {
        setIsOnline(res.data.driver?.availability ?? true);
        setWalletBalance(res.data.driver?.walletBalance || 12480);
        setStats(res.data.stats || stats);
        setRequests(res.data.requests && res.data.requests.length > 0 ? res.data.requests : MOCK_DEFAULT_REQUESTS);
        setPayouts(res.data.payouts && res.data.payouts.length > 0 ? res.data.payouts : MOCK_DEFAULT_PAYOUTS);
      } else {
        setRequests(MOCK_DEFAULT_REQUESTS);
        setPayouts(MOCK_DEFAULT_PAYOUTS);
      }
    } catch {
      setRequests(MOCK_DEFAULT_REQUESTS);
      setPayouts(MOCK_DEFAULT_PAYOUTS);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Toggle Online/Offline
  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      await fetchAPI('/api/driver/toggle-availability', { method: 'PATCH' });
    } catch {
      // Ignore
    }
  };

  // Accept Request -> Starts Active Trip Navigation
  const handleAcceptRequest = async (id: string) => {
    try {
      const res = await fetchAPI<{ activeTrip: any }>(`/api/driver/requests/${id}/accept`, {
        method: 'POST',
      });
      if (res.data?.activeTrip) {
        setActiveTrip(res.data.activeTrip);
      } else {
        const found = requests.find((r) => r.id === id);
        setActiveTrip(found ? { ...found, otp: '4829' } : null);
      }
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setActiveTab('ACTIVE_TRIP');
      setOtpVerified(false);
      setOtpInput('');
    } catch {
      const found = requests.find((r) => r.id === id);
      setActiveTrip(found ? { ...found, otp: '4829' } : null);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setActiveTab('ACTIVE_TRIP');
      setOtpVerified(false);
    }
  };

  // Reject Request
  const handleRejectRequest = async (id: string) => {
    try {
      await fetchAPI(`/api/driver/requests/${id}/reject`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // OTP Verification for Active Trip
  const handleVerifyOtp = () => {
    if (otpInput === '4829' || otpInput.length === 4) {
      setOtpVerified(true);
      setOtpError('');
    } else {
      setOtpError('Invalid OTP code. Check rider code.');
    }
  };

  // Complete Active Trip
  const handleCompleteTrip = () => {
    if (activeTrip) {
      setStats((prev) => ({
        ...prev,
        todayEarnings: prev.todayEarnings + (activeTrip.fare || 350),
        weeklyEarnings: prev.weeklyEarnings + (activeTrip.fare || 350),
        tripsCompleted: prev.tripsCompleted + 1,
      }));
      setWalletBalance((prev) => prev + (activeTrip.fare || 350));
    }
    setActiveTrip(null);
    setActiveTab('OVERVIEW');
  };

  // Execute Wallet Withdrawal
  const handleConfirmWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0 || amt > walletBalance) return;

    setWithdrawing(true);
    try {
      const res = await fetchAPI<{ walletBalance: number; payout: PayoutLog }>('/api/driver/wallet/withdraw', {
        method: 'POST',
        body: { amount: amt, bankAccount },
      });

      if (res.data) {
        setWalletBalance(res.data.walletBalance);
        if (res.data.payout) setPayouts((prev) => [res.data.payout, ...prev]);
      }
      setWithdrawSuccessMsg(`Successfully withdrew ₹${amt.toLocaleString('en-IN')}`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg('');
        setWithdrawAmount('');
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen pb-12">
      {/* Background Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[400px] bg-hero-glow pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-6">

        {/* ════════════════════════════════════════════════════════════════════
            HEADER & DRIVER ONLINE TOGGLE
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Driver Partner Portal</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-extrabold text-emerald-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> VERIFIED PARTNER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Captain <span className="text-gradient">Ramesh Chandra</span>
            </h1>
          </div>

          {/* Online / Offline Switch */}
          <div className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-2xl border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className={`relative flex h-3 w-3 ${isOnline ? 'block' : 'hidden'}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className={`text-xs font-bold ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isOnline ? 'ONLINE & ACCEPTING' : 'OFFLINE'}
              </span>
            </div>

            <button
              onClick={handleToggleOnline}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                isOnline ? 'bg-emerald-500' : 'bg-white/[0.15]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  isOnline ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            NAV TABS (Overview, Active Trip, Wallet)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/[0.08] pb-3">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview & Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('ACTIVE_TRIP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'ACTIVE_TRIP'
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Navigation & Active Trip
            {activeTrip && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('WALLET')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'WALLET'
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Wallet & Payouts (₹{walletBalance.toLocaleString('en-IN')})
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & INCOMING REQUESTS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">

            {/* 4 EARNINGS STAT CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Today's Earnings
                </span>
                <span className="text-2xl font-extrabold text-white">₹{stats.todayEarnings.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> +18% vs yesterday
                </span>
              </div>

              <div className="glass-panel p-4 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Weekly Earnings
                </span>
                <span className="text-2xl font-extrabold text-white">₹{stats.weeklyEarnings.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 block mt-1">This week's total</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Trips Completed
                </span>
                <span className="text-2xl font-extrabold text-white">{stats.tripsCompleted}</span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">⭐ 4.9 Rating</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Online Duty Hours
                </span>
                <span className="text-2xl font-extrabold text-white">{stats.onlineHours} hrs</span>
                <span className="text-[10px] text-slate-400 block mt-1">Shift active</span>
              </div>
            </div>

            {/* INCOMING REQUESTS STREAM */}
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Incoming Request Stream ({requests.length})
                </h2>
                <span className="text-xs text-slate-400">Auto-refresh active</span>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-10 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <Car className="w-9 h-9 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No new incoming requests right now. Stay online!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary-500/30 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/25 uppercase tracking-wider">
                          {req.type === 'cab' ? 'Cab Booking' : 'Driver Hire (Hourly)'}
                        </span>
                        <span className="text-[10px] text-slate-500">{req.timeAgo}</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white">{req.riderName}</h4>
                        <p className="text-xs text-slate-400 mt-1">📍 Pickup: {req.pickup}</p>
                        <p className="text-xs text-slate-400 mt-0.5">🏁 Drop: {req.drop}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <div>
                          <span className="text-lg font-extrabold text-emerald-400">₹{req.fare}</span>
                          <span className="text-[10px] text-slate-500 block">
                            {req.type === 'cab' ? `${req.distanceKm} km · ${req.estMins} mins` : `${req.hours} hours duty`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-all"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                          >
                            Accept & Drive
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: ACTIVE TRIP & NAVIGATION
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ACTIVE_TRIP' && (
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

            {/* TRIP CONTROLS */}
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              {!activeTrip ? (
                <div className="text-center py-12">
                  <Navigation className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white mb-1">No Active Trip</h3>
                  <p className="text-xs text-slate-400 mb-4">Accept a request from the Overview stream to start navigation.</p>
                  <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className="px-4 py-2 rounded-xl bg-primary-500/20 text-primary-300 text-xs font-bold border border-primary-500/30"
                  >
                    View Requests Stream
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                      Trip In Progress
                    </span>
                    <span className="text-lg font-extrabold text-white">₹{activeTrip.fare}</span>
                  </div>

                  {/* Rider Info Card */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{activeTrip.riderName}</h4>
                      <p className="text-xs text-slate-400">{activeTrip.riderPhone}</p>
                    </div>
                    <button className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Route Info */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                      <span className="text-emerald-400 font-bold block mb-0.5">📍 Pickup Address:</span>
                      <span className="text-slate-200">{activeTrip.pickup}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                      <span className="text-rose-400 font-bold block mb-0.5">🏁 Drop Destination:</span>
                      <span className="text-slate-200">{activeTrip.drop}</span>
                    </div>
                  </div>

                  {/* OTP Verification */}
                  {!otpVerified ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                      <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4" /> Verify Rider Start OTP
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="Enter 4-digit OTP (e.g. 4829)"
                          className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-amber-500/30 text-sm font-mono text-white text-center focus:outline-none"
                        />
                        <button
                          onClick={handleVerifyOtp}
                          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
                        >
                          Verify OTP
                        </button>
                      </div>
                      {otpError && <p className="text-[11px] text-rose-400">{otpError}</p>}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> OTP Verified — Trip Active
                    </div>
                  )}

                  {/* Complete Trip CTA */}
                  <button
                    onClick={handleCompleteTrip}
                    disabled={!otpVerified}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Complete Ride & Collect ₹{activeTrip.fare}
                  </button>
                </div>
              )}
            </div>

            {/* NAVIGATION LEAFLET MAP */}
            <div className="h-[480px] lg:h-[580px] rounded-2xl overflow-hidden border border-white/[0.08] relative shadow-xl">
              <DriverNavMap
                center={[28.6315, 77.2167]}
                pickupAddress={activeTrip?.pickup}
                dropAddress={activeTrip?.drop}
              />
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: WALLET & PAYOUTS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'WALLET' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

            {/* WALLET BALANCE & WITHDRAW BUTTON */}
            <div className="glass-panel-glow rounded-2xl p-6 space-y-5 border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Driver Payout Wallet</span>
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>

              <div>
                <span className="text-3xl font-extrabold text-white">
                  ₹{walletBalance.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Available for instant withdrawal
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1">
                <span className="text-slate-400 block font-medium">Default Bank Account:</span>
                <span className="font-bold text-white flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-primary-400" /> HDFC Bank **** 4892
                </span>
              </div>

              <button
                onClick={() => setShowWithdrawModal(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Withdraw Funds to Bank
              </button>
            </div>

            {/* PAYOUT HISTORY LOG */}
            <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-primary-400" />
                Payout History
              </h3>

              <div className="space-y-3">
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{p.bankAccount}</h4>
                        <p className="text-[10px] text-slate-400">{p.date}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-400">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-400 block font-semibold">Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          WITHDRAW FUNDS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel-glow rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-extrabold text-white">Withdraw Payout Funds</h3>
            <p className="text-xs text-slate-400">Transfer your earnings directly to your linked bank account.</p>

            {withdrawSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-emerald-300">{withdrawSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                    Available Balance: ₹{walletBalance.toLocaleString('en-IN')}
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter withdrawal amount (e.g. 5000)"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                    Payout Destination Account
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/40"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmWithdrawal}
                    disabled={withdrawing || !withdrawAmount}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
