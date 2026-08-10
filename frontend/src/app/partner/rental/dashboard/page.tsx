'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import {
  Key,
  Car,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Wallet,
  LogOut,
  Zap,
  Plus,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

function RentalDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [rentalProfile, setRentalProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (user.status === 'pending') {
      router.replace('/partner/pending');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetchAPI<{ partnerProfile: any }>('/api/partner/profile');
        setRentalProfile(res.data?.partnerProfile ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/partner/login');
  };

  return (
    <div className="min-h-screen bg-[#07090E] relative overflow-hidden pb-12">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[400px] bg-gradient-radial from-emerald-600/8 via-transparent to-transparent pointer-events-none" />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07090E]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-[#0A0E18] rounded-[11px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tight text-white">VITO</span>
              <span className="ml-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Rental Partner</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-medium transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-8">
        {/* Welcome */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <Key className="w-3 h-3" />
            Rental Partner Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
          {rentalProfile?.businessName && (
            <p className="text-sm text-slate-400 mt-1">{rentalProfile.businessName} · {rentalProfile.city || 'City not set'}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Fleet Size', value: rentalProfile?.fleetCount ?? '—', icon: Car, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
            { label: 'Active Rentals', value: '—', icon: RefreshCw, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Total Earnings', value: '—', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { label: 'Wallet Balance', value: `₹${(rentalProfile?.walletBalance ?? 0).toLocaleString('en-IN')}`, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-panel p-4 rounded-2xl">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} border flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
                <p className="text-xl font-extrabold text-white">{stat.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Verification Status */}
        {rentalProfile && (
          <div className={`p-4 rounded-2xl border mb-6 flex items-center gap-3 ${
            rentalProfile.verificationStatus === 'verified'
              ? 'bg-emerald-500/8 border-emerald-500/20'
              : 'bg-amber-500/8 border-amber-500/20'
          }`}>
            {rentalProfile.verificationStatus === 'verified' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            )}
            <div>
              <p className={`text-sm font-bold ${rentalProfile.verificationStatus === 'verified' ? 'text-emerald-300' : 'text-amber-300'}`}>
                {rentalProfile.verificationStatus === 'verified' ? 'Account Verified' : 'Pending Verification'}
              </p>
              <p className="text-xs text-slate-400">
                {rentalProfile.verificationStatus === 'verified'
                  ? 'You can now list vehicles and accept rental bookings.'
                  : 'Your account is under review. You\'ll be notified once approved.'}
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Add Vehicle', description: 'List a new vehicle to your rental fleet', icon: Plus, color: 'text-emerald-400', border: 'border-emerald-500/20', href: '#', comingSoon: true },
            { title: 'Manage Fleet', description: 'View and update your vehicle listings', icon: Car, color: 'text-cyan-400', border: 'border-cyan-500/20', href: '#', comingSoon: true },
            { title: 'Rental Bookings', description: 'View incoming and active rental requests', icon: Package, color: 'text-violet-400', border: 'border-violet-500/20', href: '#', comingSoon: true },
            { title: 'Pricing Manager', description: 'Set rates, discounts, and seasonal pricing', icon: TrendingUp, color: 'text-amber-400', border: 'border-amber-500/20', href: '#', comingSoon: true },
            { title: 'Earnings & Payouts', description: 'Track revenue and withdraw funds', icon: Wallet, color: 'text-emerald-400', border: 'border-emerald-500/20', href: '#', comingSoon: true },
            { title: 'Support', description: 'Contact VITO partner support team', icon: AlertCircle, color: 'text-slate-400', border: 'border-white/[0.06]', href: '#', comingSoon: false },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={`relative p-5 rounded-2xl bg-[#111827]/60 border ${item.border} hover:border-white/[0.15] transition-all group cursor-pointer`}>
                {item.comingSoon && (
                  <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 border border-white/[0.06] uppercase tracking-wider">
                    Soon
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PartnerRentalDashboardPage() {
  return (
    <ProtectedRoute
      allowedRoles={['partner']}
      allowedPartnerTypes={['rental_partner']}
      redirectTo="/partner/login"
    >
      <RentalDashboardContent />
    </ProtectedRoute>
  );
}
