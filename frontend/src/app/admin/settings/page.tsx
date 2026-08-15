'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Settings, Bell, Shield, Server, Globe, DollarSign, RefreshCw, Check, Save, AlertTriangle } from 'lucide-react';

interface ToggleSetting {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
}

function AdminSettingsContent() {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState<ToggleSetting[]>([
    { id: 'sos_alerts', label: 'SOS Emergency Alerts', desc: 'Immediate alerts for all SOS events', enabled: true },
    { id: 'new_partner', label: 'New Partner Registrations', desc: 'Notify when new partners register', enabled: true },
    { id: 'payment_failures', label: 'Payment Failures', desc: 'Alert on failed payment transactions', enabled: true },
    { id: 'safety_incidents', label: 'Safety Incidents', desc: 'Real-time safety event notifications', enabled: true },
    { id: 'daily_report', label: 'Daily Summary Report', desc: 'Daily platform performance digest', enabled: false },
  ]);

  const [platform, setPlatform] = useState<ToggleSetting[]>([
    { id: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Disable user-facing platform access during maintenance', enabled: false },
    { id: 'new_registrations', label: 'New Registrations', desc: 'Allow new user signups', enabled: true },
    { id: 'driver_auto_approve', label: 'Auto-approve Drivers', desc: 'Automatically approve verified driver applications', enabled: false },
    { id: 'partner_auto_approve', label: 'Auto-approve Partners', desc: 'Automatically approve verified partner applications', enabled: false },
  ]);

  const toggleNotification = (id: string) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, enabled: !n.enabled } : n));
  const togglePlatform = (id: string) => setPlatform((p) => p.map((n) => n.id === id ? { ...n, enabled: !n.enabled } : n));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-violet-500 to-violet-500/50" />
            <h1 className="text-2xl font-black text-white tracking-tight">Platform Settings</h1>
          </div>
          <p className="text-sm text-slate-400 pl-4">Configure platform behaviour, notifications, and security</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 shrink-0 ${saved ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25'}`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Platform Controls */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-violet-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Platform Controls</h3>
        </div>
        {platform.map((n) => (
          <div key={n.id} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
            <div>
              <p className="text-xs font-bold text-white">{n.label}</p>
              <p className="text-[11px] text-slate-400">{n.desc}</p>
            </div>
            <button
              onClick={() => togglePlatform(n.id)}
              className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ml-4 ${n.enabled ? 'bg-violet-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}

        {platform.find((p) => p.id === 'maintenance_mode')?.enabled && (
          <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">Maintenance mode is ON. Users cannot access the platform.</p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-violet-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Admin Notifications</h3>
        </div>
        {notifications.map((n) => (
          <div key={n.id} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
            <div>
              <p className="text-xs font-bold text-white">{n.label}</p>
              <p className="text-[11px] text-slate-400">{n.desc}</p>
            </div>
            <button
              onClick={() => toggleNotification(n.id)}
              className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ml-4 ${n.enabled ? 'bg-violet-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Payment Configuration */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Payment & Commission</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Platform Commission (%)', placeholder: '15', desc: 'Cut taken from each ride/rental' },
            { label: 'Driver Payout Cycle', placeholder: 'Weekly', desc: 'Frequency of driver settlements' },
            { label: 'Minimum Payout Amount', placeholder: '₹500', desc: 'Minimum balance before payout' },
            { label: 'GST Rate (%)', placeholder: '18', desc: 'Applied to all transactions' },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</label>
              <input placeholder={f.placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/40 transition-colors" />
              <p className="text-[10px] text-slate-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="p-5 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Security & Access Control</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Admin accounts, 2FA enforcement, and API key management</p>
        </div>
        <button className="text-xs font-semibold text-violet-400 hover:text-violet-300 shrink-0">Manage →</button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminSettingsContent />
    </ProtectedRoute>
  );
}
