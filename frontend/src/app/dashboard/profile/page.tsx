'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  UserCircle,
  Mail,
  Shield,
  UserCheck,
  Car,
  Key,
  ShieldCheck,
  LogOut,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function UserProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="relative overflow-hidden min-h-screen pb-12">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[400px] bg-hero-glow pointer-events-none opacity-60" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 pt-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[11px] font-semibold text-primary-300 uppercase tracking-wider w-fit mb-1.5">
            <UserCircle className="w-3 h-3" />
            Account Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            User <span className="text-gradient">Profile</span>
          </h1>
        </div>

        <div className="space-y-6">

          {/* Profile Card */}
          <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 border border-white/[0.15] flex items-center justify-center text-2xl sm:text-3xl font-black text-white uppercase shadow-xl">
                {user?.name?.charAt(0) || 'U'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">{user?.name || 'VITO Member'}</h2>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-extrabold text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED USER
                  </span>
                </div>
                <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {user?.email || 'user@vito.com'}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/[0.06]">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Account Role
                </span>
                <span className="text-sm font-bold text-white capitalize">{user?.role || 'user'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Security Status
                </span>
                <span className="text-sm font-bold text-emerald-400">Protected</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Platform Rating
                </span>
                <span className="text-sm font-bold text-amber-400">⭐ 4.9 / 5.0</span>
              </div>
            </div>
          </div>

          {/* Special Portal Portals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/driver"
              className="glass-panel p-5 rounded-2xl border border-white/[0.08] hover:border-primary-500/40 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/25 flex items-center justify-center text-primary-300">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">Driver Partner Portal</h3>
                  <p className="text-xs text-slate-400">View earnings, navigation & requests</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-300 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/dashboard/admin"
              className="glass-panel p-5 rounded-2xl border border-white/[0.08] hover:border-violet-500/40 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">Admin Command Center</h3>
                  <p className="text-xs text-slate-400">Manage drivers, users & analytics</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-300 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* Logout Action */}
          <div className="pt-2">
            <button
              onClick={() => logout()}
              className="w-full py-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-bold hover:bg-rose-500/25 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
