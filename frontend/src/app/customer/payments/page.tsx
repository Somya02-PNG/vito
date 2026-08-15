'use client';

import React from 'react';
import { CreditCard, ArrowUpRight, ArrowDownLeft, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';

export default function CustomerPaymentsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Payments & Wallet</h1>
          <p className="text-sm text-slate-400 mt-1">Manage payment methods, Vito Cash wallet, and view transaction history</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all">
          <Plus className="w-4 h-4" /> Add Payment Method
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Vito Cash Wallet */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-slate-900/80 border border-blue-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <CreditCard className="w-32 h-32 text-blue-400" />
          </div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Vito Wallet Balance</p>
          <h2 className="text-3xl font-black text-white mt-2">₹1,450.00</h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Instant checkout enabled
          </p>
          <div className="mt-6 flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold border border-blue-500/30">
              Add Funds
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold">
              Auto-Top Up
            </button>
          </div>
        </div>

        {/* Primary Payment Card */}
        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Primary Card</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-gradient-to-tr from-slate-700 to-slate-500 flex items-center justify-center text-[10px] font-black text-white">
              VISA
            </div>
            <div>
              <p className="text-sm font-bold text-white">•••• •••• •••• 4242</p>
              <p className="text-xs text-slate-500">Expires 08/28</p>
            </div>
          </div>
          <div className="mt-6 text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" /> Default for ride bookings
          </div>
        </div>

        {/* UPI / Net Banking */}
        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">UPI Link</span>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300">
              UPI
            </div>
            <div>
              <p className="text-sm font-bold text-white">vito.user@okaxis</p>
              <p className="text-xs text-emerald-400">Verified</p>
            </div>
          </div>
          <button className="mt-6 text-xs font-semibold text-blue-400 hover:text-blue-300">
            Manage UPI IDs →
          </button>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Recent Transactions</h3>
        <div className="space-y-3">
          {[
            { title: 'Cab Ride to Airport T3', date: 'Aug 14, 2026', amount: '₹480.00', status: 'Completed', type: 'out' },
            { title: 'Vito Cash Auto Top-Up', date: 'Aug 10, 2026', amount: '₹1,000.00', status: 'Completed', type: 'in' },
            { title: 'Driver Hire Booking #DH-901', date: 'Aug 08, 2026', amount: '₹1,200.00', status: 'Completed', type: 'out' },
            { title: 'SUV Rental Refund', date: 'Aug 04, 2026', amount: '₹350.00', status: 'Refunded', type: 'in' },
          ].map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                  {tx.type === 'in' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{tx.title}</p>
                  <p className="text-[11px] text-slate-500">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold ${tx.type === 'in' ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {tx.type === 'in' ? '+' : '-'}{tx.amount}
                </p>
                <span className="text-[10px] text-slate-400">{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
