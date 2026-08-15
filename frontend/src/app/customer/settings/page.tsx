'use client';

import React from 'react';
import { Settings as SettingsIcon, Bell, Lock, Globe, Shield, Moon } from 'lucide-react';

export default function CustomerSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage notification preferences, security options, and app configuration</p>
      </div>

      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl space-y-6">
        {/* Notifications */}
        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs font-bold text-white">Ride Status Push Notifications</p>
              <p className="text-[11px] text-slate-400">Receive live ETA updates and driver assignment alerts</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500 rounded cursor-pointer" />
        </div>

        {/* Location Privacy */}
        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs font-bold text-white">Precise Location Sharing</p>
              <p className="text-[11px] text-slate-400">Allows drivers to navigate directly to your exact GPS pin</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500 rounded cursor-pointer" />
        </div>

        {/* Security */}
        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-400">Require SMS OTP code for account login on new devices</p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            Configure 2FA
          </button>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs font-bold text-white">Theme Theme</p>
              <p className="text-[11px] text-slate-400">Ultra Dark Glassmorphism (Vito Standard)</p>
            </div>
          </div>
          <span className="text-xs text-blue-400 font-bold">Enabled</span>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs font-bold text-white">Language</p>
              <p className="text-[11px] text-slate-400">English (United States)</p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold">
            Change
          </button>
        </div>
      </div>
    </div>
  );
}
