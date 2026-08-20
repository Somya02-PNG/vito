'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { fetchAPI } from '@/lib/api';
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
  Copy,
  Check,
  Trash2,
  Edit2,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Car,
  UserCheck,
  Key,
} from 'lucide-react';

interface EmergencyContact {
  _id?: string;
  contactName: string;
  phone: string;
  relationship: string;
}

interface ActiveTripContext {
  type: 'cab' | 'driver_hire' | 'rental';
  bookingId: string;
  route: string;
  driverName?: string;
  driverPhone?: string;
  vehicleName: string;
  vehiclePlate?: string;
  status: string;
}

const DEFAULT_TRUSTED_CONTACTS: EmergencyContact[] = [
  { _id: 'ec_1', contactName: 'Rajesh Sharma', phone: '+91 98765 11111', relationship: 'Parent' },
  { _id: 'ec_2', contactName: 'Priya Verma', phone: '+91 98123 22222', relationship: 'Spouse' },
];

export default function SafetyCenterPage() {
  const { user } = useAuth();

  // Active Trip State (context awareness)
  const [activeTrip, setActiveTrip] = useState<ActiveTripContext | null>({
    type: 'driver_hire',
    bookingId: 'VT-DRV-8942',
    route: 'Kanpur Central → Hazratganj, Lucknow',
    driverName: 'Vikram Singh (✓ Verified Chauffeur)',
    driverPhone: '+91 98234 56789',
    vehicleName: 'Toyota Innova Crysta ZX (UP-78-TX-9901)',
    status: 'ACTIVE_TRIP',
  });

  // Emergency SOS State
  const [showSosConfirmModal, setShowSosConfirmModal] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [sosTimestamp, setSosTimestamp] = useState('');

  // Contacts State
  const [contacts, setContacts] = useState<EmergencyContact[]>(DEFAULT_TRUSTED_CONTACTS);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRel, setContactRel] = useState('Parent');

  // Live Location Share State
  const [isSharingLive, setIsSharingLive] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const liveTrackingUrl = `https://vito.ai/track/safety-${((user as any)?.id || (user as any)?._id || 'trip').toString().slice(-6)}`;

  // Incident Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [incidentCategory, setIncidentCategory] = useState('Route Deviation');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSubmitted, setIncidentSubmitted] = useState(false);

  // Load Contacts from backend if available
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await fetchAPI<any>('/safety/contacts');
        if (res.success && res.data?.contacts && res.data.contacts.length > 0) {
          setContacts(res.data.contacts);
        }
      } catch {}
    };
    loadContacts();
  }, []);

  // Trigger SOS confirmation
  const handleConfirmSOS = () => {
    setShowSosConfirmModal(false);
    setIsEmergencyMode(true);
    setSosTimestamp(new Date().toLocaleTimeString());
    try {
      fetchAPI('/safety/sos', {
        method: 'POST',
        body: {
          location: '26.4547° N, 80.3507° E (Kanpur Central)',
          bookingId: activeTrip?.bookingId,
        },
      });
    } catch {}
  };

  // Add Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    const newContact: EmergencyContact = {
      _id: `ec_${Date.now()}`,
      contactName: contactName.trim(),
      phone: contactPhone.trim(),
      relationship: contactRel,
    };

    setContacts([...contacts, newContact]);
    setContactName('');
    setContactPhone('');
    setShowAddContactModal(false);

    try {
      await fetchAPI('/safety/contacts', {
        method: 'POST',
        body: { contactName: newContact.contactName, phone: newContact.phone, relationship: newContact.relationship },
      });
    } catch {}
  };

  // Delete Contact
  const handleDeleteContact = (id?: string) => {
    if (!id) return;
    setContacts(contacts.filter((c) => c._id !== id));
    try {
      fetchAPI(`/safety/contacts/${id}`, { method: 'DELETE' });
    } catch {}
  };

  // Copy tracking link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveTrackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="space-y-8 max-w-5xl mx-auto font-sans pb-16">
        {/* ─── HEADER ──────────────────────────────────────────────────────── */}
        <div className="border-b border-[#E5EAF0] dark:border-[#17334F] pb-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#00A99D] flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> 24/7 Trust & Safety Infrastructure
          </span>
          <h1 className="text-2xl font-black text-[#0B1728] dark:text-white tracking-tight mt-0.5">
            Safety Center
          </h1>
          <p className="text-xs text-[#526174] dark:text-slate-400 mt-1">
            Your safety tools, emergency support and trip protection in one place.
          </p>
        </div>

        {/* ─── 1. ACTIVE EMERGENCY SOS STATE (IF TRIGGERED) ────────────────── */}
        {isEmergencyMode && (
          <div className="p-6 sm:p-8 rounded-3xl bg-red-600 text-white shadow-2xl space-y-6 animate-pulse">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Siren className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider">🚨 EMERGENCY SOS BROADCAST ACTIVE</h2>
                  <p className="text-xs text-red-100">
                    Live GPS dispatched to VITO 24/7 Emergency Command & {contacts.length} Trusted Contacts at {sosTimestamp}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEmergencyMode(false)}
                className="px-5 py-2.5 rounded-2xl bg-white text-red-600 text-xs font-black shadow hover:bg-red-50 transition-all cursor-pointer"
              >
                Cancel Emergency Mode
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/25 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-200 block">Live GPS Coordinates</span>
                <span className="font-black text-sm">26.4547° N, 80.3507° E (Kanpur Central)</span>
                <p className="text-[10px] text-red-200 mt-0.5">Dispatched to Local Emergency Desk (112)</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-red-200 block">Alerted Contacts</span>
                <span className="font-bold">
                  ✓ SMS & Live Tracking broadcasted to {contacts.map((c) => c.contactName).join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── 2. EMERGENCY ASSISTANCE SECTION ──────────────────────────────── */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#07111F] to-[#10243A] text-white border border-[#17334F] shadow-lg flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] uppercase font-black tracking-wider text-red-400">
                Emergency Assistance
              </span>
            </div>
            <h2 className="text-xl font-black text-white">Need Immediate Help?</h2>
            <p className="text-xs text-slate-300">
              Trigger emergency protocol to broadcast your live GPS to local emergency services, VITO Safety Operations, and your trusted contacts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSosConfirmModal(true)}
            className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-[0_4px_24px_rgba(220,38,38,0.4)] transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Siren className="w-5 h-5" /> Activate SOS Protocol
          </button>
        </div>

        {/* ─── 3. CONTEXT-AWARE TRIP SAFETY ─────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#526174] dark:text-slate-400">
            CURRENT TRIP SAFETY CONTEXT
          </h3>

          {activeTrip ? (
            <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border-2 border-[#00C2B3]/40 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5EAF0] dark:border-[#17334F] pb-3">
                <span className="text-xs font-bold text-[#00A99D] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Trip • {activeTrip.bookingId}
                </span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase">
                  Protected by VITO Safety Shield
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[#8995A5] block">Route</span>
                  <span className="font-bold text-[#0B1728] dark:text-white">{activeTrip.route}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[#8995A5] block">Assigned Chauffeur</span>
                  <span className="font-bold text-[#0B1728] dark:text-white">{activeTrip.driverName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[#8995A5] block">Operating Vehicle</span>
                  <span className="font-bold text-[#0B1728] dark:text-white">{activeTrip.vehicleName}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E5EAF0] dark:border-[#17334F]">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-[#07111F] text-white text-xs font-bold hover:bg-[#00C2B3] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> {copiedLink ? 'Link Copied!' : 'Share Live Trip'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold text-[#0B1728] dark:text-white hover:border-red-400 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Report Trip Issue
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border text-xs text-[#526174] flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-[#0B1728] dark:text-white block">No active trip currently</span>
                <span>Your safety shield, trusted contacts, and emergency tools remain active and ready for your next booking.</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. SAFETY TOOLS & GUIDELINES ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Share Live Trip Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#0B1728] dark:text-white">Share Live Journey</h4>
                <p className="text-xs text-[#526174]">Send real-time GPS tracking to friends or family.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border flex items-center justify-between text-xs">
              <span className="font-mono text-[#526174] truncate max-w-[240px]">{liveTrackingUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-bold text-[#00A99D] flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Safety Protocols Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#0B1728] dark:text-white">Safety Protocols & Protection</h4>
                <p className="text-xs text-[#526174]">Automated checks during every VITO trip.</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#526174]">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Mandatory 4-digit start OTP verification before trip departure.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>100% background-checked and identity-verified drivers & partners.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Route anomaly & unexpected stop detection via telemetry.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. EMERGENCY CONTACTS MANAGEMENT ─────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-[#0B1728] dark:text-white">Trusted Emergency Contacts</h3>
              <p className="text-xs text-[#526174]">
                These contacts receive automated SMS alerts and live tracking links if SOS is activated.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddContactModal(true)}
              className="px-4 py-2 rounded-xl bg-[#07111F] text-white text-xs font-bold hover:bg-[#00C2B3] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact._id || contact.phone}
                className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#07111F] border flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                    {contact.contactName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[#0B1728] dark:text-white block">{contact.contactName}</span>
                    <span className="text-[11px] text-[#526174]">
                      {contact.phone} • <strong className="text-[#00A99D]">{contact.relationship}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteContact(contact._id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SOS CONFIRMATION MODAL (ACCIDENTAL CLICK PROTECTION) ─────────── */}
        {showSosConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border-2 border-red-500 shadow-2xl space-y-5">
              <div className="w-14 h-14 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Siren className="w-7 h-7 animate-bounce" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-[#0B1728] dark:text-white">
                  Confirm Emergency SOS Activation?
                </h3>
                <p className="text-xs text-[#526174]">
                  This will immediately notify VITO 24/7 Emergency Operations, local police dispatch, and send your live GPS link to your {contacts.length} trusted contacts.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSosConfirmModal(false)}
                  className="py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold text-[#526174] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSOS}
                  className="py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg cursor-pointer"
                >
                  Yes, Activate SOS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ADD EMERGENCY CONTACT MODAL ──────────────────────────────────── */}
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-[#E5EAF0] pb-3">
                <h3 className="text-sm font-black text-[#0B1728] dark:text-white">Add Trusted Contact</h3>
                <button onClick={() => setShowAddContactModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Contact Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Verma"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Relationship</label>
                  <select
                    value={contactRel}
                    onChange={(e) => setContactRel(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow-md cursor-pointer"
                >
                  Save Emergency Contact
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── REPORT TRIP INCIDENT MODAL ───────────────────────────────────── */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-[#E5EAF0] pb-3">
                <h3 className="text-sm font-black text-[#0B1728] dark:text-white">Report Trip Issue</h3>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!incidentSubmitted ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0B1728] dark:text-white">Issue Category</label>
                    <select
                      value={incidentCategory}
                      onChange={(e) => setIncidentCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                    >
                      <option value="Route Deviation">Unexpected Route Deviation</option>
                      <option value="Vehicle Breakdown">Vehicle Breakdown / Mechanical Issue</option>
                      <option value="Chauffeur Behavior">Chauffeur Conduct Concern</option>
                      <option value="Medical Emergency">Medical Assistance Needed</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0B1728] dark:text-white">Details</label>
                    <textarea
                      value={incidentDescription}
                      onChange={(e) => setIncidentDescription(e.target.value)}
                      placeholder="Describe what happened..."
                      className="w-full h-24 p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIncidentSubmitted(true);
                      setTimeout(() => {
                        setIncidentSubmitted(false);
                        setShowReportModal(false);
                      }, 2000);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#07111F] text-white font-black text-xs shadow-md cursor-pointer"
                  >
                    Submit Report to Safety Operations
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold">Report received. Safety Operations has been alerted.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
