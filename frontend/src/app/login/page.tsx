'use client';

import React, { useEffect, useState } from 'react';
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
  Play,
  Loader2,
} from 'lucide-react';

export default function AuthenticationGatewayPage() {
  const { user, loading, demoLogin } = useAuth();
  const router = useRouter();
  const [launchingRole, setLaunchingRole] = useState<string | null>(null);

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace(getDashboardPath(user));
    }
  }, [user, loading, router]);

  const handleQuickDemo = async (role: 'customer' | 'driver' | 'partner' | 'admin') => {
    setLaunchingRole(role);
    try {
      const loggedUser = await demoLogin(role);
      const path = getDashboardPath(loggedUser);
      router.push(path);
    } catch (err) {
      console.error('Quick demo launch error:', err);
    } finally {
      setLaunchingRole(null);
    }
  };

  if (loading) return null;
  if (user) return null; // Will redirect

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-radial from-blue-600/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 space-y-8">
        {/* VITO Branding */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-2xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-950 rounded-[13px] flex items-center justify-center">
                <Zap className="w-7 h-7 text-blue-400 fill-blue-400/20" />
              </div>
            </div>
            <div className="text-left">
              <span className="text-3xl font-black tracking-tight text-white block">VITO</span>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">AI Mobility Platform</span>
            </div>
          </Link>

          <div className="pt-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Select Your Dashboard Portal
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Sign in with your credentials or launch 1-click Demo Mode instantly
            </p>
          </div>
        </div>

        {/* 3 Public Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. CUSTOMER */}
          <div className="group flex flex-col justify-between p-6 rounded-2xl bg-[#111827]/90 border border-white/[0.08] hover:border-blue-500/40 hover:bg-[#111827] transition-all duration-200 shadow-xl shadow-black/40 hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Customer</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Book rides, rent vehicles and plan trips
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button
                onClick={() => handleQuickDemo('customer')}
                disabled={launchingRole === 'customer'}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-950/40 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {launchingRole === 'customer' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
                <span>1-Click Demo</span>
              </button>

              <Link
                href="/customer/login"
                className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
              >
                <span>Account Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. DRIVER */}
          <div className="group flex flex-col justify-between p-6 rounded-2xl bg-[#111827]/90 border border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#111827] transition-all duration-200 shadow-xl shadow-black/40 hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Car className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Driver</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drive with VITO and manage trips and earnings
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button
                onClick={() => handleQuickDemo('driver')}
                disabled={launchingRole === 'driver'}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {launchingRole === 'driver' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
                <span>1-Click Demo</span>
              </button>

              <Link
                href="/driver/login"
                className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
              >
                <span>Driver Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 3. RENTAL PARTNER */}
          <div className="group flex flex-col justify-between p-6 rounded-2xl bg-[#111827]/90 border border-white/[0.08] hover:border-cyan-500/40 hover:bg-[#111827] transition-all duration-200 shadow-xl shadow-black/40 hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Rental Partner</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Manage vehicles, bookings and fleet earnings
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button
                onClick={() => handleQuickDemo('partner')}
                disabled={launchingRole === 'partner'}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-950/40 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {launchingRole === 'partner' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
                <span>1-Click Demo</span>
              </button>

              <Link
                href="/partner/login"
                className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
              >
                <span>Partner Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Prompts & Subtle Restricted Admin Access Link */}
        <div className="pt-4 flex flex-col items-center gap-4 text-center">
          <p className="text-xs text-slate-400">
            New to VITO?{' '}
            <Link href="/customer/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Create a customer account →
            </Link>
          </p>

          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={() => handleQuickDemo('admin')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Launch Demo Admin Portal</span>
            </button>
            <span className="text-slate-700">•</span>
            <Link
              href="/admin/login"
              className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors underline decoration-slate-700 underline-offset-4"
            >
              Restricted Admin Access
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
