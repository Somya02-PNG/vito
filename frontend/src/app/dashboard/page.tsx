'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Car,
  Key,
  UserCheck,
  Shield,
  MapPin,
  ArrowRight,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Navigation,
  CalendarRange,
  Route,
  Users,
} from 'lucide-react';

// ─── Module Card Data ────────────────────────────────────────────────────────
const modules = [
  {
    id: 'ai-planner',
    title: 'AI Trip Planner',
    description: 'Smart itineraries powered by AI. Plan routes, budgets, and group trips effortlessly.',
    href: '/dashboard/planner',
    icon: Sparkles,
    gradient: 'from-violet-600 to-indigo-600',
    iconBg: 'bg-violet-500/10',
    iconBorder: 'border-violet-500/20',
    iconColor: 'text-violet-400',
    accentGlow: 'rgba(139, 92, 246, 0.15)',
    tag: 'AI Powered',
  },
  {
    id: 'cab',
    title: 'Book a Cab',
    description: 'Instant ride booking with live tracking, OTP verification, and upfront fare estimates.',
    href: '/dashboard/cab',
    icon: Car,
    gradient: 'from-primary-500 to-primary-700',
    iconBg: 'bg-primary-500/10',
    iconBorder: 'border-primary-500/20',
    iconColor: 'text-primary-300',
    accentGlow: 'rgba(11, 61, 145, 0.2)',
    tag: 'Popular',
  },
  {
    id: 'rental',
    title: 'Vehicle Rental',
    description: 'Self-drive cars, bikes, and SUVs. Daily rates, doorstep delivery, and flexible durations.',
    href: '/dashboard/rental',
    icon: Key,
    gradient: 'from-emerald-600 to-teal-600',
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    accentGlow: 'rgba(16, 185, 129, 0.15)',
    tag: null,
  },
  {
    id: 'driver-hire',
    title: 'Hire a Driver',
    description: 'Verified professional drivers on hourly hire. Perfect for long trips and events.',
    href: '/dashboard/hire',
    icon: UserCheck,
    gradient: 'from-accent-500 to-amber-600',
    iconBg: 'bg-accent-500/10',
    iconBorder: 'border-accent-500/20',
    iconColor: 'text-accent-400',
    accentGlow: 'rgba(232, 93, 4, 0.15)',
    tag: null,
  },
  {
    id: 'safety',
    title: 'Safety Hub',
    description: 'Emergency contacts, live ride sharing, SOS alerts, and trusted contact management.',
    href: '/dashboard/safety',
    icon: Shield,
    gradient: 'from-rose-600 to-pink-600',
    iconBg: 'bg-rose-500/10',
    iconBorder: 'border-rose-500/20',
    iconColor: 'text-rose-400',
    accentGlow: 'rgba(244, 63, 94, 0.15)',
    tag: null,
  },
];

// ─── Quick Stats ─────────────────────────────────────────────────────────────
const quickStats = [
  { icon: Route,          label: 'Total Rides',     value: '—', color: 'text-primary-300' },
  { icon: CalendarRange,  label: 'Active Rentals',  value: '—', color: 'text-emerald-400' },
  { icon: Users,          label: 'Trips Planned',   value: '—', color: 'text-violet-400' },
  { icon: Star,           label: 'Your Rating',     value: '—', color: 'text-accent-400' },
];

export default function CustomerHomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative overflow-hidden">
      {/* ── Background Ambient Effects ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-hero-glow pointer-events-none opacity-80" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-60 -left-40 w-[400px] h-[400px] bg-accent-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ════════════════════════════════════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════════════════════════════════ */}
        <section className="pt-8 pb-6 sm:pt-12 sm:pb-10">
          {/* Greeting */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[11px] font-semibold text-primary-300 uppercase tracking-wider">
                <Zap className="w-3 h-3" />
                AI Mobility
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="w-3 h-3" />
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              {greeting()},{' '}
              <span className="text-gradient">{user?.name?.split(' ')[0] || 'there'}</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-lg">
              Where would you like to go today? Search for destinations, book rides, or plan your next trip.
            </p>
          </div>

          {/* Hero Search Bar */}
          <div className="max-w-2xl">
            <div className="relative group">
              {/* Outer glow ring */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 via-primary-400/10 to-accent-500/20 rounded-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

              <div className="relative flex items-center bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-white/[0.08] group-hover:border-primary-500/30 group-focus-within:border-primary-500/40 transition-all duration-300 shadow-lg shadow-black/20">
                <div className="flex items-center gap-3 pl-5 pr-2 flex-1">
                  <Search className="w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search places, routes, or services..."
                    className="w-full py-4 bg-transparent text-white text-sm sm:text-base placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div className="pr-2.5">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-primary-500/25 active:scale-95">
                    <Navigation className="w-4 h-4" />
                    <span className="hidden sm:inline">Explore</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick search pills */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium">Popular:</span>
              {['Airport', 'Railway Station', 'City Center', 'Weekend Trip'].map((place) => (
                <button
                  key={place}
                  onClick={() => setSearchQuery(place)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200"
                >
                  <MapPin className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {place}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            QUICK STATS BAR
        ════════════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-6 sm:pb-10">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 p-4 rounded-xl bg-[#111827]/60 border border-white/[0.05] hover:border-white/[0.1] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            MODULE CARDS GRID
        ════════════════════════════════════════════════════════════════════ */}
        <section className="pb-10 sm:pb-16">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Your Services</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Quick access to all VITO mobility modules</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All Services</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.id}
                  href={mod.href}
                  className="module-card group block p-5 sm:p-6 rounded-2xl bg-[#111827]/60 border border-white/[0.06] backdrop-blur-sm"
                  style={{
                    // @ts-ignore - CSS custom property for per-card glow
                    '--card-glow': mod.accentGlow,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${mod.iconBg} ${mod.iconBorder} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${mod.iconColor}`} />
                    </div>

                    {mod.tag && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        mod.tag === 'AI Powered'
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          : 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                      }`}>
                        {mod.tag}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 group-hover:text-primary-200 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                    {mod.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-400 group-hover:text-primary-300 transition-colors">
                    Open
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </Link>
              );
            })}

            {/* CTA card — Discover More */}
            <div className="module-card p-5 sm:p-6 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-white/[0.06] flex items-center justify-center mb-3">
                <Zap className="w-7 h-7 text-slate-500 animate-glow-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300 mb-1">More Coming Soon</h3>
              <p className="text-xs text-slate-500 max-w-[200px]">
                Carpooling, EV charging, and more modules are on the way.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
