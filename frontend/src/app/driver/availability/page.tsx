'use client';

import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle2, Sliders, MapPin } from 'lucide-react';

export default function DriverAvailabilityPage() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Driver Availability & Shift Setup</h1>
          <p className="text-sm text-slate-400 mt-1">Configure your online status, preferred working zones, and automated dispatch schedules</p>
        </div>

        {/* Big Online/Offline Switch */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl ${
            isOnline
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-cyan-500/25'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-slate-950 animate-ping' : 'bg-slate-500'}`} />
          {isOnline ? 'ONLINE - RECEIVING TRIPS' : 'OFFLINE - PAUSED'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#0B101E] border border-cyan-500/20 shadow-xl">
          <p className="text-xs font-bold text-cyan-400 uppercase">Today's Shift Hours</p>
          <h2 className="text-3xl font-black text-white mt-2">6h 45m</h2>
          <p className="text-xs text-slate-400 mt-1">Goal: 8h 00m</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B101E] border border-cyan-500/20 shadow-xl">
          <p className="text-xs font-bold text-cyan-400 uppercase">Current Zone</p>
          <h2 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" /> Downtown / Central
          </h2>
          <p className="text-xs text-emerald-400 mt-1">Surge Multiplier: 1.4x</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B101E] border border-cyan-500/20 shadow-xl">
          <p className="text-xs font-bold text-cyan-400 uppercase">Automated Shift End</p>
          <h2 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> 10:30 PM
          </h2>
          <p className="text-xs text-slate-400 mt-1">Auto-offline scheduled</p>
        </div>
      </div>
    </div>
  );
}
