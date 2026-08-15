'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import {
  User,
  Phone,
  Mail,
  Camera,
  Edit3,
  Shield,
  CheckCircle2,
  Clock,
  Star,
  Car,
  Save,
  X,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import ErrorState from '@/components/ui/ErrorState';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  totalRides?: number;
  rating?: number;
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

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await fetchAPI('/api/auth/profile', { method: 'PUT', body: { name: editName } });
      await refetchUser();
      await fetchProfile();
      setEditing(false);
      setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Update failed. Please try again.');
      setTimeout(() => setSaveMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.name || user?.name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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
    : 'Recently';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-blue-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">My Profile</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Manage your account details and preferences</p>
      </div>

      {saveMsg && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold border ${
          saveMsg.includes('failed') ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        }`}>
          {saveMsg}
        </div>
      )}

      {/* Avatar + Identity Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/30 via-slate-900 to-indigo-900/20 border border-blue-500/20 shadow-xl">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-blue-500/30">
              {initials}
            </div>
            <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-blue-600 hover:bg-blue-500 border-2 border-[#07090E] flex items-center justify-center transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Name + Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white truncate">{profile?.name}</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                profile?.status === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                {profile?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">VITO Customer · Member since {memberSince}</p>

            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-black text-white">{profile?.totalRides ?? 0}</p>
                <p className="text-[10px] text-slate-500">Total Trips</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-black text-amber-400 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {profile?.rating ?? '—'}
                </p>
                <p className="text-[10px] text-slate-500">Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Account Details</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditing(false); setEditName(profile?.name || ''); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex items-center gap-3 py-3 border-b border-white/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</p>
            {editing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500/40"
                autoFocus
              />
            ) : (
              <p className="text-sm font-semibold text-white mt-0.5">{profile?.name}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 py-3 border-b border-white/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">{profile?.email}</p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</p>
            <p className="text-sm font-semibold text-white mt-0.5">{profile?.phone}</p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      </div>

      {/* Security Card */}
      <div className="p-5 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Account Security</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Password, 2FA, and active sessions</p>
        </div>
        <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 shrink-0">
          Manage →
        </button>
      </div>
    </div>
  );
}
