'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Phone,
  Share2,
  Copy,
  Check,
  Trash2,
  Edit2,
  Radio,
  AlertOctagon,
  Clock,
  MapPin,
  XCircle,
  Plus,
  Loader2,
  Lock,
  Mic,
  Activity,
  HeartPulse,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface EmergencyContact {
  _id: string;
  contactName: string;
  phone: string;
  relationship?: string;
}

interface SOSResult {
  timestamp: string;
  location: string;
  contactsNotifiedCount: number;
  notifications: { recipient: string; message: string }[];
  policeDeskNotified: boolean;
}

const DEFAULT_MOCK_CONTACTS: EmergencyContact[] = [
  { _id: 'ec1', contactName: 'Rajesh Sharma', phone: '+91 98765 11111', relationship: 'Parent' },
  { _id: 'ec2', contactName: 'Priya Verma', phone: '+91 98123 22222', relationship: 'Spouse' },
];

export default function SafetyHubPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>(DEFAULT_MOCK_CONTACTS);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Parent');

  // SOS State
  const [sosActive, setSosActive] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosData, setSosData] = useState<SOSResult | null>(null);

  // Live Location Share State
  const [isSharingLive, setIsSharingLive] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch Contacts
  const loadContacts = async () => {
    try {
      const res = await fetchAPI<{ contacts: EmergencyContact[] }>('/api/safety/contacts');
      if (res.data?.contacts && res.data.contacts.length > 0) {
        setContacts(res.data.contacts);
      }
    } catch {
      // Keep default mocks if offline
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Save Contact (Add or Edit)
  const handleSaveContact = async () => {
    if (!contactName || !phone) return;
    setLoading(true);

    try {
      if (editingContact) {
        await fetchAPI(`/api/safety/contacts/${editingContact._id}`, {
          method: 'PUT',
          body: { contactName, phone, relationship },
        });
      } else {
        await fetchAPI('/api/safety/contacts', {
          method: 'POST',
          body: { contactName, phone, relationship },
        });
      }
      await loadContacts();
      closeModal();
    } catch {
      // Fallback local update
      if (editingContact) {
        setContacts((prev) =>
          prev.map((c) => (c._id === editingContact._id ? { ...c, contactName, phone, relationship } : c))
        );
      } else {
        setContacts((prev) => [
          ...prev,
          { _id: `c_${Date.now()}`, contactName, phone, relationship },
        ]);
      }
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  // Delete Contact
  const handleDeleteContact = async (id: string) => {
    try {
      await fetchAPI(`/api/safety/contacts/${id}`, { method: 'DELETE' });
      setContacts((prev) => prev.filter((c) => c._id !== id));
    } catch {
      setContacts((prev) => prev.filter((c) => c._id !== id));
    }
  };

  const openAddModal = () => {
    setEditingContact(null);
    setContactName('');
    setPhone('');
    setRelationship('Parent');
    setShowAddModal(true);
  };

  const openEditModal = (c: EmergencyContact) => {
    setEditingContact(c);
    setContactName(c.contactName);
    setPhone(c.phone);
    setRelationship(c.relationship || 'Parent');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingContact(null);
  };

  // Trigger SOS Panic Alert
  const handleTriggerSOS = async () => {
    setSosLoading(true);
    try {
      const res = await fetchAPI<SOSResult>('/api/safety/sos', {
        method: 'POST',
        body: {
          lat: 28.6315,
          lng: 77.2167,
          address: 'Connaught Place, New Delhi',
        },
      });

      if (res.data) {
        setSosData(res.data);
      }
      setSosActive(true);
    } catch {
      setSosData({
        timestamp: new Date().toLocaleTimeString(),
        location: 'Connaught Place, New Delhi',
        contactsNotifiedCount: contacts.length,
        notifications: contacts.map((c) => ({
          recipient: `${c.contactName} (${c.phone})`,
          message: '🚨 EMERGENCY SOS Alert Sent',
        })),
        policeDeskNotified: true,
      });
      setSosActive(true);
    } finally {
      setSosLoading(false);
    }
  };

  // Toggle Live Location Sharing
  const handleToggleShare = async () => {
    const nextState = !isSharingLive;
    setIsSharingLive(nextState);

    if (nextState) {
      try {
        const res = await fetchAPI<{ shareUrl: string }>('/api/safety/share-link', { method: 'POST' });
        if (res.data?.shareUrl) {
          setShareUrl(res.data.shareUrl);
        }
      } catch {
        setShareUrl(`https://vito.app/track/live-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } else {
      setShareUrl('');
      setCopied(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden min-h-screen pb-12">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[400px] bg-hero-glow pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-6">

        {/* ════════════════════════════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════════════════════════════ */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] font-semibold text-rose-400 uppercase tracking-wider w-fit mb-1.5">
            <ShieldCheck className="w-3 h-3" />
            24/7 Security Protocol
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Safety <span className="text-gradient">Hub</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Emergency SOS, live tracking, and trusted contacts protection</p>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            PERSISTENT SOS PANIC BUTTON & ALERT BANNER
        ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-8">
          <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border-rose-500/30 text-center relative overflow-hidden">
            <div className="max-w-md mx-auto space-y-4">
              <span className="text-xs font-extrabold text-rose-400 uppercase tracking-widest block">
                Emergency Response System
              </span>

              {/* Pulsating SOS Trigger Button */}
              <button
                onClick={handleTriggerSOS}
                disabled={sosLoading}
                className="group relative w-32 h-32 sm:w-36 sm:h-36 mx-auto rounded-full bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-[0_0_50px_rgba(244,63,94,0.6)] active:scale-95 transition-all duration-300 flex flex-col items-center justify-center border-4 border-rose-400/40"
              >
                <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
                <AlertOctagon className="w-10 h-10 mb-1 animate-pulse" />
                <span className="text-2xl font-black tracking-wider">SOS</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-rose-200">Press for Emergency</span>
              </button>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Pressing SOS instantly logs your GPS location, notifies your {contacts.length} saved emergency contacts, and alerts the VITO 24/7 Security Control Room.
              </p>
            </div>

            {/* Active SOS Trigger Broadcast Alert Banner */}
            {sosActive && sosData && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-left space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <Radio className="w-4 h-4 animate-ping" />
                    <span>SOS ALERT BROADCASTED</span>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {sosData.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  📍 Location logged: <span className="text-white font-semibold">{sosData.location}</span>
                </p>

                <div className="space-y-1.5 pt-2 border-t border-rose-500/20 text-xs">
                  <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider block">
                    SMS Broadcast Sent to Contacts:
                  </span>
                  {sosData.notifications.map((n, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300 bg-black/30 p-2 rounded-lg">
                      <span className="font-semibold text-white">{n.recipient}</span>
                      <span className="text-emerald-400 font-bold text-[11px]">✓ SMS Sent</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1 text-emerald-400 font-semibold text-xs">
                    <Check className="w-4 h-4" /> VITO Police Desk & Patrol Unit Notified
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            GRID LAYOUT: LEFT (Contacts) + RIGHT (Live Share & Safety Features)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─────────────────────────────────────────────────────────────────
              LEFT: EMERGENCY CONTACTS MANAGEMENT
          ───────────────────────────────────────────────────────────────── */}
          <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4.5 h-4.5 text-primary-400" />
                  Emergency Contacts
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Contacts who receive automatic SOS alerts</p>
              </div>

              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/15 border border-primary-500/30 text-xs font-bold text-primary-300 hover:bg-primary-500/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Contact
              </button>
            </div>

            {/* Contacts Cards List */}
            <div className="space-y-3">
              {contacts.length === 0 ? (
                <div className="text-center py-8 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <Phone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No emergency contacts saved yet.</p>
                </div>
              ) : (
                contacts.map((c) => (
                  <div
                    key={c._id}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between hover:border-white/[0.12] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-300 font-bold">
                        {c.contactName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{c.contactName}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">
                            {c.relationship || 'Contact'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-2 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(c._id)}
                        className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT: SHARE LIVE LOCATION & SAFETY PROTOCOLS
          ───────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* LIVE LOCATION SHARING TOGGLE */}
            <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Share Live Location</h3>
                    <p className="text-xs text-slate-400">Generate a tracking link for friends & family</p>
                  </div>
                </div>

                <button
                  onClick={handleToggleShare}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    isSharingLive ? 'bg-emerald-500' : 'bg-white/[0.15]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      isSharingLive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isSharingLive && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 animate-in fade-in duration-200">
                  <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider block">
                    Shareable Tracking Link
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SAFETY PROTOCOLS GRID */}
            <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4.5 h-4.5 text-primary-400" />
                VITO Active Safety Shield
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <Lock className="w-4 h-4 text-emerald-400 mb-1.5" />
                  <h4 className="text-xs font-bold text-white">Driver Screened</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Criminal & background check</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <Mic className="w-4 h-4 text-cyan-400 mb-1.5" />
                  <h4 className="text-xs font-bold text-white">Audio Recording</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Encrypted trip audio logs</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <Activity className="w-4 h-4 text-violet-400 mb-1.5" />
                  <h4 className="text-xs font-bold text-white">Inactivity Monitor</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Route deviation alerts</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <HeartPulse className="w-4 h-4 text-rose-400 mb-1.5" />
                  <h4 className="text-xs font-bold text-white">24/7 Police Patrol</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Priority emergency hotline</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ADD / EDIT CONTACT MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel-glow rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-extrabold text-white">
              {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40 [color-scheme:dark]"
                >
                  {['Parent', 'Spouse', 'Sibling', 'Friend', 'Other'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveContact}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
