'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  MapPin,
  Users,
  Share2,
  Lock,
  Eye,
  Plus,
  Siren,
  Phone,
  CheckCircle2,
  X,
  Radio,
} from 'lucide-react';

export default function CustomerSafetyPage() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'preferences'>('overview');

  const [trustedContacts, setTrustedContacts] = useState([
    { name: 'Dr. Ananya Sharma', relation: 'Family / Spouse', phone: '+91 98765 43210' },
    { name: 'Rohit Verma', relation: 'Emergency Contact', phone: '+91 98111 22334' },
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('Friend');
  const [showAddContact, setShowAddContact] = useState(false);

  const handleTriggerSOS = () => {
    setIsEmergencyMode(true);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    setTrustedContacts([
      ...trustedContacts,
      { name: newContactName, relation: newContactRel, phone: newContactPhone },
    ]);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════════════
            ACTIVE EMERGENCY SOS MODE (Distinct Visual Mode)
        ════════════════════════════════════════════════════════════════════════ */}
        {isEmergencyMode ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#E5484D] text-white shadow-[0_12px_40px_rgba(229,72,77,0.5)] space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Siren className="w-7 h-7 text-white animate-bounce" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
                    🚨 EMERGENCY MODE ACTIVATED
                  </h2>
                  <p className="text-xs text-white/90 font-medium">
                    Live GPS broadcasted to VITO 24/7 Safety Command Center & Trusted Contacts
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEmergencyMode(false)}
                className="px-4 py-2 rounded-xl bg-white text-[#E5484D] text-xs font-black shadow-lg hover:bg-white/90 transition-all shrink-0"
              >
                Cancel SOS
              </button>
            </div>

            {/* Live Dispatch Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-black/20 border border-white/20 text-xs">
              <div className="space-y-1.5">
                <p className="text-white/80 font-bold uppercase tracking-wider text-[10px]">
                  Your Current GPS Coordinates
                </p>
                <p className="text-sm font-black">28.6315° N, 77.2167° E (Connaught Place, New Delhi)</p>
                <p className="text-[11px] text-white/80">Dispatched to Delhi Police Control (112)</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-white/80 font-bold uppercase tracking-wider text-[10px]">
                  Emergency Contacts Notified
                </p>
                <p className="text-xs font-semibold">
                  ✓ SMS & WhatsApp SOS sent with live link to {trustedContacts.length} trusted contacts.
                </p>
              </div>
            </div>

            {/* Direct Call Authority Actions */}
            <div className="flex flex-wrap gap-3">
              <a
                href="tel:112"
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white text-[#E5484D] font-black text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Phone className="w-4 h-4" />
                <span>Call Police (112)</span>
              </a>
              <a
                href="tel:18008486723"
                className="flex-1 py-3.5 px-6 rounded-2xl bg-black/30 text-white font-black text-sm flex items-center justify-center gap-2 border border-white/30"
              >
                <PhoneCall className="w-4 h-4" />
                <span>VITO Safety Hotline (1800-VITO-SAFE)</span>
              </a>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════
              STANDARD SAFETY CENTER VIEW
          ══════════════════════════════════════════════════════════════════════ */
          <>
            {/* Header: Trust Reassurance */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A67A]" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#16A67A]">
                  24/7 Live Protection
                </p>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1728] dark:text-white tracking-tight">
                You're Protected by VITO Safety
              </h1>
              <p className="text-sm sm:text-base text-[#526174] dark:text-slate-400 mt-1 font-medium">
                Real-time trip telemetry, verified chauffeur credentials, instant emergency SOS, and family live location sharing.
              </p>
            </div>

            {/* ─── Hero SOS Section: Large, Centered, Red, Unmistakable Button ── */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-[0_8px_30px_rgba(7,17,31,0.06)] text-center space-y-6 flex flex-col items-center">
              <div className="space-y-1 max-w-md">
                <span className="badge-vito-emergency">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Instant Emergency Trigger
                </span>
                <h2 className="text-xl font-extrabold text-[#0B1728] dark:text-white pt-2">
                  Need Immediate Emergency Help?
                </h2>
                <p className="text-xs text-[#526174] dark:text-slate-400 leading-relaxed">
                  Pressing the SOS button instantly alerts local emergency authorities, VITO safety response, and shares your live coordinates with your trusted contacts.
                </p>
              </div>

              {/* Centered Large Red Circular SOS Button */}
              <div className="py-2">
                <button
                  onClick={handleTriggerSOS}
                  className="btn-vito-sos"
                  aria-label="Trigger Emergency SOS"
                >
                  <Siren className="w-6 h-6 animate-pulse" />
                  <span>SOS</span>
                </button>
              </div>

              <p className="text-[11px] text-[#8995A5] font-medium">
                Tap to broadcast emergency alert immediately · Protected by VITO 24/7 Command Center
              </p>
            </div>

            {/* ─── Safety Feature Tiles ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#3984E8]/10 text-[#3984E8] flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1728] dark:text-white">
                    Share Live Trip
                  </h3>
                  <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5 leading-relaxed">
                    Send a private real-time tracking link to family via WhatsApp or SMS.
                  </p>
                </div>
                <button
                  onClick={() => alert('Live tracking link copied to clipboard: https://vito.live/track/live-demo')}
                  className="w-full py-2.5 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] hover:bg-[#E5EAF0] text-xs font-bold text-[#0B1728] dark:text-white transition-colors"
                >
                  Copy Live Link
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#16A67A]/10 text-[#16A67A] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1728] dark:text-white">
                    Trusted Contacts ({trustedContacts.length})
                  </h3>
                  <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5 leading-relaxed">
                    Contacts who automatically receive live updates on night trips.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="w-full py-2.5 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] hover:bg-[#E5EAF0] text-xs font-bold text-[#0B1728] dark:text-white transition-colors"
                >
                  Manage Contacts
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E5484D]/10 text-[#E5484D] flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1728] dark:text-white">
                    24/7 Safety Helpline
                  </h3>
                  <p className="text-xs text-[#526174] dark:text-slate-400 mt-0.5 leading-relaxed">
                    Direct line to VITO dedicated Incident Response team.
                  </p>
                </div>
                <a
                  href="tel:18008486723"
                  className="w-full py-2.5 rounded-xl bg-[#F1F5F8] dark:bg-[#10243A] hover:bg-[#E5EAF0] text-xs font-bold text-[#0B1728] dark:text-white transition-colors text-center block"
                >
                  Call 1800-VITO-SAFE
                </a>
              </div>
            </div>

            {/* ─── Trusted Contacts List & Modal ─────────────────────────────── */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0B1728] dark:text-white uppercase tracking-wider">
                  Configured Trusted Contacts
                </h3>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="text-xs font-bold text-[#00A99D] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Contact
                </button>
              </div>

              <div className="space-y-2.5">
                {trustedContacts.map((c, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#0B1728] dark:text-white">{c.name}</p>
                      <p className="text-[11px] text-[#526174] dark:text-slate-400">
                        {c.relation} · {c.phone}
                      </p>
                    </div>
                    <span className="badge-vito-verified">
                      Active Guardian
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Contact Modal */}
            {showAddContact && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0B1728] dark:text-white">
                      Add Trusted Contact
                    </h3>
                    <button
                      onClick={() => setShowAddContact(false)}
                      className="p-1 rounded-lg text-[#8995A5] hover:text-[#0B1728]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddContact} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#526174] block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold outline-none focus:border-[#00C2B3]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#526174] block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold outline-none focus:border-[#00C2B3]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#526174] block mb-1">
                        Relationship
                      </label>
                      <select
                        value={newContactRel}
                        onChange={(e) => setNewContactRel(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold outline-none focus:border-[#00C2B3]"
                      >
                        <option>Family / Spouse</option>
                        <option>Parent</option>
                        <option>Sibling</option>
                        <option>Friend</option>
                        <option>Colleague</option>
                      </select>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddContact(false)}
                        className="flex-1 py-2.5 rounded-xl border border-[#E5EAF0] text-xs font-bold text-[#526174]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm"
                      >
                        Save Contact
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
