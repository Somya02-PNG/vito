'use client';

import React from 'react';
import { HelpCircle, PhoneCall, ShieldAlert, FileCheck, Headphones } from 'lucide-react';

export default function DriverSupportPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Driver Partner Support & Hotline</h1>
        <p className="text-sm text-slate-400 mt-1">Get immediate assistance for active trips, fare adjustments, and vehicle issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#0B101E] border border-cyan-500/20 shadow-xl">
          <Headphones className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-base font-bold text-white">24/7 Driver Dispatch Desk</h3>
          <p className="text-xs text-slate-400 mt-1">Talk to dispatch team for route changes or customer delays</p>
          <button className="mt-4 w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs">
            Call Dispatch Now
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B101E] border border-cyan-500/20 shadow-xl">
          <FileCheck className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-base font-bold text-white">Fare & Toll Review</h3>
          <p className="text-xs text-slate-400 mt-1">Request audit or adjustment for unpaid toll fees or long waits</p>
          <button className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs">
            Submit Fare Ticket
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 shadow-xl">
          <ShieldAlert className="w-8 h-8 text-red-400 mb-3" />
          <h3 className="text-base font-bold text-white">Emergency SOS Patrol</h3>
          <p className="text-xs text-slate-400 mt-1">Immediate roadside dispatch & safety escalation</p>
          <button className="mt-4 w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/20">
            Trigger Driver SOS
          </button>
        </div>
      </div>
    </div>
  );
}
