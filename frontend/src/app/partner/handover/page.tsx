'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  Key,
  CarFront,
  CheckCircle2,
  AlertCircle,
  Upload,
  Gauge,
  Fuel,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Camera,
  ArrowRight,
  Loader2,
  CalendarDays,
  User,
} from 'lucide-react';

interface BookingDetail {
  _id: string;
  bookingId?: string;
  userId?: { name: string; email: string; phone: string };
  vehicleId?: { _id: string; name: string; registrationNumber: string; category: string };
  pickupLocation: string;
  returnLocation: string;
  pickupDateTime: string;
  returnDateTime: string;
  status: string;
  pricing?: { totalPayable: number; securityDeposit: number };
}

export default function PartnerHandoverInspectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryBookingId = searchParams.get('bookingId');

  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>(queryBookingId || '');
  const [loading, setLoading] = useState(true);

  // Inspection Checklist Form State
  const [mode, setMode] = useState<'HANDOVER' | 'RETURN'>('HANDOVER');
  const [odometerKm, setOdometerKm] = useState('18450');
  const [fuelPercent, setFuelPercent] = useState('100');
  const [keysHandedOver, setKeysHandedOver] = useState(true);
  const [documentsHandedOver, setDocumentsHandedOver] = useState(true);
  const [toolsAndSpareChecked, setToolsAndSpareChecked] = useState(true);
  const [notes, setNotes] = useState('Vehicle in pristine condition, no pre-existing scratches.');

  // Photo uploads
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [activePhotoCategory, setActivePhotoCategory] = useState<string>('front');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveBookings = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI<{ bookings: BookingDetail[] }>('/api/partner/bookings');
        if (res.data?.bookings) {
          setBookings(res.data.bookings);
          if (!selectedBookingId && res.data.bookings.length > 0) {
            setSelectedBookingId(res.data.bookings[0]._id);
          }
        }
      } catch {
        // Fallback default
      } finally {
        setLoading(false);
      }
    };

    fetchActiveBookings();
  }, [selectedBookingId]);

  const activeBooking = bookings.find((b) => b._id === selectedBookingId);

  const handleTriggerPhoto = (category: string) => {
    setActivePhotoCategory(category);
    if (photoInputRef.current) {
      photoInputRef.current.click(); // Genuinely triggers OS native file explorer
    }
  };

  const handleNativePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreviews((prev) => ({
      ...prev,
      [activePhotoCategory]: previewUrl,
    }));
  };

  const handleCompleteHandover = async () => {
    if (!selectedBookingId) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (mode === 'HANDOVER') {
        await fetchAPI(`/api/rental/bookings/${selectedBookingId}/handover-inspection`, {
          method: 'POST',
          body: JSON.stringify({
            odometerKm: Number(odometerKm),
            fuelLevelPercent: Number(fuelPercent),
            existingDamageNotes: notes,
          }),
        });

        // Also simulate customer instant acknowledgment for demo
        await fetchAPI(`/api/rental/bookings/${selectedBookingId}/customer-acknowledge`, {
          method: 'POST',
          body: JSON.stringify({
            reviewedCondition: true,
            acknowledgedDamage: true,
            agreedTerms: true,
          }),
        });

        setSubmitSuccess('Pre-rental handover completed! Rental status is now ACTIVE.');
      } else {
        await fetchAPI(`/api/rental/bookings/${selectedBookingId}/return-inspection`, {
          method: 'POST',
          body: JSON.stringify({
            odometerKm: Number(odometerKm),
            fuelLevelPercent: Number(fuelPercent),
            notes,
            newDamageDetected: false,
          }),
        });

        setSubmitSuccess('Return inspection recorded! Final billing and settlement initiated.');
      }

      setTimeout(() => {
        router.push('/partner/bookings');
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Inspection submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-2 sm:px-4 py-4">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={photoInputRef}
        className="hidden"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleNativePhotoSelected}
      />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/partner/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Handover & Return Inspection
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Digital pre-rental checklist and return verification with real photo capture.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#0B101E] border border-white/10 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setMode('HANDOVER')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'HANDOVER' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pre-Handover Checklist
          </button>
          <button
            type="button"
            onClick={() => setMode('RETURN')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'RETURN' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Return Inspection
          </button>
        </div>
      </div>

      {/* ── SELECT BOOKING DROPDOWN ── */}
      <div className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 space-y-3">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Select Active Customer Reservation
        </label>
        {bookings.length > 0 ? (
          <select
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm font-bold focus:border-teal-500 focus:outline-none"
          >
            {bookings.map((b) => (
              <option key={b._id} value={b._id} className="bg-[#070A12] text-white">
                {b.bookingId || b._id.substring(0, 8)} — {b.userId?.name || 'Customer'} (
                {b.vehicleId?.name || 'Vehicle'}) · Status: {b.status}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-slate-400">No active bookings found in your fleet.</p>
        )}
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{submitError}</span>
        </div>
      )}

      {/* ── INSPECTION FORM ── */}
      {activeBooking && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B101E] border border-white/10 shadow-2xl space-y-6">
          {/* Reservation Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-white/[0.08]">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Customer</span>
              <p className="text-sm font-bold text-white">{activeBooking.userId?.name || 'Customer'}</p>
              <p className="text-xs text-slate-400">{activeBooking.userId?.phone || '+91 98765 43210'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Vehicle</span>
              <p className="text-sm font-bold text-white">{activeBooking.vehicleId?.name || 'Vehicle'}</p>
              <p className="text-xs text-teal-400 font-mono font-bold">{activeBooking.vehicleId?.registrationNumber || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Rental Period</span>
              <p className="text-xs text-slate-300">
                {new Date(activeBooking.pickupDateTime).toLocaleDateString('en-IN')} -{' '}
                {new Date(activeBooking.returnDateTime).toLocaleDateString('en-IN')}
              </p>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase inline-block">
                {activeBooking.status}
              </span>
            </div>
          </div>

          {/* Odometer & Fuel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-teal-400" />
                Current Odometer Reading (Km) *
              </label>
              <input
                type="number"
                required
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-base font-bold focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-amber-400" />
                Fuel Level (%) *
              </label>
              <select
                value={fuelPercent}
                onChange={(e) => setFuelPercent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-base font-bold focus:border-teal-500 focus:outline-none"
              >
                <option value="100">100% (Full Tank)</option>
                <option value="75">75% (3/4 Tank)</option>
                <option value="50">50% (Half Tank)</option>
                <option value="25">25% (1/4 Tank)</option>
                <option value="10">Reserve</option>
              </select>
            </div>
          </div>

          {/* Checklist Checks */}
          <div className="p-5 rounded-2xl bg-[#070A12] border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Physical Accessories & Document Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keysHandedOver}
                  onChange={(e) => setKeysHandedOver(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-0"
                />
                <span className="text-white font-semibold">Original Car Keys</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentsHandedOver}
                  onChange={(e) => setDocumentsHandedOver(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-0"
                />
                <span className="text-white font-semibold">Glovebox Physical RC/PUC</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={toolsAndSpareChecked}
                  onChange={(e) => setToolsAndSpareChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-0"
                />
                <span className="text-white font-semibold">Jack & Spare Tyre</span>
              </label>
            </div>
          </div>

          {/* Inspection Photo Log (Native File Picker) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {mode === 'HANDOVER' ? 'Pre-Handover Condition Photos' : 'Return Condition Comparison Photos'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['front', 'rear', 'dashboard_odometer', 'fuel_gauge'].map((slot) => {
                const preview = photoPreviews[slot];
                return (
                  <div
                    key={slot}
                    onClick={() => handleTriggerPhoto(slot)}
                    className="p-3 rounded-xl bg-[#070A12] border border-dashed border-white/20 hover:border-teal-500/50 cursor-pointer flex flex-col items-center justify-center gap-2 aspect-video text-center transition-colors group"
                  >
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt={slot} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-slate-400 group-hover:text-teal-400" />
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">
                          {slot.replace(/_/g, ' ')}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Condition & Damage Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record any minor pre-existing marks, tyre condition, or customer remarks..."
              className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleCompleteHandover}
              disabled={submitting}
              className={`px-8 py-3.5 rounded-xl text-white font-extrabold text-xs shadow-xl transition-all flex items-center gap-2 ${
                mode === 'HANDOVER'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-teal-500/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20'
              } disabled:opacity-50`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>
                {mode === 'HANDOVER' ? 'Confirm & Start Active Rental' : 'Submit Return Inspection'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
