'use client';

import React from 'react';
import { Settings, Navigation, Bell, Shield, Volume2 } from 'lucide-react';

export default function DriverSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Driver App Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Customize navigation app preferences, sound alerts, and auto-dispatch rules</p>
      </div>

      <div className="p-6 rounded-2xl bg-[#0B101E] border border-cyan-500/20 shadow-xl space-y-6">
        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs font-bold text-white">In-App GPS Provider</p>
              <p className="text-[11px] text-slate-400">Default to OpenStreetMap / Mapbox live routing</p>
            </div>
          </div>
          <span className="text-xs text-cyan-400 font-bold">Integrated GPS</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs font-bold text-white">Audio Trip Request Chime</p>
              <p className="text-[11px] text-slate-400">High-volume alert chime for new incoming trip requests</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500 rounded cursor-pointer" />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs font-bold text-white">Auto-Accept Back-to-Back Rides</p>
              <p className="text-[11px] text-slate-400">Queue next pickup when 2 minutes away from current dropoff</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500 rounded cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
