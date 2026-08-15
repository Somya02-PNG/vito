'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  MapPin,
  Users,
  Bell,
  Lock,
  Eye,
  ChevronRight,
  Plus,
  Siren,
} from 'lucide-react';

export default function CustomerSafetyPage() {
  const [sosTriggered, setSosTriggered] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-blue-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Safety Center</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Emergency tools, trusted contacts, and trip safety features</p>
      </div>

      {/* SOS Card — Most Prominent */}
      <div className="relative p-6 rounded-2xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Siren className="w-5 h-5 text-red-400" />
              <h2 className="text-base font-black text-white">Emergency SOS</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              In case of emergency, trigger SOS to alert authorities and your trusted contacts with your live location.
            </p>
          </div>
          <button
            onClick={() => setSosTriggered((s) => !s)}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-xl shrink-0 ${
              sosTriggered
                ? 'bg-slate-700 text-slate-300 border border-slate-600'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/40'
            }`}
          >
            {sosTriggered ? 'CANCEL SOS' : '🆘 SEND SOS'}
          </button>
        </div>
        {sosTriggered && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-semibold text-red-300 animate-fadeIn">
            ⚠️ SOS alert sent. Emergency contacts and local authorities have been notified with your location.
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: PhoneCall,
            title: 'Emergency Helpline',
            desc: 'Call VITO 24/7 support directly',
            action: 'Call Now',
            color: '#3B82F6',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
          },
          {
            icon: MapPin,
            title: 'Share Live Location',
            desc: 'Let a contact track your trip',
            action: 'Share',
            color: '#10B981',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
          },
          {
            icon: Eye,
            title: 'Trip Guardian',
            desc: 'Automatic check-ins during ride',
            action: 'Enable',
            color: '#8B5CF6',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className={`p-5 rounded-2xl ${item.bg} border ${item.border} flex flex-col justify-between gap-4`}>
              <div>
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${item.color}20`, border: `1px solid ${item.color}40` }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
              </div>
              <button
                className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}30` }}
              >
                {item.action}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trusted Contacts */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Trusted Contacts</h3>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300">
            <Plus className="w-3.5 h-3.5" />
            Add Contact
          </button>
        </div>

        <div className="p-8 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-400">No trusted contacts added yet</p>
          <p className="text-[11px] text-slate-500 mt-1">Add family or friends to notify during emergencies</p>
          <button className="mt-4 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/20 text-xs font-bold hover:bg-blue-600/30 transition-colors">
            + Add Trusted Contact
          </button>
        </div>
      </div>

      {/* Safety Settings */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Safety Settings</h3>
        </div>

        {[
          { icon: Bell, label: 'Ride Arrived Notification', desc: 'Alert when your driver is 2 minutes away', enabled: true },
          { icon: Lock, label: 'Trip PIN Verification', desc: 'Require OTP confirmation before ride starts', enabled: true },
          { icon: MapPin, label: 'Auto-share Location on SOS', desc: 'Instantly share location with contacts during SOS', enabled: false },
          { icon: AlertTriangle, label: 'Route Deviation Alert', desc: 'Alert if driver deviates from planned route', enabled: false },
        ].map((setting) => {
          const Icon = setting.icon;
          return (
            <div key={setting.label} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">{setting.label}</p>
                  <p className="text-[11px] text-slate-400">{setting.desc}</p>
                </div>
              </div>
              <div
                className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${setting.enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${setting.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
