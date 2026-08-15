'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  BarChart3,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { SkeletonStatGrid } from '@/components/ui/SkeletonCard';
import ErrorState from '@/components/ui/ErrorState';

interface AnalyticsData {
  totalUsers?: number;
  totalDrivers?: number;
  totalRides?: number;
  totalRevenue?: number;
  ridesGrowth?: number;
  revenueGrowth?: number;
  usersGrowth?: number;
  dailyRides?: { date: string; count: number }[];
  dailyRevenue?: { date: string; amount: number }[];
}

function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ stats: AnalyticsData }>(`/api/admin/analytics?period=${period}`);
      setData(res.data?.stats || {});
    } catch {
      try {
        const res2 = await fetchAPI<{ stats: any }>('/api/admin/stats');
        const s = res2.data?.stats;
        if (s) {
          setData({
            totalUsers: s.users?.totalUsers,
            totalDrivers: s.users?.totalDrivers,
            totalRides: s.rides?.totalRides,
            totalRevenue: s.payments?.totalRevenue,
          });
        }
      } catch (err: any) {
        setError(err?.message || 'Could not load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [period]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-violet-500 to-violet-500/50" />
            <h1 className="text-2xl font-black text-white tracking-tight">Analytics</h1>
          </div>
          <p className="text-sm text-slate-400 pl-4">Platform performance metrics and growth trends</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#0B0F1C] border border-white/[0.06] rounded-xl">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonStatGrid count={4} columns={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAnalytics} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: data?.totalUsers ?? 0, icon: Users, color: '#8B5CF6', growth: data?.usersGrowth },
              { label: 'Active Drivers', value: data?.totalDrivers ?? 0, icon: Car, color: '#06B6D4', growth: null },
              { label: 'Total Rides', value: data?.totalRides ?? 0, icon: Activity, color: '#10B981', growth: data?.ridesGrowth },
              { label: 'Total Revenue', value: data?.totalRevenue ? `₹${data.totalRevenue.toLocaleString('en-IN')}` : '₹0', icon: DollarSign, color: '#F59E0B', growth: data?.revenueGrowth },
            ].map((s) => {
              const Icon = s.icon;
              const isPositive = s.growth && s.growth > 0;
              return (
                <div key={s.label} className="p-5 rounded-2xl bg-[#0B0F1C] border border-violet-500/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    {s.growth !== null && s.growth !== undefined && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(s.growth).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts placeholder — real data needed */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-[#0B0F1C] border border-violet-500/15 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Rides Over Time
              </h3>
              {data?.dailyRides && data.dailyRides.length > 0 ? (
                <div className="flex items-end gap-1 h-24">
                  {data.dailyRides.slice(-14).map((d, i) => {
                    const max = Math.max(...data.dailyRides!.map((x) => x.count), 1);
                    const h = (d.count / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end h-full">
                        <div
                          className="rounded-t transition-all"
                          style={{ height: `${h}%`, background: '#8B5CF640', border: '1px solid #8B5CF620' }}
                          title={`${d.date}: ${d.count} rides`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <p className="text-xs text-slate-500">No ride data available for this period</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[#0B0F1C] border border-violet-500/15 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-violet-400" />
                Revenue Over Time
              </h3>
              {data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
                <div className="flex items-end gap-1 h-24">
                  {data.dailyRevenue.slice(-14).map((d, i) => {
                    const max = Math.max(...data.dailyRevenue!.map((x) => x.amount), 1);
                    const h = (d.amount / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end h-full">
                        <div
                          className="rounded-t transition-all"
                          style={{ height: `${h}%`, background: '#F59E0B30', border: '1px solid #F59E0B20' }}
                          title={`${d.date}: ₹${d.amount}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <p className="text-xs text-slate-500">No revenue data available for this period</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
