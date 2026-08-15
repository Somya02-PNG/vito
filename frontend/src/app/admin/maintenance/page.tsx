'use client';

import React from 'react';
import { Wrench, ShieldAlert, CheckCircle2, Clock, CarFront } from 'lucide-react';

export default function AdminMaintenancePage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Fleet Maintenance & Safety Audits</h1>
        <p className="text-sm text-slate-400 mt-1">System-wide vehicle maintenance tracking, inspection logs, and service compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-violet-500/20 shadow-xl">
          <p className="text-xs font-bold text-violet-400 uppercase">Vehicles In Service</p>
          <h2 className="text-3xl font-black text-white mt-2">18</h2>
          <p className="text-xs text-amber-400 mt-1">Due for periodic checkup</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-violet-500/20 shadow-xl">
          <p className="text-xs font-bold text-violet-400 uppercase">Active Repairs</p>
          <h2 className="text-3xl font-black text-white mt-2">5</h2>
          <p className="text-xs text-slate-400 mt-1">Work orders in progress</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-violet-500/20 shadow-xl">
          <p className="text-xs font-bold text-violet-400 uppercase">Passed Inspections</p>
          <h2 className="text-3xl font-black text-emerald-400 mt-2">142</h2>
          <p className="text-xs text-emerald-400 mt-1">98.2% compliance rate</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-violet-500/20 shadow-xl">
          <p className="text-xs font-bold text-violet-400 uppercase">Safety Recalls</p>
          <h2 className="text-3xl font-black text-white mt-2">0</h2>
          <p className="text-xs text-slate-400 mt-1">No pending OEM alerts</p>
        </div>
      </div>
    </div>
  );
}
