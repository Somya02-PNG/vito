'use client';

import React, { useState } from 'react';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  UserCircle,
  Car,
  Building2,
  Shield,
  ArrowRight,
  Sparkles,
  Play,
  Loader2,
  ServerCrash,
  RefreshCw,
  CheckCircle2,
  Key,
  MapPin,
  Clock,
  Navigation,
} from 'lucide-react';

export default function VitoLandingPage() {
  const { user, loading, backendError, refetchUser, demoLogin, logout } = useAuth();
  const router = useRouter();
  const [launchingRole, setLaunchingRole] = useState<string | null>(null);

  const handleLaunchDashboard = async (role: 'customer' | 'driver' | 'partner' | 'admin', targetPath: string) => {
    setLaunchingRole(role);
    try {
      if (user && (user.role === role || (role === 'driver' && user.partnerType === 'driver') || (role === 'partner' && user.partnerType === 'rental_partner'))) {
        router.push(targetPath);
      } else {
        const loggedUser = await demoLogin(role);
        const path = getDashboardPath(loggedUser);
        router.push(path);
      }
    } catch (err) {
      console.error('Failed to launch dashboard demo mode:', err);
    } finally {
      setLaunchingRole(null);
    }
  };

  // ─── Backend Service Error State ───────────────────────────────────────────
  if (!loading && backendError) {
    return (
      <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1),transparent_70%)] pointer-events-none" />
        <div className="w-full max-w-md relative z-10 text-center space-y-6 p-8 rounded-3xl bg-[#111827]/90 border border-red-500/20 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-950/40">
            <ServerCrash className="w-8 h-8 text-red-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Backend Service Offline</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Unable to connect to the VITO backend service. Please ensure the backend server is running on port 5000.
            </p>
          </div>

          <button
            onClick={() => refetchUser()}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-500 border border-red-500/40 shadow-lg shadow-red-950/50 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090E] text-slate-200 relative overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      {/* Dynamic Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-radial from-blue-600/15 via-indigo-600/5 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090E]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <div className="w-full h-full bg-[#07090E] rounded-[9.5px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400 fill-blue-400/20" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white block leading-none">VITO</span>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">AI Mobility Platform</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* System Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend Connected</span>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(getDashboardPath(user))}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <span>My Portal ({user.name.split(' ')[0]})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => logout()}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.05] border border-white/[0.08]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/20 shadow-lg shadow-blue-600/25 transition-all"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 uppercase tracking-widest shadow-lg shadow-blue-950/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Mobility Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            One Platform.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
              Three Powerful Dashboards.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Experience VITO&apos;s AI-driven mobility hub. Explore the Customer, Driver, and Rental Partner portals in 1-click interactive demo mode.
          </p>
        </div>

        {/* ── The 3 Core Dashboards Showcase ── */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

          {/* 1. CUSTOMER DASHBOARD */}
          <div className="group relative rounded-3xl bg-[#111827]/90 border border-blue-500/20 p-8 flex flex-col justify-between hover:border-blue-500/50 hover:bg-[#111827] transition-all duration-300 shadow-2xl shadow-black/50 hover:-translate-y-1.5">
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCircle className="w-32 h-32 text-blue-400" />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-950/50 group-hover:scale-110 transition-transform">
                  <UserCircle className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Portal #1
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Customer Dashboard</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Instant cab booking, self-drive rentals, verified driver hire, safety alerts, and AI-powered trip planning.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2">
                {[
                  'Instant Cab Booking & Fare Estimate',
                  'Vehicle Rentals & Doorstep Delivery',
                  'Hourly Verified Driver Hire',
                  'AI Itinerary & Split-Expense Planner',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 space-y-3">
              <button
                onClick={() => handleLaunchDashboard('customer', '/customer/home')}
                disabled={launchingRole === 'customer'}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/30 shadow-lg shadow-blue-950/50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {launchingRole === 'customer' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Launch Customer Dashboard</span>
              </button>

              <Link
                href="/customer/login"
                className="block text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                Sign in with personal account →
              </Link>
            </div>
          </div>

          {/* 2. DRIVER DASHBOARD */}
          <div className="group relative rounded-3xl bg-[#111827]/90 border border-emerald-500/20 p-8 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-[#111827] transition-all duration-300 shadow-2xl shadow-black/50 hover:-translate-y-1.5">
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
              <Car className="w-32 h-32 text-emerald-400" />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50 group-hover:scale-110 transition-transform">
                  <Car className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Portal #2
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Driver Dashboard</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Real-time ride request queue, online availability toggle, earnings analytics, and safety SOS protocol.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2">
                {[
                  'Live Duty Availability Toggle',
                  'Instant Ride Accept & OTP Verification',
                  'Daily & Weekly Earnings Payouts',
                  'Driver Wallet & Rating Insights',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 space-y-3">
              <button
                onClick={() => handleLaunchDashboard('driver', '/driver/home')}
                disabled={launchingRole === 'driver'}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {launchingRole === 'driver' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Launch Driver Dashboard</span>
              </button>

              <Link
                href="/driver/login"
                className="block text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                Sign in with driver account →
              </Link>
            </div>
          </div>

          {/* 3. RENTAL PARTNER DASHBOARD */}
          <div className="group relative rounded-3xl bg-[#111827]/90 border border-cyan-500/20 p-8 flex flex-col justify-between hover:border-cyan-500/50 hover:bg-[#111827] transition-all duration-300 shadow-2xl shadow-black/50 hover:-translate-y-1.5">
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
              <Building2 className="w-32 h-32 text-cyan-400" />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  Portal #3
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Rental Partner Dashboard</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Fleet vehicle management, active booking tracking, pricing setup, and revenue analytics.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2">
                {[
                  'Fleet Vehicle Inventory & Status',
                  'Rental Booking Schedule & Calendar',
                  'Revenue Analytics & Payout History',
                  'Vehicle Maintenance Tracker',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 space-y-3">
              <button
                onClick={() => handleLaunchDashboard('partner', '/partner/dashboard')}
                disabled={launchingRole === 'partner'}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/30 shadow-lg shadow-cyan-950/50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {launchingRole === 'partner' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Launch Partner Dashboard</span>
              </button>

              <Link
                href="/partner/login"
                className="block text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                Sign in with partner account →
              </Link>
            </div>
          </div>

        </div>

        {/* ── Bonus Admin Access & Platform Stats Banner ── */}
        <div className="mt-12 rounded-3xl bg-[#111827]/70 border border-white/[0.08] p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Platform Administrator Portal</h4>
              <p className="text-xs text-slate-400">System control, driver verification approvals, ride dispatch oversight & operations.</p>
            </div>
          </div>

          <button
            onClick={() => handleLaunchDashboard('admin', '/admin/dashboard')}
            disabled={launchingRole === 'admin'}
            className="px-6 py-3 rounded-xl font-bold text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shrink-0 flex items-center gap-2"
          >
            {launchingRole === 'admin' ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            <span>Open Admin Dashboard</span>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-slate-500">
        <p>© 2026 VITO AI Mobility Platform. All rights reserved.</p>
      </footer>
    </main>
  );
}
