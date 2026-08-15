'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
import {
  User,
  Phone,
  Mail,
  Car,
  Star,
  CheckCircle2,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  BadgeCheck,
  Clock,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import ErrorState from '@/components/ui/ErrorState';

export default function DriverProfilePage() {
  const { user, refetchUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ user: any }>('/api/auth/me');
      if (res.data?.user) {
        setProfile(res.data.user);
        setEditName(res.data.user.name || '');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchAPI('/api/auth/profile', { method: 'PUT', body: { name: editName } });
      await refetchUser();
      await fetchProfile();
      setEditing(false);
    } catch {
      // Show inline error
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.name || user?.name || 'D').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return <div className="max-w-2xl mx-auto space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Driver Profile</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Your driver identity, vehicle info, and rating</p>
      </div>

      {/* Identity Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-900/30 via-slate-900 to-emerald-900/20 border border-cyan-500/20 shadow-xl">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-600 to-emerald-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-cyan-500/30">
              {initials}
            </div>
            <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-cyan-600 hover:bg-cyan-500 border-2 border-[#07090E] flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white truncate">{profile?.name}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                <BadgeCheck className="w-3 h-3" />
                Verified Driver
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">VITO Driver · {profile?.city || 'Platform Partner'}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-black text-amber-400 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {profile?.rating?.toFixed(1) ?? '—'}
                </p>
                <p className="text-[10px] text-slate-500">Rating</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-black text-white">{profile?.totalRides ?? 0}</p>
                <p className="text-[10px] text-slate-500">Total Rides</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-black text-white">{profile?.experience ?? 0}yr</p>
                <p className="text-[10px] text-slate-500">Experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-6 rounded-2xl bg-[#0B101E] border border-white/[0.06] space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Account Details</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs font-semibold text-slate-400"><X className="w-3.5 h-3.5" /> Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs font-semibold text-emerald-400 disabled:opacity-50"><Save className="w-3.5 h-3.5" />{saving ? 'Saving…' : 'Save'}</button>
            </div>
          )}
        </div>

        {[
          { icon: User, label: 'Full Name', value: profile?.name, editable: true },
          { icon: Mail, label: 'Email', value: profile?.email, editable: false },
          { icon: Phone, label: 'Phone', value: profile?.phone, editable: false },
          { icon: Clock, label: 'Experience', value: `${profile?.experience ?? 0} years`, editable: false },
        ].map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.label} className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{field.label}</p>
                {editing && field.editable ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-500/40" autoFocus />
                ) : (
                  <p className="text-sm font-semibold text-white mt-0.5 truncate">{field.value || '—'}</p>
                )}
              </div>
              {!field.editable && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* License Card */}
      <div className="p-5 rounded-2xl bg-[#0B101E] border border-cyan-500/20 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">License Number</p>
          <p className="text-sm text-slate-300 mt-0.5">{profile?.licenseNumber || '—'}</p>
        </div>
        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
      </div>
    </div>
  );
}
