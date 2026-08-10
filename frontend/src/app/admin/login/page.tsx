'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  Shield,
  ShieldAlert,
} from 'lucide-react';

export default function AdminLoginPage() {
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
      setError('Please enter your credentials.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login({ email, password, requiredRole: 'admin' });

      // Strictly enforce admin role
      if (loggedInUser.role !== 'admin') {
        setError('Invalid administrator credentials.');
        setLoading(false);
        return;
      }

      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <main className="min-h-screen bg-[#040608] relative overflow-hidden flex items-center justify-center px-4">
      {/* Very dark, austere background — different from customer/partner portals */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(109,40,217,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(91,33,182,0.04),transparent_50%)] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Header — No VITO logo link; just the shield */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-900/20">
              <Shield className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-violet-400/60 uppercase tracking-[0.25em] mb-1">VITO Platform</div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">Administrator Access</h1>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(10,10,16,0.90)', backdropFilter: 'blur(16px)', border: '1px solid rgba(109,40,217,0.2)', boxShadow: '0 0 40px -8px rgba(109,40,217,0.15)' }}>
          {/* Security notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-500/8 border border-violet-500/15 mb-6">
            <ShieldAlert className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-violet-300/70 leading-relaxed">
              This is a restricted access portal. All login attempts are logged and monitored.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="admin-login-email" className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-widest">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  id="admin-login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/50 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="admin-login-password" className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-widest">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-black/50 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm text-white bg-violet-700 hover:bg-violet-600 border border-violet-600/50 shadow-lg shadow-violet-900/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>

        {/* Footer — Minimal, no signup links */}
        <p className="mt-6 text-center text-[11px] text-slate-700">
          VITO Platform Administration · Restricted Access
        </p>
      </div>
    </main>
  );
}
