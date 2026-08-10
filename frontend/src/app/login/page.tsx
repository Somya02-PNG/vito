'use client';

import React, { useEffect } from 'react';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  UserCircle,
  Briefcase,
  Shield,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace(getDashboardPath(user));
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null; // Will redirect

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-radial from-blue-600/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-2xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-950 rounded-[13px] flex items-center justify-center">
                <Zap className="w-7 h-7 text-blue-400 fill-blue-400/20" />
              </div>
            </div>
            <div className="text-left">
              <span className="text-3xl font-black tracking-tight text-white block">VITO</span>
              <span className="text-xs text-slate-400">AI Mobility Platform</span>
            </div>
          </Link>
        </div>

        <h1 className="text-center text-xl font-bold text-white mb-2">Choose your login portal</h1>
        <p className="text-center text-sm text-slate-400 mb-8">Select the portal that matches your account type</p>

        {/* Portal Cards */}
        <div className="space-y-3">
          {/* Customer */}
          <Link
            href="/customer/login"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-[#111827]/80 border border-white/[0.06] hover:border-blue-500/30 hover:bg-[#111827] transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <UserCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white">Customer</h3>
              <p className="text-xs text-slate-400 mt-0.5">Book rides, rent vehicles, plan trips</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Partner */}
          <Link
            href="/partner/login"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-[#111827]/80 border border-white/[0.06] hover:border-cyan-500/30 hover:bg-[#111827] transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white">Partner</h3>
              <p className="text-xs text-slate-400 mt-0.5">Driver or rental partner dashboard</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Admin */}
          <Link
            href="/admin/login"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-[#0A0A10]/80 border border-white/[0.04] hover:border-violet-500/20 hover:bg-[#0A0A10] transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/8 border border-violet-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-300">Administrator</h3>
              <p className="text-xs text-slate-500 mt-0.5">Restricted platform management access</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* New customer prompt */}
        <p className="mt-8 text-center text-sm text-slate-400">
          New to VITO?{' '}
          <Link href="/customer/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create a customer account →
          </Link>
        </p>
      </div>
    </main>
  );
}
