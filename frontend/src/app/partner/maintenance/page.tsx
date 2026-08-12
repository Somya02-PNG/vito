'use client';

import React from 'react';
import { Wrench } from 'lucide-react';

export default function PartnerMaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#0B101E] border border-teal-500/20 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-teal-400" />
          <span>Vehicle Maintenance & Service Logs</span>
        </h1>
        <p className="text-xs text-slate-400">Track vehicle servicing, oil changes, insurance, and fitness certificates</p>
      </div>

      <div className="p-12 rounded-3xl bg-[#0B101E] border border-white/10 text-center space-y-2">
        <Wrench className="w-8 h-8 text-teal-400 mx-auto" />
        <h3 className="text-sm font-bold text-white">Fleet Maintenance Schedule</h3>
        <p className="text-xs text-slate-400">Maintenance logs and service schedules will be available in the upcoming phase.</p>
      </div>
    </div>
  );
}
