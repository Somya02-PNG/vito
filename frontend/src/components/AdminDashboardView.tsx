'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Car,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  BarChart3,
  UserCheck,
  AlertTriangle,
  Loader2,
  Shield,
  Check,
  X,
  Building,
  Key,
  Navigation,
  CreditCard,
  PhoneCall,
  Activity,
  UserX,
  Ban,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Eye,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';

const AdminAnalyticsCharts = dynamic(() => import('@/app/dashboard/admin/AdminAnalyticsCharts'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
export type AdminTab =
  | 'OVERVIEW'
  | 'USERS'
  | 'DRIVERS'
  | 'PARTNERS'
  | 'VEHICLES'
  | 'OPERATIONS'
  | 'PAYMENTS'
  | 'SAFETY';

interface AdminStatsResponse {
  users: {
    totalUsers: number;
    totalCustomers: number;
    totalDrivers: number;
    totalRentalPartners: number;
    totalAdmins: number;
    activeUsers: number;
    suspendedUsers: number;
    blockedUsers: number;
    pendingUsers: number;
  };
  drivers: {
    totalDrivers: number;
    verifiedDrivers: number;
    pendingVerification: number;
    rejectedDrivers: number;
    onlineDrivers: number;
  };
  partners: {
    totalPartners: number;
    verifiedPartners: number;
    pendingPartners: number;
  };
  vehicles: {
    totalVehicles: number;
    availableVehicles: number;
    currentlyRented: number;
    limitationNote: string;
  };
  operations: {
    rides: { active: number; requested: number; completed: number; cancelled: number };
    rentals: { active: number; pending: number; confirmed: number; completed: number; cancelled: number };
    driverHires: { pending: number; confirmed: number; inProgress: number; completed: number; cancelled: number };
  };
  financial: {
    totalCompletedTxns: number;
    totalGrossRevenue: number;
    platformCommission: number;
    driverPayouts: number;
  };
  safety: {
    activeSOSAlerts: number;
    sosPersistedNote: string;
    totalEmergencyContacts: number;
  };
}

interface ActivityItem {
  id: string;
  eventType: string;
  entity: string;
  userName: string;
  userEmail: string;
  recordId: string;
  status: string;
  timestamp: string;
  badgeColor: string;
}

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  partnerType?: string | null;
  status: string;
  createdAt: string;
}

interface DriverRecord {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  userStatus: string;
  licenseNumber: string;
  experience: number;
  hourlyRate: number;
  city: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  rating: number;
  availability: boolean;
  walletBalance: number;
  createdAt: string;
}

interface PartnerRecord {
  _id: string;
  userId?: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  userStatus: string;
  city: string;
  fleetCount: number;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  walletBalance: number;
  createdAt: string;
}

interface VehicleRecord {
  _id: string;
  category: string;
  fuelType: string;
  transmission: string;
  seats: number;
  pricePerDay: number;
  images?: string[];
  location?: { lat: number; lng: number };
  ownerId?: { _id?: string; name?: string; email?: string; role?: string };
  rating: number;
  deliveryAvailable: boolean;
  createdAt?: string;
}

interface PaymentRecord {
  _id: string;
  transactionRef: string;
  bookingId: string;
  bookingType: string;
  payerId?: { name?: string; email?: string };
  driverId?: { licenseNumber?: string; hourlyRate?: number };
  totalFare: number;
  commissionRate: number;
  platformCommission: number;
  driverPayout: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

interface SafetyContactRecord {
  _id: string;
  contactName: string;
  phone: string;
  relationship: string;
  userId?: { name?: string; email?: string; status?: string };
  createdAt: string;
}

export function AdminDashboardView({ defaultTab = 'OVERVIEW' }: { defaultTab?: AdminTab }) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab);

  // Stats Data
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Activity Stream Data
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Tab Table Data
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [operations, setOperations] = useState<{ rides: any[]; rentals: any[]; hires: any[] }>({ rides: [], rentals: [], hires: [] });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [safetyContacts, setSafetyContacts] = useState<SafetyContactRecord[]>([]);
  const [safetyNote, setSafetyNote] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [opTypeFilter, setOpTypeFilter] = useState('all');
  const [opStatusFilter, setOpStatusFilter] = useState('all');

  // Loading States
  const [loadingTable, setLoadingTable] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal / Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    actionColor: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: 'Confirm',
    actionColor: 'bg-violet-600',
    onConfirm: async () => {},
  });

  // Alert Banner State
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Core Stats
  const loadAdminStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetchAPI<{ data: AdminStatsResponse }>('/api/admin/stats');
      if (res.data) setStats(res.data as any);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err?.message || 'Failed to connect to Admin Stats API' });
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Activity Feed
  const loadRecentActivity = async () => {
    setLoadingActivity(true);
    try {
      const res = await fetchAPI<{ activity: ActivityItem[] }>('/api/admin/activity');
      if (res.data?.activity) setActivities(res.data.activity);
    } catch {
      setActivities([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Load Tab Specific Data
  const loadTabData = async () => {
    setLoadingTable(true);
    try {
      if (activeTab === 'USERS') {
        const query = new URLSearchParams();
        if (roleFilter !== 'all') query.set('role', roleFilter);
        if (statusFilter !== 'all') query.set('status', statusFilter);
        if (searchTerm.trim()) query.set('search', searchTerm.trim());

        const res = await fetchAPI<{ users: UserRecord[] }>(`/api/admin/users?${query.toString()}`);
        setUsers(res.data?.users || []);
      } else if (activeTab === 'DRIVERS') {
        const query = new URLSearchParams();
        if (statusFilter !== 'all') query.set('status', statusFilter);
        if (searchTerm.trim()) query.set('search', searchTerm.trim());

        const res = await fetchAPI<{ drivers: DriverRecord[] }>(`/api/admin/drivers?${query.toString()}`);
        setDrivers(res.data?.drivers || []);
      } else if (activeTab === 'PARTNERS') {
        const query = new URLSearchParams();
        if (statusFilter !== 'all') query.set('status', statusFilter);
        if (searchTerm.trim()) query.set('search', searchTerm.trim());

        const res = await fetchAPI<{ partners: PartnerRecord[] }>(`/api/admin/partners?${query.toString()}`);
        setPartners(res.data?.partners || []);
      } else if (activeTab === 'VEHICLES') {
        const query = new URLSearchParams();
        if (searchTerm.trim()) query.set('search', searchTerm.trim());

        const res = await fetchAPI<{ vehicles: VehicleRecord[] }>(`/api/admin/vehicles?${query.toString()}`);
        setVehicles(res.data?.vehicles || []);
      } else if (activeTab === 'OPERATIONS') {
        const query = new URLSearchParams();
        if (opTypeFilter !== 'all') query.set('type', opTypeFilter);
        if (opStatusFilter !== 'all') query.set('status', opStatusFilter);

        const res = await fetchAPI<{ rides: any[]; rentals: any[]; hires: any[] }>(`/api/admin/operations?${query.toString()}`);
        setOperations(res.data || { rides: [], rentals: [], hires: [] });
      } else if (activeTab === 'PAYMENTS') {
        const query = new URLSearchParams();
        if (searchTerm.trim()) query.set('search', searchTerm.trim());

        const res = await fetchAPI<{ payments: PaymentRecord[] }>(`/api/admin/payments?${query.toString()}`);
        setPayments(res.data?.payments || []);
      } else if (activeTab === 'SAFETY') {
        const res = await fetchAPI<{ contacts: SafetyContactRecord[]; sosNote: string }>('/api/admin/safety');
        setSafetyContacts(res.data?.contacts || []);
        if (res.data?.sosNote) setSafetyNote(res.data.sosNote);
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err?.message || `Failed to fetch ${activeTab} data` });
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    loadAdminStats();
    loadRecentActivity();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab, roleFilter, statusFilter, opTypeFilter, opStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (['USERS', 'DRIVERS', 'PARTNERS', 'VEHICLES', 'PAYMENTS'].includes(activeTab)) {
        loadTabData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleVerifyDriverAction = async (driverId: string, status: 'verified' | 'rejected' | 'suspended' | 'pending') => {
    try {
      await fetchAPI(`/api/admin/drivers/${driverId}/verify`, {
        method: 'PATCH',
        body: { status },
      });
      setAlertMsg({ type: 'success', text: `Driver application successfully updated to ${status.toUpperCase()}!` });
      loadTabData();
      loadAdminStats();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err?.message || 'Failed to update driver status' });
    }
  };

  const handleVerifyPartnerAction = async (partnerId: string, status: 'verified' | 'rejected' | 'suspended' | 'pending') => {
    try {
      await fetchAPI(`/api/admin/partners/${partnerId}/verify`, {
        method: 'PATCH',
        body: { status },
      });
      setAlertMsg({ type: 'success', text: `Partner application successfully updated to ${status.toUpperCase()}!` });
      loadTabData();
      loadAdminStats();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err?.message || 'Failed to update partner status' });
    }
  };

  const handleUpdateUserStatusAction = async (userId: string, status: string) => {
    try {
      await fetchAPI(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: { status },
      });
      setAlertMsg({ type: 'success', text: `User account status updated to ${status.toUpperCase()}!` });
      loadTabData();
      loadAdminStats();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err?.message || 'Failed to update user status' });
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen pb-16 bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[10px] font-extrabold text-violet-400 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3 text-violet-400" /> VITO OPERATIONS CENTER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin <span style={{ background: 'linear-gradient(135deg, #a855f7, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Control Center</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { loadAdminStats(); loadRecentActivity(); loadTabData(); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {alertMsg && (
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-start justify-between gap-3 ${
            alertMsg.type === 'success' ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300' : 'bg-red-950/40 border border-red-800/40 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mb-6 border-b border-white/[0.08] pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: BarChart3 },
            { id: 'USERS', label: `Users (${stats?.users?.totalUsers ?? '—'})`, icon: Users },
            { id: 'DRIVERS', label: `Drivers (${stats?.drivers?.totalDrivers ?? '—'})`, icon: UserCheck },
            { id: 'PARTNERS', label: `Partners (${stats?.partners?.totalPartners ?? '—'})`, icon: Building },
            { id: 'VEHICLES', label: `Vehicles (${stats?.vehicles?.totalVehicles ?? '—'})`, icon: Car },
            { id: 'OPERATIONS', label: 'Operations', icon: Navigation },
            { id: 'PAYMENTS', label: 'Payments', icon: CreditCard },
            { id: 'SAFETY', label: 'Safety SOS', icon: ShieldAlert },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id as AdminTab); setSearchTerm(''); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-lg shadow-violet-900/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content: OVERVIEW ── */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Users</span>
                <span className="text-xl font-extrabold text-white">{stats?.users?.totalUsers ?? '—'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Active Drivers</span>
                <span className="text-xl font-extrabold text-cyan-400">{stats?.drivers?.verifiedDrivers ?? '—'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pending Approvals</span>
                <span className="text-xl font-extrabold text-amber-400">{(stats?.drivers?.pendingVerification ?? 0) + (stats?.partners?.pendingPartners ?? 0)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20">
                <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider block mb-1">Platform Commission</span>
                <span className="text-xl font-extrabold text-violet-300">₹{(stats?.financial?.platformCommission ?? 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Platform Activity</h3>
              <div className="space-y-2">
                {activities.slice(0, 5).map((act, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] text-xs">
                    <span className="text-white font-medium">{act.userName} — {act.eventType} ({act.entity})</span>
                    <span className="text-slate-500 text-[10px]">{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: DRIVERS (Admin Approval Workflow) ── */}
        {activeTab === 'DRIVERS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search driver by name / license..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {(['all', 'pending', 'verified', 'rejected', 'suspended'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      statusFilter === st
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingTable ? (
              <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                <span className="text-xs">Loading drivers registry...</span>
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] text-slate-400 text-xs">
                No driver applications match the selected filter.
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.01]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.04] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                      <tr>
                        <th className="py-3.5 px-4 font-semibold">Driver Details</th>
                        <th className="py-3.5 px-4 font-semibold">License & City</th>
                        <th className="py-3.5 px-4 font-semibold">Experience</th>
                        <th className="py-3.5 px-4 font-semibold">Status</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Approval Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {drivers.map((d) => (
                        <tr key={d._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">{d.name}</p>
                            <p className="text-slate-400 text-[11px]">{d.email} · {d.phone}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-200">{d.licenseNumber}</p>
                            <p className="text-slate-500 text-[10px]">{d.city || 'Delhi NCR'}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {d.experience} Yrs · ₹{d.hourlyRate}/hr
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              d.verificationStatus === 'verified'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : d.verificationStatus === 'pending'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : d.verificationStatus === 'suspended'
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : 'bg-red-500/15 text-red-300 border border-red-500/30'
                            }`}>
                              {d.verificationStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {d.verificationStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleVerifyDriverAction(d._id, 'verified')}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleVerifyDriverAction(d._id, 'rejected')}
                                    className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-[11px] transition-all"
                                  >
                                    ✗ Reject
                                  </button>
                                </>
                              )}
                              {d.verificationStatus === 'verified' && (
                                <button
                                  onClick={() => handleVerifyDriverAction(d._id, 'suspended')}
                                  className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold text-[11px] transition-all"
                                >
                                  Suspend
                                </button>
                              )}
                              {(d.verificationStatus === 'suspended' || d.verificationStatus === 'rejected') && (
                                <button
                                  onClick={() => handleVerifyDriverAction(d._id, 'verified')}
                                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] transition-all"
                                >
                                  Re-Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab Content: USERS ── */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.01]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-slate-400 text-[11px]">{u.email}</p>
                      </td>
                      <td className="py-3 px-4 uppercase text-slate-300">{u.role}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateUserStatusAction(u._id, 'active')}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminDashboardView;
