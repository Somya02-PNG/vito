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
  Loader2,
  AlertCircle,
  User,
  Phone,
  CheckCircle2,
  Car,
  Key,
  MapPin,
  FileText,
  Building,
  ArrowRight,
  ArrowLeft,
  Users,
} from 'lucide-react';

type PartnerType = 'driver' | 'rental_partner';
type Step = 'CHOOSE' | 'DETAILS';

export default function PartnerRegisterPage() {
  const { signup, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Step control
  const [step, setStep] = useState<Step>('CHOOSE');
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);

  // Shared fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Driver-specific
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  // Rental Partner-specific
  const [businessName, setBusinessName] = useState('');
  const [fleetCount, setFleetCount] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getDashboardPath(user));
    }
  }, [user, authLoading, router]);

  const handleChooseType = (type: PartnerType) => {
    setPartnerType(type);
    setStep('DETAILS');
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/^\+?[1-9]\d{6,14}$/.test(phone)) errs.phone = 'Enter a valid phone number (e.g. +919876543210)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!city.trim()) errs.city = 'Please enter your city';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    if (partnerType === 'driver') {
      if (!licenseNumber.trim()) errs.licenseNumber = 'License number is required';
      if (!experience || isNaN(Number(experience)) || Number(experience) < 0) errs.experience = 'Enter valid years of experience';
    }

    if (partnerType === 'rental_partner') {
      if (!businessName.trim()) errs.businessName = 'Business/owner name is required';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate() || !partnerType) return;

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone,
        email,
        password,
        role: 'partner' as const,
        partnerType,
        city,
      };

      if (partnerType === 'driver') {
        payload.licenseNumber = licenseNumber.trim();
        payload.experience = Number(experience);
        payload.hourlyRate = Number(hourlyRate) || 100;
      }

      if (partnerType === 'rental_partner') {
        payload.businessName = businessName.trim();
        payload.fleetCount = Number(fleetCount) || 0;
      }

      await signup(payload);
      router.replace('/partner/pending');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  // ─── Step 1: Choose Partner Type ─────────────────────────────────────────────
  if (step === 'CHOOSE') {
    return (
      <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-cyan-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-600/6 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 transition-shadow">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                </div>
              </div>
              <span className="text-2xl font-black tracking-tight text-white">VITO</span>
            </Link>
            <p className="mt-3 text-sm text-slate-400">Partner Registration</p>
          </div>

          <div className="rounded-2xl p-8" style={{ background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(8,145,178,0.2)', boxShadow: '0 0 30px -5px rgba(8,145,178,0.12)' }}>
            <h1 className="text-xl font-bold text-white mb-2">What do you want to do?</h1>
            <p className="text-sm text-slate-400 mb-8">Choose how you'd like to partner with VITO</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Become a Driver */}
              <button
                onClick={() => handleChooseType('driver')}
                className="group p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all text-left space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Become a Driver</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Accept ride requests, hire bookings, and earn on your schedule</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400">
                  Get started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* List My Vehicles */}
              <button
                onClick={() => handleChooseType('rental_partner')}
                className="group p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all text-left space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Key className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">List My Vehicles</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Add your fleet to VITO's rental marketplace and earn from rentals</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  Get started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Info Note */}
            <div className="mt-6 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
              <p className="text-xs text-amber-300/80">
                <strong>Note:</strong> All partner applications are reviewed by the VITO team. You'll receive approval within 24-48 hours after verification.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already a partner?{' '}
            <Link href="/partner/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // ─── Step 2: Fill Details ─────────────────────────────────────────────────────
  const isDriver = partnerType === 'driver';

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-cyan-600/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 transition-shadow">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">VITO</span>
          </Link>
          <p className="mt-3 text-sm text-slate-400">
            {isDriver ? 'Driver Partner' : 'Rental Partner'} Registration
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(8,145,178,0.2)', boxShadow: '0 0 30px -5px rgba(8,145,178,0.12)' }}>
          {/* Back button + Title */}
          <button
            onClick={() => { setStep('CHOOSE'); setError(''); setFieldErrors({}); }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change partner type
          </button>

          {/* Type badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-4 ${isDriver ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {isDriver ? <Car className="w-3 h-3" /> : <Key className="w-3 h-3" />}
            {isDriver ? 'Driver Partner Application' : 'Rental Partner Application'}
          </div>

          <h1 className="text-xl font-bold text-white mb-1">Your Details</h1>
          <p className="text-sm text-slate-400 mb-6">Fill in your information to submit your partner application</p>

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
              <label htmlFor="partner-reg-name" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="partner-reg-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${fieldErrors.name ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="partner-reg-email" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="partner-reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${fieldErrors.email ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="partner-reg-phone" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="partner-reg-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${fieldErrors.phone ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>}
            </div>

            {/* City */}
            <div>
              <label htmlFor="partner-reg-city" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">City</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="partner-reg-city" type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. New Delhi"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${fieldErrors.city ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.city && <p className="mt-1 text-xs text-red-400">{fieldErrors.city}</p>}
            </div>

            {/* Driver-specific fields */}
            {isDriver && (
              <>
                <div>
                  <label htmlFor="partner-reg-license" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Driving License Number</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input id="partner-reg-license" type="text" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. DL-01-2020-12345"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${fieldErrors.licenseNumber ? 'border-red-500/60' : 'border-slate-700/80'}`}
                    />
                  </div>
                  {fieldErrors.licenseNumber && <p className="mt-1 text-xs text-red-400">{fieldErrors.licenseNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="partner-reg-exp" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Experience (Years)</label>
                    <input id="partner-reg-exp" type="number" min="0" required value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5"
                      className={`w-full px-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${fieldErrors.experience ? 'border-red-500/60' : 'border-slate-700/80'}`}
                    />
                    {fieldErrors.experience && <p className="mt-1 text-xs text-red-400">{fieldErrors.experience}</p>}
                  </div>
                  <div>
                    <label htmlFor="partner-reg-rate" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Hourly Rate (₹)</label>
                    <input id="partner-reg-rate" type="number" min="50" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g. 150"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Rental Partner-specific fields */}
            {!isDriver && (
              <>
                <div>
                  <label htmlFor="partner-reg-business" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Business / Owner Name</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input id="partner-reg-business" type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Sharma Rentals"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${fieldErrors.businessName ? 'border-red-500/60' : 'border-slate-700/80'}`}
                    />
                  </div>
                  {fieldErrors.businessName && <p className="mt-1 text-xs text-red-400">{fieldErrors.businessName}</p>}
                </div>
                <div>
                  <label htmlFor="partner-reg-fleet" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Fleet Size (Vehicles you own)</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input id="partner-reg-fleet" type="number" min="0" value={fleetCount} onChange={(e) => setFleetCount(e.target.value)} placeholder="e.g. 3"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label htmlFor="partner-reg-pass" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="partner-reg-pass" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${fieldErrors.password ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>}
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className={`flex items-center gap-1 ${password.length >= 6 ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 className="w-3 h-3" /> 6+ chars</span>
                  <span className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 className="w-3 h-3" /> Uppercase</span>
                  <span className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}><CheckCircle2 className="w-3 h-3" /> Number</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="partner-reg-confirm" className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="partner-reg-confirm" type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${fieldErrors.confirmPassword ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-400">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg ${isDriver ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-cyan-600/20' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Submitting Application...' : 'Submit Partner Application'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already a partner?{' '}
          <Link href="/partner/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
            Sign in →
          </Link>
        </p>
      </div>
    </main>
  );
}
