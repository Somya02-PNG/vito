'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';

export default function PartnerPendingPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/partner/login';
  };

  const isDriver = user?.partnerType === 'driver' || user?.role === 'driver';

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-amber-600/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-500/4 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
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
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(17,24,39,0.80)', backdropFilter: 'blur(16px)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 30px -5px rgba(245,158,11,0.1)' }}>
          {/* Status Icon */}
          <div className="relative inline-flex mb-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#07090E] border-2 border-amber-500/30 flex items-center justify-center">
              {isDriver ? <Car className="w-3.5 h-3.5 text-cyan-400" /> : <Key className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-4">
            <Clock className="w-3 h-3" />
            Application Under Review
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-3">
            Application Received!
          </h1>

          {user && (
            <p className="text-slate-300 text-sm mb-2">
              Thank you, <strong className="text-white">{user.name}</strong>
            </p>
          )}

          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your {isDriver ? 'driver' : 'rental partner'} application has been submitted and is currently under review by the VITO team.
            You'll be notified once your account is approved.
          </p>

          {/* Timeline */}
          <div className="text-left space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400">Application Submitted</p>
                <p className="text-[10px] text-slate-500">Your details have been received</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-300">Under Verification</p>
                <p className="text-[10px] text-slate-500">Admin review in progress (24-48 hrs)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Account Activated</p>
                <p className="text-[10px] text-slate-600">Access your partner dashboard</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left mb-6">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Need help?</p>
            <div className="space-y-1.5">
              <a href="mailto:partners@vito.com" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                partners@vito.com
              </a>
              <a href="tel:+911800VITOAPP" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                1800-VITO-APP
              </a>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/20 text-sm text-slate-400 hover:text-red-400 font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
