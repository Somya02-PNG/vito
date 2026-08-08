'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Zap,
  Search,
  MapPin,
  Car,
  Key,
  UserCheck,
  Sparkles,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
  Navigation,
  Compass,
  Activity,
  Server,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  UserCircle,
  LogIn,
  UserPlus,
  SlidersHorizontal,
} from 'lucide-react';

interface BackendHealth {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    state: string;
    connected: boolean;
  };
  system: {
    platform: string;
    nodeVersion: string;
  };
}

export default function LandingHomePage() {
  const { user } = useAuth();

  // Search tab state
  const [activeSearchTab, setActiveSearchTab] = useState<'RENTAL' | 'CAB' | 'HIRE' | 'PLANNER'>('RENTAL');
  const [searchLocation, setSearchLocation] = useState('');

  // Hidden Dev Health Monitor State
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [healthData, setHealthData] = useState<BackendHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const checkHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await fetch(`${API_URL}/api/health`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BackendHealth = await res.json();
      setHealthData(data);
    } catch (err: any) {
      setHealthError(err?.message || 'Backend unreachable');
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getSearchHref = () => {
    switch (activeSearchTab) {
      case 'RENTAL':
        return `/dashboard/rental${searchLocation ? `?location=${encodeURIComponent(searchLocation)}` : ''}`;
      case 'CAB':
        return `/dashboard/cab${searchLocation ? `?pickup=${encodeURIComponent(searchLocation)}` : ''}`;
      case 'HIRE':
        return `/dashboard/hire${searchLocation ? `?location=${encodeURIComponent(searchLocation)}` : ''}`;
      case 'PLANNER':
        return `/dashboard/planner${searchLocation ? `?destination=${encodeURIComponent(searchLocation)}` : ''}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 relative overflow-hidden flex flex-col justify-between">
      
      {/* ── Ambient Glow Background ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-hero-glow pointer-events-none opacity-80" />
      <div className="absolute top-60 -right-40 w-[500px] h-[500px] bg-primary-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 -left-40 w-[500px] h-[500px] bg-accent-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* ════════════════════════════════════════════════════════════════════
          TOP NAVIGATION BAR
      ════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07090E]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 via-primary-400 to-accent-500 p-[1px] shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#07090E] rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-300 fill-primary-400/20" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                VITO <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20 font-bold uppercase tracking-wider">AI Mobility</span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/dashboard/rental" className="hover:text-primary-300 transition-colors flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-emerald-400" /> Rentals
            </Link>
            <Link href="/dashboard/cab" className="hover:text-primary-300 transition-colors flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-primary-400" /> Cabs
            </Link>
            <Link href="/dashboard/hire" className="hover:text-primary-300 transition-colors flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-accent-400" /> Driver Hire
            </Link>
            <Link href="/dashboard/planner" className="hover:text-primary-300 transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI Planner
            </Link>
            <Link href="/dashboard/safety" className="hover:text-primary-300 transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-rose-400" /> Safety
            </Link>
          </nav>

          {/* Auth Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/25 active:scale-95 flex items-center gap-1.5"
                >
                  Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] text-slate-300 transition-colors"
                  title="Profile"
                >
                  <UserCircle className="w-4.5 h-4.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" /> Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/25 active:scale-95 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Get Started
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION & MOBILITY SEARCH BAR
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-semibold backdrop-blur-md">
            <Compass className="w-4 h-4 text-accent-400" />
            AI-Driven Autonomous & Connected Mobility
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            One Platform. <br />
            <span className="text-gradient">Every Urban Journey.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Self-drive vehicle rentals, instant cab rides, verified hourly drivers, and smart AI trip planning — seamlessly connected in VITO.
          </p>
        </div>

        {/* Mobility Search Widget */}
        <div className="max-w-3xl mx-auto glass-panel-glow rounded-3xl p-4 sm:p-6 border-white/[0.1] shadow-2xl relative">
          
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 mb-4 border-b border-white/[0.08] pb-3 overflow-x-auto scrollbar-hide">
            {[
              { id: 'RENTAL', label: 'Self-Drive Rental', icon: Key, color: 'text-emerald-400' },
              { id: 'CAB', label: 'Book a Cab', icon: Car, color: 'text-primary-400' },
              { id: 'HIRE', label: 'Hire a Driver', icon: UserCheck, color: 'text-accent-400' },
              { id: 'PLANNER', label: 'AI Trip Planner', icon: Sparkles, color: 'text-violet-400' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeSearchTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSearchTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Inputs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder={
                  activeSearchTab === 'RENTAL'
                    ? 'Enter pickup city or landmark (e.g. Connaught Place)...'
                    : activeSearchTab === 'CAB'
                    ? 'Enter pickup location...'
                    : activeSearchTab === 'HIRE'
                    ? 'Enter hiring location...'
                    : 'Enter destination (e.g. Goa, Manali, Leh)...'
                }
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-all"
              />
            </div>

            <Link
              href={getSearchHref()}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-primary-500/25 active:scale-95 flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              Search Mobility
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          MODULE SHOWCASE CARDS GRID
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Explore VITO Services</h2>
            <p className="text-xs text-slate-400 mt-1">Select a mobility module to launch your journey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD 1: RENTALS */}
          <Link
            href="/dashboard/rental"
            className="group glass-panel p-6 rounded-3xl border-white/[0.08] hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase tracking-wider">
                  Self-Drive Fleet
                </span>
                <h3 className="text-lg font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors">
                  Vehicle Rental
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Sedans, SUVs, EVs, and bikes. Flex durations, transparent rates, and doorstep delivery.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Browse Fleet (15+ Vehicles)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 2: CABS */}
          <Link
            href="/dashboard/cab"
            className="group glass-panel p-6 rounded-3xl border-white/[0.08] hover:border-primary-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/25 flex items-center justify-center text-primary-300">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary-500/15 text-primary-300 border border-primary-500/25 uppercase tracking-wider">
                  Instant Rides
                </span>
                <h3 className="text-lg font-bold text-white mt-2 group-hover:text-primary-300 transition-colors">
                  Book a Cab
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Live nearby driver simulation, upfront fare calculation, and 4-digit OTP trip verification.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-primary-300">
              <span>Book Ride Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 3: DRIVER HIRE */}
          <Link
            href="/dashboard/hire"
            className="group glass-panel p-6 rounded-3xl border-white/[0.08] hover:border-accent-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-accent-500/15 text-accent-300 border border-accent-500/25 uppercase tracking-wider">
                  Hourly Hire
                </span>
                <h3 className="text-lg font-bold text-white mt-2 group-hover:text-accent-300 transition-colors">
                  Driver on Demand
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Background-checked professional drivers on hourly hire. 20% night fare & outstation allowances.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-accent-400">
              <span>Hire Verified Driver</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 4: AI PLANNER */}
          <Link
            href="/dashboard/planner"
            className="group glass-panel p-6 rounded-3xl border-white/[0.08] hover:border-violet-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/25 uppercase tracking-wider">
                  AI & Splitter
                </span>
                <h3 className="text-lg font-bold text-white mt-2 group-hover:text-violet-300 transition-colors">
                  Trip Planner & Expense Splitter
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Smart multi-day itinerary generation + greedy debt minimization algorithm ("who owes whom").
                </p>
              </div>
            </div>
            <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-violet-400">
              <span>Plan Trip & Split Costs</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 5: SAFETY HUB */}
          <Link
            href="/dashboard/safety"
            className="group glass-panel p-6 rounded-3xl border-white/[0.08] hover:border-rose-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25 uppercase tracking-wider">
                  24/7 Security
                </span>
                <h3 className="text-lg font-bold text-white mt-2 group-hover:text-rose-300 transition-colors">
                  Safety Center & SOS
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Panic SOS emergency button with SMS dispatch, live tracking link generator & trusted contact management.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-rose-400">
              <span>Open Safety Hub</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* CARD 6: DRIVER PARTNER DASHBOARD */}
          <Link
            href="/dashboard/driver"
            className="group glass-panel p-6 rounded-3xl border-white/[0.08] hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <UserCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase tracking-wider">
                  Partner Portal
                </span>
                <h3 className="text-lg font-bold text-white mt-2 group-hover:text-amber-300 transition-colors">
                  Driver Dashboard
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Duty toggle, turn-by-turn navigation map mode, incoming trip stream & in-app wallet payouts.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Driver Partner Mode</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          COLLAPSIBLE DEV SYSTEM HEALTH MONITOR (HIDDEN BY DEFAULT)
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] bg-[#04060A] py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} VITO Mobility Platform. All rights reserved.
            </p>

            {/* Toggle Debug Panel Button */}
            <button
              onClick={() => setShowDevPanel((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Dev System Health Monitor
              {showDevPanel ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>

          {/* Dev Debug Panel */}
          {showDevPanel && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-cyan-400" /> Backend API Status: {API_URL}/api/health
                </span>
                <button
                  onClick={checkHealth}
                  disabled={healthLoading}
                  className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 hover:bg-blue-600/30 transition-all flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {healthError ? (
                <p className="text-rose-400">Error: {healthError}</p>
              ) : healthData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-white/[0.03]">Status: {healthData.status}</div>
                  <div className="p-2 rounded bg-white/[0.03]">Service: {healthData.service}</div>
                  <div className="p-2 rounded bg-white/[0.03]">MongoDB: {healthData.database?.state}</div>
                  <div className="p-2 rounded bg-white/[0.03]">Node: {healthData.system?.nodeVersion}</div>
                </div>
              ) : (
                <p className="text-slate-400">Testing connection...</p>
              )}
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}
