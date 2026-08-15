'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Users, Phone, Mail, Car, Star, ChevronRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  totalBookings?: number;
  lastBookingDate?: string;
  rating?: number;
}

export default function PartnerCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ customers: Customer[] }>('/api/partner/customers');
      setCustomers(res.data?.customers || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Customers</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Customers who have booked your fleet</p>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-teal-500/15 text-center">
            <p className="text-xl font-black text-teal-400">{customers.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total Customers</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B101E] border border-teal-500/15 text-center">
            <p className="text-xl font-black text-white">
              {customers.reduce((s, c) => s + (c.totalBookings ?? 0), 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total Bookings</p>
          </div>
        </div>
      )}

      <div className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-2">
        {loading ? <SkeletonList count={5} /> : error ? (
          <ErrorState message={error} onRetry={fetchCustomers} />
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" description="When customers book your vehicles, they'll appear here with booking history." accentColor="#14B8A6" />
        ) : customers.map((c) => (
          <div key={c._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-sm font-black text-teal-400 shrink-0">
              {c.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">{c.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{c.email || c.phone || '—'}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-white">{c.totalBookings ?? 0} bookings</p>
              {c.lastBookingDate && <p className="text-[10px] text-slate-500">{new Date(c.lastBookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
