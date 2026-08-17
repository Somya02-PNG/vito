'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  Zap,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Car,
  Key,
  LogOut,
  Phone,
  Mail,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function PartnerPendingPage() {
  const { user, logout, refetchUser } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isDriver = user?.partnerType === 'driver' || user?.role === 'driver';

  // Automatic background polling every 4 seconds to detect Admin approval
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchAPI<{ user: { status: string; role: string; partnerType: string } }>('/api/auth/me');
        if (res.data?.user?.status === 'active') {
          clearInterval(interval);
          await refetchUser();
          if (res.data.user.partnerType === 'rental_partner') {
            router.replace('/partner/dashboard');
          } else {
            router.replace('/driver/home');
          }
        }
      } catch {
        // Silently ignore polling network errors
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [router, refetchUser]);

  const handleManualCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const res = await fetchAPI<{ user: { status: string; partnerType: string } }>('/api/auth/me');
      if (res.data?.user?.status === 'active') {
        await refetchUser();
        setStatusMessage('Your application has been approved! Redirecting...');
        setTimeout(() => {
          if (res.data?.user?.partnerType === 'rental_partner') {
            router.replace('/partner/dashboard');
          } else {
            router.replace('/driver/home');
          }
        }, 800);
      } else {
        setStatusMessage('Your driver application is still under review. We will notify you once approved.');
      }
    } catch {
      setStatusMessage('Unable to connect to verification server. Please check your internet connection.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/partner/login';
  };

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-amber-600/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-500/4 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">VITO</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 0 30px -5px rgba(245,158,11,0.1)' }}>
          {/* Status Icon */}
          <div className="relative inline-flex mb-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#07090E] border-2 border-amber-500/30 flex items-center justify-center">
              {isDriver ? <Car className="w-3 h-3 text-cyan-400" /> : <Key className="w-3 h-3 text-emerald-400" />}
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-3">
            <Clock className="w-3 h-3" />
            Application Under Review
          </div>

          <h1 className="text-xl font-extrabold text-white mb-2">
            Application Under Review
          </h1>

          {user && (
            <p className="text-slate-300 text-xs mb-1">
              Applicant: <strong className="text-white">{user.name}</strong>
            </p>
          )}

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 font-medium">
            Your {isDriver ? 'driver' : 'rental partner'} application is under review. We&apos;ll notify you once approved.
          </p>

          {/* Status Alert Message */}
          {statusMessage && (
            <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={handleManualCheckStatus}
            disabled={checking}
            className="w-full mb-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{checking ? 'Checking Status...' : 'Check Approval Status'}</span>
          </button>

          {/* Verification Steps Timeline */}
          <div className="text-left space-y-2.5 mb-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400">Application Submitted</p>
                <p className="text-[10px] text-slate-500">Credentials & DL received</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-300">Under Admin Review</p>
                <p className="text-[10px] text-slate-500">Document verification in progress</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Access Granted</p>
                <p className="text-[10px] text-slate-600">Direct access to Driver Dashboard</p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left mb-4 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>partners@vito.com</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>1800-VITO-APP</span>
            </div>
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20 text-xs text-slate-400 hover:text-red-400 font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
