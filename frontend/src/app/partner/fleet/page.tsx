'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  CarFront,
  CheckCircle2,
  Clock,
  Wrench,
  Plus,
  ChevronRight,
  Search,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Archive,
  RefreshCw,
  Sparkles,
  Key,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonStatGrid } from '@/components/ui/SkeletonCard';

interface VehicleItem {
  _id: string;
  vehicleId: string;
  name: string;
  make: string;
  vehicleModel: string;
  registrationNumber: string;
  category: string;
  fuelType: string;
  transmission: string;
  pricePerDay: number;
  depositAmount: number;
  status: string;
  availabilityStatus: string;
  documentsCount?: number;
  verifiedDocumentsCount?: number;
  isBookable?: boolean;
  photos?: Array<{ url: string }>;
  images?: string[];
}

export default function PartnerFleetPage() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'under_review' | 'draft' | 'maintenance'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ vehicles: VehicleItem[] }>('/api/partner/vehicles');
      setVehicles(res.data?.vehicles || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load fleet inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filtered = vehicles.filter((v) => {
    // Status filter
    if (filter === 'verified' && v.status !== 'VERIFIED') return false;
    if (filter === 'under_review' && v.status !== 'UNDER_REVIEW') return false;
    if (filter === 'draft' && (v.status !== 'DRAFT' && v.status !== 'DOCUMENTS_PENDING')) return false;
    if (filter === 'maintenance' && v.availabilityStatus !== 'UNDER_MAINTENANCE') return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const verifiedCount = vehicles.filter((v) => v.status === 'VERIFIED').length;
  const underReviewCount = vehicles.filter((v) => v.status === 'UNDER_REVIEW').length;
  const draftCount = vehicles.filter((v) => v.status === 'DRAFT' || v.status === 'DOCUMENTS_PENDING').length;
  const availableCount = vehicles.filter((v) => v.status === 'VERIFIED' && v.availabilityStatus === 'AVAILABLE').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4 py-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-teal-500 to-cyan-500" />
            <h1 className="text-2xl font-black text-white tracking-tight">Fleet Inventory</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            All registered vehicles in your fleet with real-time verification and availability metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchVehicles}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs"
            title="Refresh Fleet"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/partner/vehicles/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-teal-500/25 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </Link>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Fleet</span>
            <p className="text-2xl font-black text-white">{vehicles.length}</p>
            <p className="text-[10px] text-teal-400">{availableCount} Available for Rent</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-emerald-500/20 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Cars</span>
            <p className="text-2xl font-black text-emerald-400">{verifiedCount}</p>
            <p className="text-[10px] text-emerald-400/80">Search Active</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-cyan-500/20 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Under Review</span>
            <p className="text-2xl font-black text-cyan-300">{underReviewCount}</p>
            <p className="text-[10px] text-cyan-400/80">Admin Checking</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-amber-500/20 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drafts Pending</span>
            <p className="text-2xl font-black text-amber-400">{draftCount}</p>
            <p className="text-[10px] text-amber-400/80">Docs Required</p>
          </div>
        </div>
      )}

      {/* ── CONTROLS: SEARCH & TABS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#0B101E] border border-white/10 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Fleet' },
            { id: 'verified', label: 'Verified' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'draft', label: 'Drafts' },
            { id: 'maintenance', label: 'Maintenance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search make, model, registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B101E] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ── FLEET GRID ── */}
      {loading ? (
        <SkeletonStatGrid count={6} columns={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchVehicles} />
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[#0B101E] border border-white/10 text-center space-y-4">
          <CarFront className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {searchTerm ? 'No matching vehicles found' : 'No vehicles in this filter'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {vehicles.length === 0
                ? 'Start by adding your first vehicle to unlock self-drive rental bookings.'
                : 'Try adjusting your search query or filter criteria.'}
            </p>
          </div>
          {vehicles.length === 0 && (
            <Link
              href="/partner/vehicles/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Vehicle</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((v) => {
            const photoUrl =
              v.photos?.[0]?.url
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${v.photos[0].url}`
                : v.images?.[0]
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${v.images[0]}`
                : null;

            return (
              <div
                key={v._id}
                className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 hover:border-teal-500/40 transition-all flex flex-col justify-between group space-y-4 shadow-lg"
              >
                {/* Top Media / Badges */}
                <div className="space-y-3">
                  <div className="aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 relative">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt={v.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                        <CarFront className="w-8 h-8" />
                        <span className="text-[10px]">No Photo Uploaded</span>
                      </div>
                    )}

                    {/* Verification Status Badge Overlay */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                          v.status === 'VERIFIED'
                            ? 'bg-emerald-500/80 text-white'
                            : v.status === 'UNDER_REVIEW'
                            ? 'bg-cyan-500/80 text-white'
                            : v.status === 'REJECTED'
                            ? 'bg-red-500/80 text-white'
                            : 'bg-amber-500/80 text-slate-950'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-teal-300 transition-colors">
                      {v.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#070A12] border border-white/10 text-teal-400">
                        {v.registrationNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {v.category} · {v.fuelType} · {v.transmission}
                      </span>
                    </div>
                  </div>

                  {/* Document & Bookability Status */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] flex items-center justify-between">
                    <span className="text-slate-400">Compliance</span>
                    {v.isBookable ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Bookable
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Verification Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Manage Action */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                  <div>
                    <p className="text-base font-black text-emerald-400">
                      ₹{v.pricePerDay.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">/day</span>
                    </p>
                  </div>

                  <Link
                    href={`/partner/vehicles/${v._id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-bold text-xs transition-all flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
