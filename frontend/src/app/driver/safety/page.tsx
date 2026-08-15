'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Siren,
  PhoneCall,
  AlertTriangle,
  FileText,
  MapPin,
  Eye,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function DriverSafetyPage() {
  const [sosTriggered, setSosTriggered] = useState(false);

  const incidents = [
    { label: 'Aggressive passenger behavior', count: 0 },
    { label: 'Unsafe road conditions reported', count: 0 },
    { label: 'Vehicle breakdown during trip', count: 0 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Driver Safety</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Emergency tools, incident reporting, and safety compliance</p>
      </div>

      {/* SOS Card */}
      <div className="relative p-6 rounded-2xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Siren className="w-5 h-5 text-red-400" />
              <h2 className="text-base font-black text-white">Emergency SOS</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Trigger SOS during dangerous situations. Dispatches emergency services and notifies VITO safety team with your live location.
            </p>
          </div>
          <button
            onClick={() => setSosTriggered((s) => !s)}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-xl shrink-0 ${
              sosTriggered ? 'bg-slate-700 text-slate-300' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/40'
            }`}
          >
            {sosTriggered ? '✓ CANCEL SOS' : '🆘 SEND SOS'}
          </button>
        </div>
        {sosTriggered && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-semibold text-red-300 animate-fadeIn">
            SOS dispatched. VITO Safety Team and emergency services have been alerted with your GPS location.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: PhoneCall, title: 'VITO Safety Hotline', desc: '24/7 priority line for drivers', color: '#06B6D4' },
          { icon: FileText, title: 'Report an Incident', desc: 'Log passenger or road incidents', color: '#8B5CF6' },
          { icon: MapPin, title: 'Share My Location', desc: 'Send live position to safety team', color: '#10B981' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="p-5 rounded-2xl bg-[#0B101E] border border-cyan-500/15 flex flex-col justify-between gap-4">
              <div>
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
              </div>
              <button
                className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}
              >
                Open
              </button>
            </div>
          );
        })}
      </div>

      {/* Safety Compliance */}
      <div className="p-6 rounded-2xl bg-[#0B101E] border border-cyan-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Safety Compliance</h3>
        </div>
        {[
          { label: 'Vehicle fitness certificate', status: 'Valid', ok: true },
          { label: 'Driving license', status: 'Valid', ok: true },
          { label: 'Police verification', status: 'Completed', ok: true },
          { label: 'Safety training module', status: 'Completed', ok: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
            <p className="text-xs text-slate-300">{item.label}</p>
            <span className={`flex items-center gap-1 text-xs font-bold ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {/* Incident History */}
      <div className="p-6 rounded-2xl bg-[#0B101E] border border-white/[0.06] space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Incident Reports</h3>
        </div>
        <div className="p-8 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-white">Clean Safety Record</p>
          <p className="text-[11px] text-slate-500 mt-1">No incidents reported. Keep up the great work!</p>
        </div>
      </div>
    </div>
  );
}
