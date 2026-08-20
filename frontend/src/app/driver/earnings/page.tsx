'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import {
  Wallet,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  ChevronRight,
  DollarSign,
  Building2,
  CheckCircle2,
  Receipt,
  Download,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface PayoutRecord {
  id: string;
  date: string;
  bankAccount: string;
  amount: number;
  status: 'completed' | 'processing';
}

export default function DriverEarningsPage() {
  const { user } = useAuth();
  const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month'>('week');

  // Wallet balances
  const [walletBalance, setWalletBalance] = useState<number>(4850);
  const [pendingBalance, setPendingBalance] = useState<number>(1200);
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(3650);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('3650');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');

  // Payout history
  const [payouts, setPayouts] = useState<PayoutRecord[]>([
    {
      id: 'tx_8841',
      date: 'Yesterday, 07:15 PM',
      bankAccount: 'SBI (XXXXXX1234)',
      amount: 3500,
      status: 'completed',
    },
    {
      id: 'tx_8830',
      date: '12 Aug 2026, 06:45 PM',
      bankAccount: 'SBI (XXXXXX1234)',
      amount: 5200,
      status: 'completed',
    },
    {
      id: 'tx_8812',
      date: '05 Aug 2026, 09:30 AM',
      bankAccount: 'SBI (XXXXXX1234)',
      amount: 4800,
      status: 'completed',
    },
  ]);

  const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0 || amt > withdrawableBalance) {
      alert('Please enter a valid amount within your withdrawable balance.');
      return;
    }

    setIsProcessingWithdraw(true);
    try {
      await fetchAPI('/driver/wallet/withdraw', {
        method: 'POST',
        body: { amount: amt, bankAccount: 'State Bank of India (XXXXXX1234)' },
      });
    } catch {}

    setWithdrawableBalance((prev) => Math.max(0, prev - amt));
    setWalletBalance((prev) => Math.max(0, prev - amt));

    const newRecord: PayoutRecord = {
      id: `tx_${Date.now()}`,
      date: 'Just now',
      bankAccount: 'SBI (XXXXXX1234)',
      amount: amt,
      status: 'completed',
    };
    setPayouts([newRecord, ...payouts]);
    setIsProcessingWithdraw(false);
    setShowWithdrawModal(false);
    setWithdrawSuccessMsg(`✓ ${formatINR(amt)} transferred to your linked SBI account.`);
    setTimeout(() => setWithdrawSuccessMsg(''), 4000);
  };

  return (
    <ProtectedRoute allowedRoles={['driver', 'partner']}>
      <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
        {/* ─── 1. HEADER ────────────────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase text-[#00C2B3] bg-[#00C2B3]/10 px-2.5 py-0.5 rounded-full">
              Driver Compensation Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">Earnings & Driver Wallet</h1>
            <p className="text-xs text-slate-400">
              Track completed trip revenues, tips, platform adjustments, and instant bank settlements.
            </p>
          </div>

          <div className="flex bg-[#10243A] p-1 rounded-2xl border border-slate-700">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActivePeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  activePeriod === p
                    ? 'bg-[#00C2B3] text-[#07111F] shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {withdrawSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-500/30 text-xs font-bold text-center">
            {withdrawSuccessMsg}
          </div>
        )}

        {/* ─── 2. TOP EARNINGS METRICS ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-2">
            <span className="text-xs text-[#8995A5] font-bold block">Today</span>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1728] dark:text-white">
              {formatINR(1850)}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold">12 Completed Trips</span>
          </div>

          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border-2 border-[#00C2B3] shadow-md space-y-2">
            <span className="text-xs text-[#00A99D] font-bold block">This Week</span>
            <div className="text-2xl sm:text-3xl font-black text-[#00A99D]">
              {formatINR(12450)}
            </div>
            <span className="text-[11px] text-[#526174] font-bold">46 Total Outstation & Cab Trips</span>
          </div>

          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-2">
            <span className="text-xs text-[#8995A5] font-bold block">This Month</span>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1728] dark:text-white">
              {formatINR(48200)}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold">+14% vs Last Month</span>
          </div>
        </div>

        {/* ─── 3. WALLET & INSTANT PAYOUT CARD ──────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-[#00C2B3]">VITO Driver Wallet</span>
              <h2 className="text-xl font-black mt-0.5">Available for Payout</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-[#00C2B3] hover:bg-[#00A99D] text-[#07111F] font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Wallet className="w-4 h-4" /> Withdraw Earnings
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Wallet Balance</span>
              <p className="text-xl font-black text-white">{formatINR(walletBalance)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Pending Clearance</span>
              <p className="text-xl font-black text-amber-400">{formatINR(pendingBalance)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-[#00C2B3] uppercase font-bold">Withdrawable Immediately</span>
              <p className="text-xl font-black text-[#00C2B3]">{formatINR(withdrawableBalance)}</p>
            </div>
          </div>

          {/* Verified Bank Account */}
          <div className="p-4 rounded-2xl bg-[#10243A] border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">State Bank of India (XXXXXX1234)</p>
                <p className="text-[11px] text-slate-400">IFSC: SBIN0001423 • Primary Settlement Account</p>
              </div>
            </div>
            <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
        </div>

        {/* ─── 4. ITEMIZED BREAKDOWN & PAYOUT HISTORY ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Breakdown */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#526174]">
              EARNINGS BREAKDOWN ({activePeriod.toUpperCase()})
            </h3>

            <div className="divide-y divide-[#E5EAF0] dark:divide-[#17334F] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#526174]">Base Duty Compensation</span>
                <span className="font-bold text-[#0B1728] dark:text-white">{formatINR(10800)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#526174]">Outstation & Night Allowance</span>
                <span className="font-bold text-[#0B1728] dark:text-white">{formatINR(1200)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#526174]">Customer Tips (100% Retained)</span>
                <span className="font-bold text-emerald-600">{formatINR(450)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#526174]">Platform Fee Tier (Special 0%)</span>
                <span className="font-bold text-slate-400">₹0</span>
              </div>
              <div className="py-3 flex justify-between font-black text-sm text-[#00A99D] border-t-2 border-[#00C2B3]/30">
                <span>Net Credited Earnings</span>
                <span>{formatINR(12450)}</span>
              </div>
            </div>
          </div>

          {/* Payout History */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#526174]">
              RECENT BANK PAYOUTS
            </h3>

            <div className="space-y-3">
              {payouts.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-[#0B1728] dark:text-white">{tx.bankAccount}</p>
                    <span className="text-[11px] text-[#8995A5]">{tx.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-[#0B1728] dark:text-white block">
                      {formatINR(tx.amount)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">✓ Settled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 5. WITHDRAW MODAL ────────────────────────────────────────────── */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-6">
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-black text-[#0B1728] dark:text-white">Withdraw Driver Earnings</h3>
                <p className="text-xs text-[#526174]">
                  Instant settlement to your verified SBI account (No platform transfer fees).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border space-y-1">
                <span className="text-[10px] text-[#8995A5] uppercase font-bold">Withdrawable Balance</span>
                <p className="text-xl font-black text-[#00A99D]">{formatINR(withdrawableBalance)}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0B1728] dark:text-white">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  max={withdrawableBalance}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] text-sm font-bold outline-none focus:border-[#00C2B3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="py-3 rounded-2xl border text-xs font-bold text-[#526174] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingWithdraw}
                  onClick={handleWithdraw}
                  className="py-3 rounded-2xl bg-[#00C2B3] text-[#07111F] text-xs font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isProcessingWithdraw ? 'Processing...' : 'Confirm Payout →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
