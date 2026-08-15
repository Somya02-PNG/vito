'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus, Car } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface MaintenanceRecord {
  _id: string;
  vehicleName?: string;
  vehicle?: { name: string; registrationNumber: string };
  type: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  scheduledDate?: string;
  completedDate?: string;
  description?: string;
  cost?: number;
}

const STATUS_MAP = {
  scheduled: { label: 'Scheduled', class: 'bg-amber-500/10 text-amber-300 border-amber-500/20', icon: Clock },
  in_progress: { label: 'In Progress', class: 'bg-blue-500/10 text-blue-300 border-blue-500/20', icon: Wrench },
  completed: { label: 'Completed', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', icon: CheckCircle2 },
};

export default function PartnerMaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ records: MaintenanceRecord[] }>('/api/vehicles/maintenance/partner');
      setRecords(res.data?.records || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const scheduled = records.filter((r) => r.status === 'scheduled').length;
  const inProgress = records.filter((r) => r.status === 'in_progress').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
            <h1 className="text-2xl font-black text-white tracking-tight">Maintenance</h1>
          </div>
          <p className="text-sm text-slate-400 pl-4">Fleet maintenance schedules and service records</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-500/25 transition-all active:scale-95 shrink-0">
          <Plus className="w-4 h-4" />
          Schedule Service
        </button>
      </div>

      {!loading && !error && (scheduled > 0 || inProgress > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            <strong>{scheduled} scheduled</strong> and <strong>{inProgress} in-progress</strong> maintenance tasks require attention.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Scheduled', value: scheduled, color: '#F59E0B' },
            { label: 'In Progress', value: inProgress, color: '#3B82F6' },
            { label: 'Completed', value: records.filter((r) => r.status === 'completed').length, color: '#10B981' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[#0B101E] border border-teal-500/15 text-center">
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-2">
        {loading ? <SkeletonList count={4} /> : error ? (
          <ErrorState message={error} onRetry={fetchRecords} />
        ) : records.length === 0 ? (
          <EmptyState icon={Wrench} title="No maintenance records" description="Schedule vehicle service to keep your fleet in top condition and avoid costly breakdowns." accentColor="#14B8A6" />
        ) : records.map((r) => {
          const status = STATUS_MAP[r.status] ?? STATUS_MAP.scheduled;
          const StatusIcon = status.icon;
          const vehicleName = r.vehicle?.name || r.vehicleName || 'Vehicle';
          return (
            <div key={r._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Car className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white">{vehicleName}</p>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${status.class}`}>{status.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{r.type} {r.description ? `· ${r.description}` : ''}</p>
                {r.scheduledDate && (
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(r.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              {r.cost && <p className="text-sm font-black text-white shrink-0">₹{r.cost.toFixed(0)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
