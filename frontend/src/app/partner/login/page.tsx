'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  Briefcase,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function PartnerLoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getDashboardPath(user));
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login({ email, password });

      // Only allow partner or legacy driver roles
      const allowedRoles = ['partner', 'driver'];
      if (!allowedRoles.includes(loggedInUser.role)) {
        setError('This portal is for partners only. Please use the correct login portal.');
        setLoading(false);
        return;
      }

      // Redirect based on status and type
      router.replace(getDashboardPath(loggedInUser));
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4">
      {/* Background Effects — Cyan/teal theme for partners */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-cyan-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-500/6 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">VITO</span>
          </Link>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <p className="text-sm text-slate-400">Partner Portal — Driver & Rental</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(8,145,178,0.25)', boxShadow: '0 0 30px -5px rgba(8,145,178,0.15)' }}>
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Partner Sign In</h1>
            <p className="text-sm text-slate-400 mt-1">Access your driver or rental partner dashboard</p>
          </div>

          {/* Error / Pending Notice */}
          {error && (
            <div className={`mb-5 p-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-in fade-in duration-200 ${
              error.toLowerCase().includes('pending')
                ? 'bg-amber-950/40 border border-amber-500/40 text-amber-200'
                : 'bg-red-950/40 border border-red-800/40 text-red-300'
            }`}>
              {error.toLowerCase().includes('pending') ? (
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span>
                {error.toLowerCase().includes('pending')
                  ? "Your driver application is under review. We'll notify you once approved."
                  : error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="partner-login-email" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="partner-login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="partner-login-password" className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/partner/forgot-password" className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="partner-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-cyan-600/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Partner Sign In'}
            </button>
          </form>

          {/* Pending Info */}
          <div className="mt-5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300/80">
              New partners start with <strong>PENDING</strong> status and must be approved by admin before accessing the dashboard.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-slate-500 font-medium">NEW PARTNER?</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Register Link */}
          <Link
            href="/partner/register"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-sm text-cyan-300 hover:text-cyan-200 font-medium transition-all"
          >
            Become a Vito Partner
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Portal Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-500">Looking for a different portal?</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/customer/login" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Customer Login
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/admin/login" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
