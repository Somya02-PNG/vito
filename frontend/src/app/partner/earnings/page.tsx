'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  CarFront,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { SkeletonStatGrid, SkeletonList } from '@/components/ui/SkeletonCard';

interface EarningsSummary {
  grossVolume: number;
  platformFee: number;
  taxes: number;
  netEarnings: number;
  walletBalance: number;
}

interface PayoutRecord {
  bookingId: string;
  vehicleName: string;
  registrationNumber: string;
  completedAt: string;
  grossAmount: number;
  platformFee: number;
  taxes: number;
  netPayout: number;
  status: string;
}

export default function PartnerEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>({
    grossVolume: 0,
    platformFee: 0,
    taxes: 0,
    netEarnings: 0,
    walletBalance: 0,
  });
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{
        summary: EarningsSummary;
        payoutRecords: PayoutRecord[];
      }>('/api/partner/earnings');

      if (res.data) {
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.payoutRecords) setPayouts(res.data.payoutRecords);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-2 sm:px-4 py-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/partner/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Earnings & Payout Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Transparent revenue settlement with net payout breakdown (Gross − 15% Platform Fee − 5% GST).
          </p>
        </div>

        <button
          onClick={fetchEarningsData}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── FINANCIAL METRICS (4 CARDS) ── */}
      {loading ? (
        <SkeletonStatGrid count={4} columns={4} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Booking Value</span>
            <p className="text-2xl font-black text-white">₹{summary.grossVolume.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500">Customer Invoiced</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Operations Fee</span>
            <p className="text-2xl font-black text-slate-300">₹{summary.platformFee.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500">15% Standard Fee</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GST & Statutory Taxes</span>
            <p className="text-2xl font-black text-slate-300">₹{summary.taxes.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500">5% Govt Tax</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-950/40 to-[#0B101E] border border-teal-500/30 space-y-1">
            <span className="text-[10px] font-black text-teal-300 uppercase tracking-wider">Net Partner Payout</span>
            <p className="text-2xl font-black text-teal-300">₹{summary.netEarnings.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-teal-400/80">80% Net Share</p>
          </div>
        </div>
      )}

      {/* ── PAYOUT HISTORY TABLE ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Settlement Transactions</h2>
          <p className="text-xs text-slate-400">Completed rental bookings and automated bank payouts</p>
        </div>

        {loading ? (
          <SkeletonList count={4} />
        ) : payouts.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#0B101E] border border-white/10 text-center space-y-3">
            <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Payout Records Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Payout statements are automatically generated upon successful rental return and deposit settlement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B101E]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070A12] text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Gross Value</th>
                  <th className="px-4 py-3">Platform Fee (15%)</th>
                  <th className="px-4 py-3">Tax (5%)</th>
                  <th className="px-4 py-3">Net Payout</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {payouts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-teal-400">{p.bookingId}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      <span>{p.vehicleName}</span>
                      <span className="block text-[10px] text-slate-500">{p.registrationNumber}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white">₹{p.grossAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-400">₹{p.platformFee.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-400">₹{p.taxes.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-black text-emerald-400">₹{p.netPayout.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
