'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LifeBuoy, MessageSquare, Ticket, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface SupportTicket {
  _id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  userName?: string;
  userRole?: string;
  createdAt: string;
  updatedAt?: string;
}

const STATUS_MAP = {
  open: { label: 'Open', class: 'bg-amber-500/10 text-amber-300 border-amber-500/20', icon: Clock },
  in_progress: { label: 'In Progress', class: 'bg-blue-500/10 text-blue-300 border-blue-500/20', icon: AlertCircle },
  resolved: { label: 'Resolved', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', icon: CheckCircle2 },
  closed: { label: 'Closed', class: 'bg-slate-500/10 text-slate-300 border-slate-500/20', icon: CheckCircle2 },
};

const PRIORITY_MAP = {
  high: 'bg-red-500/10 text-red-300 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

function SupportContent() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'open' | 'resolved'>('all');

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ tickets: SupportTicket[] }>('/api/admin/support/tickets');
      setTickets(res.data?.tickets || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tab === 'all' ? tickets
    : tab === 'open' ? tickets.filter((t) => ['open', 'in_progress'].includes(t.status))
    : tickets.filter((t) => ['resolved', 'closed'].includes(t.status));

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length,
    resolved: tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-violet-500 to-violet-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Support Center</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Platform support tickets and user messages</p>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Tickets', value: counts.all, color: '#8B5CF6' },
            { label: 'Open', value: counts.open, color: '#F59E0B' },
            { label: 'Resolved', value: counts.resolved, color: '#10B981' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[#0B0F1C] border border-violet-500/15 text-center">
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 p-1 bg-[#0B0F1C] border border-white/[0.06] rounded-xl w-fit">
        {(['all', 'open', 'resolved'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            {t}
            {counts[t] > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t ? 'bg-white/20' : 'bg-white/5'}`}>{counts[t]}</span>}
          </button>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-[#0B0F1C] border border-violet-500/20">
        {loading ? <SkeletonList count={5} /> : error ? (
          <ErrorState message={error} onRetry={fetchTickets} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={LifeBuoy} title={tab === 'all' ? 'No support tickets' : `No ${tab} tickets`} description="Support tickets from users across all roles will appear here." accentColor="#8B5CF6" />
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => {
              const statusConf = STATUS_MAP[t.status] ?? STATUS_MAP.open;
              const StatusIcon = statusConf.icon;
              return (
                <div key={t._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-white truncate">{t.subject}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusConf.class}`}>{statusConf.label}</span>
                      {t.priority && <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${PRIORITY_MAP[t.priority]}`}>{t.priority}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {t.userName && <p className="text-[11px] text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />{t.userName}</p>}
                      <p className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <SupportContent />
    </ProtectedRoute>
  );
}
