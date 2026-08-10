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
  UserPlus,
  Loader2,
  AlertCircle,
  User,
  Phone,
  CheckCircle2,
  Shield,
} from 'lucide-react';

export default function CustomerRegisterPage() {
  const { signup, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getDashboardPath(user));
    }
  }, [user, authLoading, router]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/^\+?[1-9]\d{6,14}$/.test(phone)) errs.phone = 'Enter a valid phone number (e.g. +919876543210)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!termsAccepted) errs.terms = 'You must accept the terms to continue';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signup({ name: name.trim(), phone, email, password, role: 'customer' });
      router.replace('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  if (authLoading) return null;

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400 fill-blue-400/20" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">VITO</span>
          </Link>
          <p className="mt-3 text-sm text-slate-400">Create your customer account</p>
        </div>

        {/* Card */}
        <div className="glass-panel-glow rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Get started</h1>
            <p className="text-sm text-slate-400 mt-1">Join VITO and experience smart mobility</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="cust-reg-name" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="cust-reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${fieldErrors.name ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="cust-reg-phone" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="cust-reg-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${fieldErrors.phone ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="cust-reg-email" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="cust-reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${fieldErrors.email ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="cust-reg-password" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="cust-reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${fieldErrors.password ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>}
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className={`flex items-center gap-1 ${pwStrength.length ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 className="w-3 h-3" /> 6+ chars</span>
                  <span className={`flex items-center gap-1 ${pwStrength.upper ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 className="w-3 h-3" /> Uppercase</span>
                  <span className={`flex items-center gap-1 ${pwStrength.number ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 className="w-3 h-3" /> Number</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="cust-reg-confirm" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="cust-reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${fieldErrors.confirmPassword ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-400">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className={`flex items-start gap-3 cursor-pointer group ${fieldErrors.terms ? 'text-red-400' : ''}`}>
                <div
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${termsAccepted ? 'bg-blue-600 border-blue-600' : 'border-slate-600 group-hover:border-slate-400'}`}
                >
                  {termsAccepted && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-slate-400">
                  I agree to the{' '}
                  <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Terms of Service</span>{' '}
                  and{' '}
                  <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Privacy Policy</span>
                </span>
              </label>
              {fieldErrors.terms && <p className="mt-1 text-xs text-red-400">{fieldErrors.terms}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Trust badges */}
          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-500" /> Secure & Encrypted</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" /> No spam</span>
          </div>
        </div>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/customer/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in →
          </Link>
        </p>
      </div>
    </main>
  );
}
