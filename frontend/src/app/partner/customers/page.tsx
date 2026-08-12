'use client';

import React from 'react';
import { Users } from 'lucide-react';

export default function PartnerCustomersPage() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#0B101E] border border-teal-500/20 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-400" />
          <span>Fleet Customers</span>
        </h1>
        <p className="text-xs text-slate-400">View customer rental history and verified driver profiles</p>
      </div>

      <div className="p-12 rounded-3xl bg-[#0B101E] border border-white/10 text-center space-y-2">
        <Users className="w-8 h-8 text-teal-400 mx-auto" />
        <h3 className="text-sm font-bold text-white">Customer Management Directory</h3>
        <p className="text-xs text-slate-400">Customer directory management will be available in the upcoming phase.</p>
      </div>
    </div>
  );
}
