'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { CarFront, CheckCircle2, Clock, Wrench, Plus, ChevronRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList, SkeletonStatGrid } from '@/components/ui/SkeletonCard';

interface Vehicle {
  _id: string;
  name: string;
  registrationNumber: string;
  type: string;
  availability: boolean;
  status?: string;
  year?: number;
  fuelType?: string;
  pricePerDay?: number;
  images?: string[];
}

export default function PartnerFleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'booked' | 'maintenance'>('all');

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ vehicles: Vehicle[] }>('/api/vehicles/partner');
      setVehicles(res.data?.vehicles || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load fleet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const available = vehicles.filter((v) => v.availability && v.status !== 'maintenance');
  const booked = vehicles.filter((v) => !v.availability && v.status !== 'maintenance');
  const maintenance = vehicles.filter((v) => v.status === 'maintenance');

  const filtered = filter === 'all' ? vehicles :
    filter === 'available' ? available :
    filter === 'booked' ? booked :
    maintenance;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
            <h1 className="text-2xl font-black text-white tracking-tight">Fleet Overview</h1>
          </div>
          <p className="text-sm text-slate-400 pl-4">All vehicles in your fleet — availability, status, and details</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-500/25 transition-all active:scale-95 shrink-0">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: vehicles.length, color: '#14B8A6' },
            { label: 'Available', value: available.length, color: '#10B981' },
            { label: 'Booked', value: booked.length, color: '#3B82F6' },
            { label: 'Maintenance', value: maintenance.length, color: '#F59E0B' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[#0B101E] border border-teal-500/15 text-center">
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1 p-1 bg-[#0B101E] border border-white/[0.06] rounded-xl w-fit">
        {(['all', 'available', 'booked', 'maintenance'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Fleet Grid */}
      {loading ? (
        <SkeletonStatGrid count={6} columns={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchVehicles} />
      ) : filtered.length === 0 ? (
        <div className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/20">
          <EmptyState
            icon={CarFront}
            title={filter === 'all' ? 'No vehicles in fleet' : `No ${filter} vehicles`}
            description={filter === 'all' ? 'Add vehicles to start accepting rental bookings.' : `No vehicles are currently ${filter}.`}
            action={filter === 'all' ? { label: 'Add First Vehicle', onClick: () => {} } : undefined}
            accentColor="#14B8A6"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const isAvailable = v.availability && v.status !== 'maintenance';
            const isMaintenance = v.status === 'maintenance';
            return (
              <div key={v._id} className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/15 hover:border-teal-500/30 transition-all group space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <CarFront className="w-6 h-6 text-teal-400" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                    isMaintenance ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                    isAvailable ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                    'bg-blue-500/10 text-blue-300 border-blue-500/20'
                  }`}>
                    {isMaintenance ? 'Maintenance' : isAvailable ? 'Available' : 'Booked'}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">{v.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{v.registrationNumber} · {v.type}</p>
                  {v.year && <p className="text-[10px] text-slate-500 mt-1">{v.year} · {v.fuelType || 'Fuel'}</p>}
                </div>

                {/* Price + Action */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                  {v.pricePerDay ? (
                    <p className="text-sm font-black text-teal-300">₹{v.pricePerDay}<span className="text-[10px] font-normal text-slate-500">/day</span></p>
                  ) : <span />}
                  <button className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1">
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
