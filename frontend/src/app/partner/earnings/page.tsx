'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { DollarSign, TrendingUp, Calendar, Wallet, ArrowUpRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonStatGrid, SkeletonList } from '@/components/ui/SkeletonCard';

interface EarningsData {
  todayRevenue?: number;
  weeklyRevenue?: number;
  monthlyRevenue?: number;
  totalBookings?: number;
  pendingPayouts?: number;
  recentTransactions?: { _id: string; amount: number; date: string; description: string }[];
}

type Period = 'today' | 'week' | 'month';

export default function PartnerEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('week');

  const fetchEarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ earnings: EarningsData }>('/api/partner/earnings');
      setData(res.data?.earnings || {});
    } catch (err: any) {
      setError(err?.message || 'Could not load earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEarnings(); }, []);

  const periodValue = period === 'today' ? (data?.todayRevenue ?? 0)
    : period === 'week' ? (data?.weeklyRevenue ?? 0)
    : (data?.monthlyRevenue ?? 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Earnings & Revenue</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Fleet revenue, booking income, and payout history</p>
      </div>

      {loading ? <SkeletonStatGrid count={4} columns={4} /> : error ? (
        <ErrorState message={error} onRetry={fetchEarnings} />
      ) : (
        <>
          {/* Hero Revenue Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-900/30 via-slate-900 to-emerald-900/20 border border-teal-500/20 shadow-xl">
            <div className="flex items-center gap-1 p-1 bg-black/30 rounded-xl w-fit mb-5">
              {(['today', 'week', 'month'] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${period === p ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">Fleet Revenue</p>
            <p className="text-4xl font-black text-white">{periodValue > 0 ? `₹${periodValue.toFixed(0)}` : '₹0'}</p>
            {periodValue === 0 && <p className="text-xs text-slate-500 mt-1">No revenue recorded for this period yet</p>}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: data?.totalBookings ?? 0, icon: Calendar },
              { label: 'Monthly Revenue', value: data?.monthlyRevenue ? `₹${data.monthlyRevenue.toFixed(0)}` : '₹0', icon: TrendingUp },
              { label: 'Pending Payouts', value: data?.pendingPayouts ? `₹${data.pendingPayouts.toFixed(0)}` : '₹0', icon: Wallet },
              { label: 'Weekly Revenue', value: data?.weeklyRevenue ? `₹${data.weeklyRevenue.toFixed(0)}` : '₹0', icon: DollarSign },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/15 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{s.value}</p>
                    <p className="text-[11px] text-slate-400">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transactions */}
          <div className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-4">
            <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
            {!data?.recentTransactions || data.recentTransactions.length === 0 ? (
              <EmptyState icon={DollarSign} title="No transactions yet" description="Booking revenue will appear here after customers complete their rentals." accentColor="#14B8A6" size="sm" />
            ) : (
              <div className="space-y-2">
                {data.recentTransactions.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{tx.description}</p>
                        <p className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-teal-300">+₹{tx.amount.toFixed(0)}</p>
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
