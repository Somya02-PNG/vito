'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ThumbsUp,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Navigation,
} from 'lucide-react';

export default function DriverPerformancePage() {
  const { user } = useAuth();

  const metrics = [
    { label: 'Overall Rating', value: '4.8 ★', subtext: 'Based on 180 reviews', color: 'text-amber-500', icon: Star },
    { label: 'Acceptance Rate', value: '91%', subtext: 'Top 10% in Lucknow-Kanpur region', color: 'text-[#00A99D]', icon: CheckCircle2 },
    { label: 'Cancellation Rate', value: '4%', subtext: 'Excellent (Under 5% threshold)', color: 'text-emerald-600', icon: XCircle },
    { label: 'Completed Trips', value: '142', subtext: '100% safely completed', color: 'text-blue-500', icon: Navigation },
    { label: 'Total Online Hours', value: '86h', subtext: 'Active duty commitment', color: 'text-purple-500', icon: Clock },
    { label: '5-Star Compliments', value: '24', subtext: 'Received from passengers', color: 'text-rose-500', icon: Heart },
  ];

  const badges = [
    { title: 'Smooth Navigator', count: 18, desc: 'Flawless expressway navigation and route choices' },
    { title: 'Super Punctual', count: 14, desc: 'Arrived at pickup before schedule' },
    { title: 'Courteous & Polite', count: 12, desc: 'Highly rated for passenger comfort and discretion' },
    { title: 'Expert Night Driver', count: 9, desc: 'Trusted for outstation return journeys at night' },
  ];

  return (
    <ProtectedRoute allowedRoles={['driver', 'partner']}>
      <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
        {/* Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase text-[#00C2B3] bg-[#00C2B3]/10 px-2.5 py-0.5 rounded-full">
              Driver Quality & Recognition
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">Performance & Ratings</h1>
            <p className="text-xs text-slate-400">
              Track your service quality, customer feedback, acceptance metrics, and tiered benefits.
            </p>
          </div>

          {/* Tier Badge */}
          <div className="p-4 rounded-2xl bg-[#10243A] border border-[#00C2B3]/40 text-center min-w-[180px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00C2B3] block">
              CURRENT TIER
            </span>
            <span className="text-xl font-black text-white flex items-center justify-center gap-1.5 mt-0.5">
              <Award className="w-5 h-5 text-amber-400" /> Gold Chauffeur
            </span>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#00C2B3] h-full" style={{ width: '68%' }} />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">342 / 500 Pts to Platinum</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8995A5] font-bold">{m.label}</span>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                <p className="text-[11px] text-[#526174]">{m.subtext}</p>
              </div>
            );
          })}
        </div>

        {/* Customer Compliments Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-[#0B1728] dark:text-white">Customer Compliment Badges</h3>
            <p className="text-xs text-[#526174]">Badges awarded by passengers upon trip completion.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.map((b, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center font-black text-sm shrink-0">
                  +{b.count}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#0B1728] dark:text-white">{b.title}</h4>
                  <p className="text-[11px] text-[#8995A5]">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
