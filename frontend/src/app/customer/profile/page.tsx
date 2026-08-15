'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import {
  User,
  Phone,
  Mail,
  Edit3,
  Shield,
  CheckCircle2,
  CreditCard,
  MapPin,
  Users,
  Bell,
  Lock,
  HelpCircle,
  ChevronRight,
  Save,
  X,
  Sparkles,
  Car,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import ErrorState from '@/components/ui/ErrorState';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

export default function CustomerProfilePage() {
  const { user, refetchUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ user: UserProfile }>('/api/auth/me');
      if (res.data?.user) {
        setProfile(res.data.user);
        setEditName(res.data.user.name);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await fetchAPI('/api/auth/profile', { method: 'PUT', body: { name: editName } });
      await refetchUser();
      await fetchProfile();
      setEditing(false);
      setSaveMsg('Profile updated successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Update failed. Please try again.');
      setTimeout(() => setSaveMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchProfile} />;
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'March 2026';

  const sections = [
    {
      title: 'Payment Methods',
      desc: 'UPI AutoPay, Linked Cards & VITO Wallet',
      icon: CreditCard,
      href: '/customer/payments',
    },
    {
      title: 'Saved Places',
      desc: 'Home, Office, Airport & Favorites',
      icon: MapPin,
      href: '#places',
    },
    {
      title: 'Trusted Contacts & SOS',
      desc: '2 contacts receiving live emergency telemetry',
      icon: Users,
      href: '/customer/safety',
    },
    {
      title: 'Ride Preferences',
      desc: 'AC temperature, quiet ride, music preferences',
      icon: Car,
      href: '#preferences',
    },
    {
      title: 'Notifications & Alerts',
      desc: 'SMS, WhatsApp alerts, and trip updates',
      icon: Bell,
      href: '#notifications',
    },
    {
      title: 'Privacy & Security',
      desc: 'Two-factor auth, session security & data export',
      icon: Lock,
      href: '#privacy',
    },
    {
      title: 'Help & 24/7 Support',
      desc: 'Frequently asked questions & ticket desk',
      icon: HelpCircle,
      href: '/customer/support',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ─── 1. Profile Summary Card (Top Centralized) ──────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-[0_4px_20px_rgba(7,17,31,0.06)] flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-3xl bg-[#07111F] text-white flex items-center justify-center text-xl font-black uppercase shadow-md border border-[#E5EAF0]">
            {(profile?.name || user?.name || 'U').charAt(0)}
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg font-black text-[#0B1728] dark:text-white">
                {profile?.name || user?.name}
              </h2>
              <span className="badge-vito-verified">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5">
              {profile?.email || user?.email}
            </p>
            <p className="text-[11px] text-[#8995A5] mt-1">
              Member since {memberSince}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] hover:bg-[#E5EAF0] text-xs font-bold text-[#0B1728] dark:text-white transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{editing ? 'Close' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Edit Form Drawer */}
      {editing && (
        <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#00C2B3]/30 shadow-md space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00A99D]">
            Update Personal Information
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-[#526174] block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold outline-none focus:border-[#00C2B3]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5EAF0] text-xs font-bold text-[#526174]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {saveMsg && (
        <div className="p-3 rounded-2xl bg-[#E8F7F2] text-[#16A67A] text-xs font-bold text-center border border-[#16A67A]/30">
          {saveMsg}
        </div>
      )}

      {/* ─── 2. Clean List Sections ─────────────────────────────────────────── */}
      <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm divide-y divide-[#E5EAF0] dark:divide-[#17334F] overflow-hidden">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <a
              key={sec.title}
              href={sec.href}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F7F9FC] dark:hover:bg-[#10243A] transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] group-hover:bg-[#00C2B3]/10 text-[#526174] group-hover:text-[#00A99D] flex items-center justify-center transition-colors shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-[#0B1728] dark:text-white truncate">
                    {sec.title}
                  </p>
                  <p className="text-[11px] text-[#8995A5] truncate mt-0.5">
                    {sec.desc}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#8995A5] group-hover:text-[#0B1728] group-hover:translate-x-0.5 transition-all shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
