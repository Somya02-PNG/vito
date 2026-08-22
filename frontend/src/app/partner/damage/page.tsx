'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Clock,
  CarFront,
  ShieldCheck,
  RefreshCw,
  Plus,
  ArrowRight,
  Info,
} from 'lucide-react';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface DamageRecord {
  _id: string;
  bookingId?: { _id: string; bookingId?: string; userId?: { name: string; phone: string } };
  vehicleId?: { name: string; registrationNumber: string };
  location: string;
  damageType: string;
  severity: string;
  description: string;
  estimatedCost: number;
  confirmedCost?: number;
  status: string;
  isPreExisting: boolean;
  createdAt: string;
}

export default function PartnerDamageManagementPage() {
  const [damages, setDamages] = useState<DamageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDamages = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{ damages: DamageRecord[] }>('/api/partner/damages');
      setDamages(res.data?.damages || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDamages();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4 py-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/partner/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Damage Cases & Disputes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Fair settlement resolution workflow with evidence comparison and human adjudication.
          </p>
        </div>

        <button
          onClick={fetchDamages}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── MANDATORY HUMAN REVIEW POLICY NOTICE ── */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-white">Adjudication Policy: Zero Auto-Deduction</p>
          <p className="text-amber-200/80">
            VITO platform policy strictly requires impartial human admin review for all damage claims. Deductions from customer security deposits are NEVER automated on partner reporting alone. Both customer response and pre/post photo evidence are reviewed before settlement.
          </p>
        </div>
      </div>

      {/* ── DAMAGE CASES LIST ── */}
      {loading ? (
        <SkeletonList count={3} />
      ) : damages.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#0B101E] border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Damage Cases Reported</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your fleet has zero active damage disputes. During return inspection, any newly detected damage can be documented with photos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {damages.map((d) => (
            <div
              key={d._id}
              className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 space-y-4 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase font-mono">
                    Case #{d._id.substring(0, 8)}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {d.vehicleId?.name || 'Vehicle'} ({d.vehicleId?.registrationNumber || ''})
                  </span>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase self-start ${
                    d.status === 'RESOLVED' || d.status === 'CONFIRMED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : d.status === 'UNDER_REVIEW'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {d.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                  <span className="text-white font-medium">{d.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Damage Type</span>
                  <span className="text-white font-medium capitalize">{d.damageType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Severity</span>
                  <span className="text-white font-medium capitalize">{d.severity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Claim Estimate</span>
                  <span className="text-emerald-400 font-bold">₹{d.estimatedCost.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {d.description && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Description</p>
                  <p>{d.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
