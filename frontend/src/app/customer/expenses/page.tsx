'use client';

import React from 'react';
import { Receipt, Download, TrendingUp, PieChart as PieChartIcon, Calendar } from 'lucide-react';

export default function CustomerExpensesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Expense Reports</h1>
          <p className="text-sm text-slate-400 mt-1">Track monthly ride spending, export GST invoices, and manage business travel expenses</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all">
          <Download className="w-4 h-4" /> Export CSV / PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase">This Month Spending</p>
          <h2 className="text-3xl font-black text-white mt-2">₹4,820.00</h2>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 12% lower than last month
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase">Business Travel</p>
          <h2 className="text-3xl font-black text-white mt-2">₹3,200.00</h2>
          <p className="text-xs text-slate-400 mt-1">6 rides tagged for reimbursement</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase">GST Claimable Tax</p>
          <h2 className="text-3xl font-black text-blue-400 mt-2">₹241.00</h2>
          <p className="text-xs text-slate-400 mt-1">5% GST input tax credit available</p>
        </div>
      </div>

      {/* Monthly breakdown chart / receipt list */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">August 2026 Invoices</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <Calendar className="w-3.5 h-3.5 text-blue-400" /> Filter Month
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: 'INV-2026-088', trip: 'Airport Transfer (Cab)', date: 'Aug 14, 2026', amount: '₹480.00', gst: '₹24.00' },
            { id: 'INV-2026-074', trip: 'Driver Hire 8 hrs', date: 'Aug 08, 2026', amount: '₹1,200.00', gst: '₹60.00' },
            { id: 'INV-2026-051', trip: 'Self-Drive SUV Rental', date: 'Aug 02, 2026', amount: '₹3,140.00', gst: '₹157.00' },
          ].map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{inv.trip}</p>
                  <p className="text-[11px] text-slate-400">{inv.id} • {inv.date}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-xs font-bold text-white">{inv.amount}</p>
                  <p className="text-[10px] text-slate-500">GST: {inv.gst}</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
