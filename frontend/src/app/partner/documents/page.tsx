'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CarFront,
  Upload,
  Eye,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface VehicleWithDocs {
  _id: string;
  name: string;
  registrationNumber: string;
  category: string;
  status: string;
  documentsCount: number;
  verifiedDocumentsCount: number;
}

export default function PartnerDocumentsPage() {
  const [vehicles, setVehicles] = useState<VehicleWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFleetDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<{ vehicles: VehicleWithDocs[] }>('/api/partner/vehicles');
      setVehicles(res.data?.vehicles || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetDocuments();
  }, []);

  const filtered = vehicles.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-2 sm:px-4 py-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/partner/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Compliance & Documents Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor RTO validity, insurance renewals, and document verification across your entire fleet.
          </p>
        </div>

        <button
          onClick={fetchFleetDocuments}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filter by vehicle name or registration..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B101E] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* ── VEHICLE DOCUMENTS TABLE ── */}
      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0B101E] border border-white/10 text-center text-xs text-slate-400">
          No fleet vehicles registered yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B101E]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070A12] text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Vehicle Details</th>
                <th className="px-4 py-3">Registration</th>
                <th className="px-4 py-3">RTO / RC Status</th>
                <th className="px-4 py-3">Insurance & PUC</th>
                <th className="px-4 py-3">Compliance Score</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filtered.map((v) => (
                <tr key={v._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">
                    <span className="block">{v.name}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{v.category}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-teal-400">
                    {v.registrationNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      RC Smart Card
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-slate-300">
                      {v.verifiedDocumentsCount} / 4 Verified
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-teal-500"
                          style={{
                            width: `${Math.min(100, (v.verifiedDocumentsCount / 4) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-teal-400">
                        {Math.round((v.verifiedDocumentsCount / 4) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/partner/vehicles/${v._id}`}
                      className="text-teal-400 hover:text-teal-300 font-bold text-[11px] hover:underline"
                    >
                      Manage Documents →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
