'use client';

import React, { useState } from 'react';
import { Settings, Bell, Shield, CreditCard, Building2, Palette, ChevronRight, Save, Check } from 'lucide-react';

interface ToggleSetting {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
}

export default function PartnerSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState<ToggleSetting[]>([
    { id: 'booking_alerts', label: 'New Booking Alerts', desc: 'Get notified instantly when a new booking is made', enabled: true },
    { id: 'maintenance_reminders', label: 'Maintenance Reminders', desc: 'Reminders for scheduled vehicle maintenance', enabled: true },
    { id: 'payment_alerts', label: 'Payment Alerts', desc: 'Alerts when a payment is received or fails', enabled: true },
    { id: 'review_notifications', label: 'Review Notifications', desc: 'Notify when customers leave reviews', enabled: false },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, enabled: !n.enabled } : n));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
            <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
          </div>
          <p className="text-sm text-slate-400 pl-4">Manage your partner account, notifications, and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 shrink-0 ${
            saved ? 'bg-emerald-600 text-white' : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/25'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Business Profile */}
      <div className="p-6 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-white">Business Profile</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Business Name', placeholder: 'Your business name' },
            { label: 'Business Phone', placeholder: '+91 XXXXX XXXXX' },
            { label: 'GST Number', placeholder: 'GST registration number' },
            { label: 'Bank Account', placeholder: 'Account number for payouts' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{field.label}</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-teal-500/40 transition-colors"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-white">Notifications</h3>
        </div>
        {notifications.map((n) => (
          <div key={n.id} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
            <div>
              <p className="text-xs font-bold text-white">{n.label}</p>
              <p className="text-[11px] text-slate-400">{n.desc}</p>
            </div>
            <button
              onClick={() => toggleNotification(n.id)}
              className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${n.enabled ? 'bg-teal-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Payout Settings */}
      <div className="p-6 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-white">Payout Settings</h3>
        </div>
        {[
          { label: 'Payout Frequency', value: 'Weekly (every Monday)' },
          { label: 'Minimum Payout', value: '₹1,000' },
          { label: 'Account Verified', value: '✓ Bank account linked' },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="text-xs font-bold text-white">{s.value}</p>
          </div>
        ))}
        <button className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1">
          Update Bank Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Security */}
      <div className="p-5 rounded-2xl bg-[#0B101E] border border-white/[0.06] flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-teal-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Account Security</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Password, 2FA, and login sessions</p>
        </div>
        <button className="text-xs font-semibold text-teal-400 hover:text-teal-300 shrink-0">Manage →</button>
      </div>
    </div>
  );
}
