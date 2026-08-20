'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  Receipt,
  Key,
  Compass,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import ErrorState from '@/components/ui/ErrorState';
import CustomerVehicleManager from '@/components/customer-vehicles/CustomerVehicleManager';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'cars' | 'payments' | 'security'>('profile');

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
      <div className="max-w-4xl mx-auto space-y-4">
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

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans">
        {/* ─── 1. Top Profile Summary Card ──────────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-3xl bg-[#07111F] text-white flex items-center justify-center text-2xl font-black uppercase shadow-md border border-[#E5EAF0]">
              {(profile?.name || user?.name || 'U').charAt(0)}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
                  {profile?.name || user?.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified Customer
                </span>
              </div>
              <p className="text-xs text-[#526174] dark:text-slate-400 mt-1">
                {profile?.email || user?.email} {profile?.phone && `• ${profile.phone}`}
              </p>
              <p className="text-[11px] text-[#8995A5] mt-0.5">Member since {memberSince}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="px-4 py-2.5 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] hover:bg-[#E5EAF0] text-xs font-bold text-[#0B1728] dark:text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
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
                <label className="text-[11px] font-bold text-[#526174] block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold outline-none focus:border-[#00C2B3]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5EAF0] text-xs font-bold text-[#526174] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
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

        {/* ─── 2. Account Tabs ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 border-b border-[#E5EAF0] dark:border-[#17334F] pb-3">
          {[
            { id: 'profile', label: 'Overview & Profile', icon: User },
            { id: 'cars', label: 'My Cars (Driver Hire)', icon: Car },
            { id: 'payments', label: 'Payments & Wallet', icon: CreditCard },
            { id: 'security', label: 'Safety & Security', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#07111F] text-white shadow-sm'
                    : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174] hover:text-[#0B1728]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB: MY CARS ─────────────────────────────────────────────────── */}
        {activeTab === 'cars' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm">
            <CustomerVehicleManager />
          </div>
        )}

        {/* ─── TAB: PROFILE OVERVIEW ────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Mobility Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#526174]">
                MY MOBILITY & FLEET
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('cars')}
                  className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-left hover:border-[#00C2B3] transition-all group cursor-pointer"
                >
                  <Car className="w-6 h-6 text-[#00C2B3] mb-2" />
                  <h4 className="text-xs font-bold text-[#0B1728] dark:text-white">My Cars</h4>
                  <p className="text-[11px] text-[#8995A5] mt-0.5">Manage personal vehicles for Driver Hire</p>
                </button>

                <a
                  href="/customer/trips"
                  className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-left hover:border-[#00C2B3] transition-all group"
                >
                  <Compass className="w-6 h-6 text-blue-500 mb-2" />
                  <h4 className="text-xs font-bold text-[#0B1728] dark:text-white">My Trips</h4>
                  <p className="text-[11px] text-[#8995A5] mt-0.5">Cab rides & chauffeur trip logs</p>
                </a>

                <a
                  href="/customer/rentals"
                  className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-left hover:border-[#00C2B3] transition-all group"
                >
                  <Key className="w-6 h-6 text-emerald-500 mb-2" />
                  <h4 className="text-xs font-bold text-[#0B1728] dark:text-white">My Rentals</h4>
                  <p className="text-[11px] text-[#8995A5] mt-0.5">Self-drive vehicle bookings & deposits</p>
                </a>
              </div>
            </div>

            {/* Quick Link Groups */}
            <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm divide-y divide-[#E5EAF0] dark:divide-[#17334F] overflow-hidden">
              <a
                href="/customer/payments"
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F7F9FC] dark:hover:bg-[#10243A] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#0B1728] dark:text-white">
                      Payment Methods & Wallet
                    </p>
                    <p className="text-[11px] text-[#8995A5]">UPI, Cards, and Security Deposit refunds</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8995A5] group-hover:translate-x-0.5 transition-all" />
              </a>

              <a
                href="/customer/safety"
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F7F9FC] dark:hover:bg-[#10243A] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#0B1728] dark:text-white">
                      Safety Center & SOS
                    </p>
                    <p className="text-[11px] text-[#8995A5]">Emergency assistance, contacts, and live sharing</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8995A5] group-hover:translate-x-0.5 transition-all" />
              </a>

              <a
                href="/customer/support"
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F7F9FC] dark:hover:bg-[#10243A] transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#0B1728] dark:text-white">
                      Help & 24/7 Support Desk
                    </p>
                    <p className="text-[11px] text-[#8995A5]">Assistance for bookings, inquiries, and disputes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8995A5] group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>
          </div>
        )}

        {/* ─── TAB: PAYMENTS ────────────────────────────────────────────────── */}
        {activeTab === 'payments' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#0B1728] dark:text-white">Payment & Wallet Hub</h3>
                <p className="text-xs text-[#526174]">Manage your payment methods and view transaction settlements.</p>
              </div>
              <a
                href="/customer/payments"
                className="px-4 py-2 rounded-xl bg-[#07111F] text-white text-xs font-bold hover:bg-[#00C2B3] transition-all"
              >
                Open Full Wallet →
              </a>
            </div>
          </div>
        )}

        {/* ─── TAB: SECURITY ────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#0B1728] dark:text-white">Safety & Account Security</h3>
                <p className="text-xs text-[#526174]">Manage active sessions, emergency contacts, and protection settings.</p>
              </div>
              <a
                href="/customer/safety"
                className="px-4 py-2 rounded-xl bg-[#00C2B3] text-[#07111F] text-xs font-black shadow"
              >
                Go to Safety Center →
              </a>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
