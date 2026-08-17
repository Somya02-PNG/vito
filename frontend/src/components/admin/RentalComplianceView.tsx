'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, CheckCircle2, AlertTriangle, XCircle, FileText,
  Search, Filter, RefreshCw, Car, Calendar, Check, AlertCircle,
  Building, Clock, ExternalLink,
} from 'lucide-react';
import { fetchAPI } from '@/lib/api';

interface VehicleComplianceCard {
  vehicleId: string;
  name: string;
  registrationNumber: string;
  city: string;
  hubName: string;
  rentalStatus: 'ELIGIBLE' | 'NOT_ELIGIBLE';
  compliant: boolean;
  expiredDocs: string[];
  missingDocs: string[];
  documents: Array<{
    documentType: string;
    documentName: string;
    status: string;
    maskedIdentifier: string;
    expiresAt: string;
  }>;
}

export default function RentalComplianceView() {
  const [vehicles, setVehicles] = useState<VehicleComplianceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ELIGIBLE' | 'NOT_ELIGIBLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleCount, setEligibleCount] = useState(0);
  const [ineligibleCount, setIneligibleCount] = useState(0);

  const loadComplianceData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAPI(`/api/rental/admin/compliance?statusFilter=${filter}`);
      if (res.success) {
        setVehicles(res.data.vehicles || []);
        setEligibleCount(res.data.eligibleCount || 0);
        setIneligibleCount(res.data.ineligibleCount || 0);
      }
    } catch (e) {
      console.error('Failed to load compliance data', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  const filteredVehicles = vehicles.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.hubName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C2B3]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#00A99D]">VITO Fleet Operations</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1728] dark:text-white">Rental Compliance Center</h1>
          <p className="text-xs sm:text-sm text-[#526174] dark:text-slate-400 mt-0.5">
            Automatic document compliance monitoring: RC, Insurance, PUC, Fitness & Tourist Permits.
          </p>
        </div>

        <button
          onClick={loadComplianceData}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-sm hover:bg-[#10243A] transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Compliance
        </button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm">
          <p className="text-xs font-bold text-[#8995A5] uppercase tracking-wider">Total Monitored Fleet</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-[#0B1728] dark:text-white">{vehicles.length}</span>
            <span className="text-xs text-[#526174]">vehicles</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#E8F7F2] dark:bg-[#07241A] border border-[#16A67A]/30 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#16A67A] uppercase tracking-wider">Rental Eligible</p>
            <CheckCircle2 className="w-4 h-4 text-[#16A67A]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-[#16A67A]">{eligibleCount}</span>
            <span className="text-xs text-[#16A67A]/80">Active in customer search</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Not Eligible (Blocked)</p>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-red-600">{ineligibleCount}</span>
            <span className="text-xs text-red-600/80">Auto-hidden from search</span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F]">
        <div className="flex items-center gap-2">
          {(['ALL', 'ELIGIBLE', 'NOT_ELIGIBLE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === t ? 'bg-[#07111F] text-white' : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174]'}`}
            >
              {t === 'ALL' ? 'All Vehicles' : t === 'ELIGIBLE' ? '✓ Eligible Only' : '⚠ Blocked Only'}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#8995A5] absolute left-3 top-2.5" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicle, city, hub..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-semibold text-[#0B1728] dark:text-white outline-none"
          />
        </div>
      </div>

      {/* ── Compliance Cards Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 text-center text-[#526174] text-xs font-bold">
          Checking real-time document compliance...
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0B1728] rounded-2xl border border-[#E5EAF0] dark:border-[#17334F] text-[#526174] space-y-2">
          <Car className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-bold text-sm">No vehicles match current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVehicles.map((v) => (
            <div
              key={v.vehicleId}
              className={`p-5 rounded-3xl bg-white dark:bg-[#0B1728] border ${v.compliant ? 'border-[#E5EAF0] dark:border-[#17334F]' : 'border-red-300 dark:border-red-800/40 bg-red-50/20'} shadow-sm space-y-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-[#0B1728] dark:text-white">{v.name}</h3>
                  <p className="text-xs text-[#526174] mt-0.5">
                    📍 {v.hubName || v.city} • <span className="font-bold text-[#0B1728] dark:text-white">{v.registrationNumber}</span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${v.compliant ? 'bg-[#E8F7F2] text-[#16A67A]' : 'bg-red-500/10 text-red-600'}`}
                >
                  {v.compliant ? '✓ Rental Eligible' : '⚠ Blocked from Search'}
                </span>
              </div>

              {/* Document Status List */}
              <div className="space-y-2 border-t border-[#E5EAF0] dark:border-[#17334F] pt-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#8995A5]">Verified Document Fleet Health</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {v.documents.map((doc) => (
                    <div
                      key={doc.documentType}
                      className="p-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0B1728] dark:text-white text-[11px] truncate">{doc.documentName.split('(')[0]}</span>
                        <span className="text-[9px] font-black text-emerald-600">✓ {doc.status}</span>
                      </div>
                      <p className="text-[10px] text-[#8995A5]">{doc.maskedIdentifier}</p>
                      {doc.expiresAt && (
                        <p className="text-[9px] text-[#526174]">Expires: {new Date(doc.expiresAt).toLocaleDateString('en-IN')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {!v.compliant && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-600 font-bold space-y-1">
                  <p>Automatic Action Applied:</p>
                  <p className="text-[11px] font-normal">
                    This vehicle has expired or missing documents ({v.expiredDocs.concat(v.missingDocs).join(', ')}). It is automatically excluded from customer search results until re-verified.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
