'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Wallet,
  BarChart3,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonStatGrid, SkeletonList } from '@/components/ui/SkeletonCard';

interface EarningsData {
  todayEarnings?: number;
  weeklyEarnings?: number;
  monthlyEarnings?: number;
  totalTrips?: number;
  completedToday?: number;
  averageFare?: number;
  recentPayouts?: {
    _id: string;
    amount: number;
    date: string;
    trips: number;
    status: string;
  }[];
}

type Period = 'today' | 'week' | 'month';

export default function DriverEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('week');

  const fetchEarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ stats: EarningsData }>('/api/driver/earnings');
      setData(res.data?.stats || {});
    } catch {
      try {
        // Fallback to driver stats endpoint
        const res2 = await fetchAPI<{ stats: EarningsData }>('/api/driver/stats');
        setData(res2.data?.stats || {});
      } catch (err: any) {
        setError(err?.message || 'Could not load earnings data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEarnings(); }, []);

  const periodValue = {
    today: data?.todayEarnings ?? 0,
    week: data?.weeklyEarnings ?? 0,
    month: data?.monthlyEarnings ?? 0,
  }[period];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Earnings</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Track your income, payouts, and performance metrics</p>
      </div>

      {loading ? (
        <SkeletonStatGrid count={4} columns={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEarnings} />
      ) : (
        <>
          {/* Period Selector + Hero */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-900/30 via-slate-900 to-emerald-900/20 border border-cyan-500/20 shadow-xl">
            <div className="flex items-center gap-1 p-1 bg-black/30 rounded-xl w-fit mb-5">
              {(['today', 'week', 'month'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    period === p ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  {period === 'today' ? "Today's" : period === 'week' ? 'Weekly' : 'Monthly'} Earnings
                </p>
                <p className="text-4xl font-black text-white">
                  {periodValue > 0 ? `₹${periodValue.toFixed(0)}` : '₹0'}
                </p>
                {periodValue === 0 && (
                  <p className="text-xs text-slate-500 mt-1">No earnings recorded yet for this period</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Trips Today', value: data?.completedToday ?? 0, icon: Calendar, color: '#06B6D4' },
              { label: 'Avg Fare', value: data?.averageFare ? `₹${data.averageFare.toFixed(0)}` : '₹0', icon: BarChart3, color: '#10B981' },
              { label: 'Total Trips', value: data?.totalTrips ?? 0, icon: TrendingUp, color: '#8B5CF6' },
              { label: 'Monthly', value: data?.monthlyEarnings ? `₹${data.monthlyEarnings.toFixed(0)}` : '₹0', icon: DollarSign, color: '#F59E0B' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-5 rounded-2xl bg-[#0B101E] border border-cyan-500/15 space-y-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{s.value}</p>
                    <p className="text-[11px] text-slate-400">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Payouts */}
          <div className="p-5 rounded-2xl bg-[#0B101E] border border-cyan-500/20 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              Recent Payouts
            </h3>
            {!data?.recentPayouts || data.recentPayouts.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No payouts yet"
                description="Your earnings will be automatically settled weekly to your registered bank account."
                accentColor="#06B6D4"
                size="sm"
              />
            ) : (
              <div className="space-y-2">
                {data.recentPayouts.map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{payout.trips} trips settled</p>
                        <p className="text-[10px] text-slate-500">{new Date(payout.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">+₹{payout.amount.toFixed(0)}</p>
                      <span className="text-[10px] text-emerald-400">{payout.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
