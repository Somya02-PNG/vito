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

const AdminAnalyticsCharts = dynamic(() => import('./AdminAnalyticsCharts'), { ssr: false });

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

export default function AdminDashboardPage({ defaultTab = 'OVERVIEW' }: { defaultTab?: AdminTab }) {
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

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (['USERS', 'DRIVERS', 'PARTNERS', 'VEHICLES', 'PAYMENTS'].includes(activeTab)) {
        loadTabData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  // User Status Change
  const triggerUserStatusChange = (userId: string, userName: string, targetStatus: string) => {
    if (currentUser?.id === userId) {
      setAlertMsg({ type: 'error', text: 'Action denied: You cannot change your own administrator account status.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Set User Status to ${targetStatus.toUpperCase()}`,
      description: `Are you sure you want to change the status of ${userName} to ${targetStatus}?`,
      actionLabel: `Set ${targetStatus.toUpperCase()}`,
      actionColor: targetStatus === 'blocked' ? 'bg-red-600 hover:bg-red-500' : targetStatus === 'suspended' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500',
      onConfirm: async () => {
        setActionLoadingId(userId);
        try {
          await fetchAPI(`/api/admin/users/${userId}/status`, {
            method: 'PATCH',
            body: { status: targetStatus },
          });
          setAlertMsg({ type: 'success', text: `User ${userName} status set to ${targetStatus}.` });
          loadTabData();
          loadAdminStats();
        } catch (err: any) {
          setAlertMsg({ type: 'error', text: err?.message || 'Failed to update user status' });
        } finally {
          setActionLoadingId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Driver Verification Action
  const triggerDriverVerification = (driverId: string, driverName: string, targetStatus: 'verified' | 'rejected' | 'suspended') => {
    setConfirmModal({
      isOpen: true,
      title: `Driver Verification: ${targetStatus.toUpperCase()}`,
      description: `Set verification status of ${driverName} to ${targetStatus.toUpperCase()}?`,
      actionLabel: `Confirm ${targetStatus.toUpperCase()}`,
      actionColor: targetStatus === 'verified' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500',
      onConfirm: async () => {
        setActionLoadingId(driverId);
        try {
          await fetchAPI(`/api/admin/drivers/${driverId}/verify`, {
            method: 'PATCH',
            body: { status: targetStatus },
          });
          setAlertMsg({ type: 'success', text: `Driver ${driverName} set to ${targetStatus}.` });
          loadTabData();
          loadAdminStats();
        } catch (err: any) {
          setAlertMsg({ type: 'error', text: err?.message || 'Failed to update driver status' });
        } finally {
          setActionLoadingId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Partner Verification Action
  const triggerPartnerVerification = (partnerId: string, partnerName: string, targetStatus: 'verified' | 'rejected' | 'suspended') => {
    setConfirmModal({
      isOpen: true,
      title: `Partner Verification: ${targetStatus.toUpperCase()}`,
      description: `Set rental partner verification status of ${partnerName} to ${targetStatus.toUpperCase()}?`,
      actionLabel: `Confirm ${targetStatus.toUpperCase()}`,
      actionColor: targetStatus === 'verified' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500',
      onConfirm: async () => {
        setActionLoadingId(partnerId);
        try {
          await fetchAPI(`/api/admin/partners/${partnerId}/verify`, {
            method: 'PATCH',
            body: { status: targetStatus },
          });
          setAlertMsg({ type: 'success', text: `Rental partner ${partnerName} set to ${targetStatus}.` });
          loadTabData();
          loadAdminStats();
        } catch (err: any) {
          setAlertMsg({ type: 'error', text: err?.message || 'Failed to update partner status' });
        } finally {
          setActionLoadingId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="relative overflow-hidden min-h-screen pb-16 bg-[#07090E]">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] bg-gradient-radial from-violet-900/15 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-6">

        {/* ════════════════════════════════════════════════════════════════════
            HEADER & REFRESH BUTTON
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[10px] font-extrabold text-violet-400 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3 text-violet-400" /> VITO OPERATIONS CENTER
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                REAL MONGODB BACKEND
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
              Refresh Database Data
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ALERT MESSAGES
        ════════════════════════════════════════════════════════════════════ */}
        {alertMsg && (
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-start justify-between gap-3 animate-in fade-in duration-200 ${
            alertMsg.type === 'success' ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300' : 'bg-red-950/40 border border-red-800/40 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            NAVIGATION TAB BAR
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-1.5 mb-6 border-b border-white/[0.08] pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: BarChart3 },
            { id: 'USERS', label: `Users (${stats?.users?.totalUsers ?? '—'})`, icon: Users },
            { id: 'DRIVERS', label: `Drivers (${stats?.drivers?.totalDrivers ?? '—'})`, icon: UserCheck, badge: stats?.drivers?.pendingVerification },
            { id: 'PARTNERS', label: `Partners (${stats?.partners?.totalPartners ?? '—'})`, icon: Building, badge: stats?.partners?.pendingPartners },
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
                {t.badge && t.badge > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold animate-pulse">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW (STATS + ACTIVITY STREAM)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">

            {/* 6 TOP REAL METRIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Users</span>
                <span className="text-xl font-extrabold text-white">{stats?.users?.totalUsers ?? '—'}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{stats?.users?.totalCustomers ?? 0} Customers · {stats?.users?.totalDrivers ?? 0} Drivers</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Active Drivers</span>
                <span className="text-xl font-extrabold text-cyan-400">{stats?.drivers?.verifiedDrivers ?? '—'}</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">{stats?.drivers?.onlineDrivers ?? 0} Online Duty</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Fleet Vehicles</span>
                <span className="text-xl font-extrabold text-white">{stats?.vehicles?.totalVehicles ?? '—'}</span>
                <span className="text-[10px] text-amber-400 block mt-0.5">{stats?.vehicles?.currentlyRented ?? 0} Currently Rented</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Completed Txns</span>
                <span className="text-xl font-extrabold text-emerald-400">{stats?.financial?.totalCompletedTxns ?? '—'}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Paid Bookings</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Gross Revenue</span>
                <span className="text-xl font-extrabold text-emerald-400">₹{(stats?.financial?.totalGrossRevenue ?? 0).toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Total Fares Collected</span>
              </div>

              <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20">
                <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider block mb-1">Platform Commission</span>
                <span className="text-xl font-extrabold text-violet-300">₹{(stats?.financial?.platformCommission ?? 0).toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-violet-400 block mt-0.5">18% VITO Cut</span>
              </div>
            </div>

            {/* TWO COLUMN LAYOUT: REAL ACTIVITY FEED + SYSTEM STATUS */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

              {/* REAL ACTIVITY FEED */}
              <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
                    Real-Time Activity Feed (MongoDB)
                  </h3>
                  <span className="text-[11px] text-slate-500">Sorted Newest First</span>
                </div>

                {loadingActivity ? (
                  <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                    Querying live activity from MongoDB...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                    No activity recorded in database yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold shrink-0">
                            {act.entity[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {act.eventType}
                              <span className="text-[10px] text-slate-500 font-mono">#{act.recordId.slice(-6)}</span>
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              {act.userName} {act.userEmail && `· ${act.userEmail}`}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.06] border border-white/[0.08] text-slate-300 uppercase tracking-wider block w-fit ml-auto mb-1">
                            {act.status}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SYSTEM HEALTH & LIMITATION NOTES */}
              <div className="space-y-4">
                <div className="glass-panel p-5 rounded-2xl space-y-3 border-violet-500/20">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Database Schema Status
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-slate-400 font-medium block mb-0.5">Database:</span>
                      <span className="font-bold text-emerald-400 font-mono">vito_db (MongoDB Atlas)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-slate-400 font-medium block mb-0.5">Active Collections:</span>
                      <span className="font-bold text-white font-mono">11/11 Collections In Use</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                      <span className="text-amber-300 font-bold block mb-0.5">Schema Limitation Note:</span>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        Vehicle schema uses <code className="text-amber-300 font-mono">deliveryAvailable</code> for availability. Verification status is not present on Vehicle schema.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                      <span className="text-amber-300 font-bold block mb-0.5">SOS Alerts Note:</span>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        SOS triggers execute in-memory alerts to emergency contacts. Active SOS records are not stored in a separate collection.
                      </p>
                    </div>
                  </div>
                </div>

                {/* USER BREAKDOWN SUMMARY */}
                <div className="glass-panel p-5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-bold text-white">Users Status Breakdown</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-emerald-300 font-medium">Active Accounts</span>
                      <span className="font-bold text-emerald-400">{stats?.users?.activeUsers ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-amber-300 font-medium">Pending Approvals</span>
                      <span className="font-bold text-amber-400">{stats?.users?.pendingUsers ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <span className="text-orange-300 font-medium">Suspended Accounts</span>
                      <span className="font-bold text-orange-400">{stats?.users?.suspendedUsers ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="text-red-300 font-medium">Blocked Accounts</span>
                      <span className="font-bold text-red-400">{stats?.users?.blockedUsers ?? 0}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: USER MANAGEMENT
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'USERS' && (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-violet-400" />
                  User Management Directory ({users.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage customer, driver, partner, and administrator accounts</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, email, phone..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customer</option>
                  <option value="partner">Partner</option>
                  <option value="driver">Driver (Legacy)</option>
                  <option value="admin">Admin</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loadingTable ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                No users found matching query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">User Info</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Joined</th>
                      <th className="p-3 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {currentUser?.id === u._id && (
                              <span className="px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 text-[9px]">YOU</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="p-3 font-mono">{u.phone}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/25 text-[10px] font-bold text-violet-300 capitalize">
                            {u.role} {u.partnerType && `(${u.partnerType})`}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                            u.status === 'pending' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' :
                            u.status === 'suspended' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                            'bg-red-500/15 text-red-400 border border-red-500/25'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3 text-right">
                          {actionLoadingId === u._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400 ml-auto" />
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {u.status !== 'active' && (
                                <button
                                  onClick={() => triggerUserStatusChange(u._id, u.name, 'active')}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all"
                                >
                                  Activate
                                </button>
                              )}
                              {u.status !== 'suspended' && (
                                <button
                                  onClick={() => triggerUserStatusChange(u._id, u.name, 'suspended')}
                                  disabled={currentUser?.id === u._id}
                                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-all disabled:opacity-30"
                                >
                                  Suspend
                                </button>
                              )}
                              {u.status !== 'blocked' && (
                                <button
                                  onClick={() => triggerUserStatusChange(u._id, u.name, 'blocked')}
                                  disabled={currentUser?.id === u._id}
                                  className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold transition-all disabled:opacity-30"
                                >
                                  Block
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: DRIVER MANAGEMENT
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'DRIVERS' && (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-violet-400" />
                  Driver Partners Directory ({drivers.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Approve, reject, or suspend driver partner applications</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, license, city..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none"
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {loadingTable ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                Loading driver records...
              </div>
            ) : drivers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                No driver records found matching query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Driver Name</th>
                      <th className="p-3">License No.</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Experience</th>
                      <th className="p-3">Hourly Rate</th>
                      <th className="p-3">Wallet</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {drivers.map((d) => (
                      <tr key={d._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white">{d.name}</div>
                          <div className="text-[10px] text-slate-500">{d.email} · {d.phone}</div>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-300">{d.licenseNumber}</td>
                        <td className="p-3 text-slate-300">{d.city || 'NCR'}</td>
                        <td className="p-3 font-semibold text-slate-300">{d.experience} Yrs</td>
                        <td className="p-3 font-bold text-white">₹{d.hourlyRate}/hr</td>
                        <td className="p-3 font-bold text-emerald-400">₹{(d.walletBalance || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            d.verificationStatus === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                            d.verificationStatus === 'pending' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25 animate-pulse' :
                            d.verificationStatus === 'suspended' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                            'bg-red-500/15 text-red-400 border border-red-500/25'
                          }`}>
                            {d.verificationStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {actionLoadingId === d._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400 ml-auto" />
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {d.verificationStatus !== 'verified' && (
                                <button
                                  onClick={() => triggerDriverVerification(d._id, d.name, 'verified')}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all"
                                >
                                  Approve
                                </button>
                              )}
                              {d.verificationStatus !== 'rejected' && (
                                <button
                                  onClick={() => triggerDriverVerification(d._id, d.name, 'rejected')}
                                  className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold transition-all"
                                >
                                  Reject
                                </button>
                              )}
                              {d.verificationStatus !== 'suspended' && (
                                <button
                                  onClick={() => triggerDriverVerification(d._id, d.name, 'suspended')}
                                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-all"
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: PARTNER MANAGEMENT
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'PARTNERS' && (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-4.5 h-4.5 text-violet-400" />
                  Rental Partner Directory ({partners.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage rental business partner applications and fleet owners</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search partner, business, city..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none"
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {loadingTable ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                Loading rental partners...
              </div>
            ) : partners.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                No rental partner records found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Partner / Business</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Fleet Count</th>
                      <th className="p-3">Wallet</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {partners.map((p) => (
                      <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white">{p.businessName}</div>
                          <div className="text-[10px] text-slate-400">Owner: {p.name}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px]">{p.phone} · {p.email}</td>
                        <td className="p-3 text-slate-300">{p.city || 'NCR'}</td>
                        <td className="p-3 font-bold text-white">{p.fleetCount} Vehicles</td>
                        <td className="p-3 font-bold text-emerald-400">₹{(p.walletBalance || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.verificationStatus === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                            p.verificationStatus === 'pending' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25 animate-pulse' :
                            p.verificationStatus === 'suspended' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                            'bg-red-500/15 text-red-400 border border-red-500/25'
                          }`}>
                            {p.verificationStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {actionLoadingId === p._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400 ml-auto" />
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {p.verificationStatus !== 'verified' && (
                                <button
                                  onClick={() => triggerPartnerVerification(p._id, p.businessName, 'verified')}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all"
                                >
                                  Verify
                                </button>
                              )}
                              {p.verificationStatus !== 'rejected' && (
                                <button
                                  onClick={() => triggerPartnerVerification(p._id, p.businessName, 'rejected')}
                                  className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold transition-all"
                                >
                                  Reject
                                </button>
                              )}
                              {p.verificationStatus !== 'suspended' && (
                                <button
                                  onClick={() => triggerPartnerVerification(p._id, p.businessName, 'suspended')}
                                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-all"
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 5: VEHICLE FLEET MANAGEMENT
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'VEHICLES' && (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Car className="w-4.5 h-4.5 text-violet-400" />
                  Vehicles Fleet Inventory ({vehicles.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Self-drive vehicles registered in MongoDB database</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search category, fuel, owner..."
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            {loadingTable ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                Loading vehicles...
              </div>
            ) : vehicles.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                No vehicles found matching query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Category</th>
                      <th className="p-3">Fuel & Specs</th>
                      <th className="p-3">Transmission</th>
                      <th className="p-3">Daily Rate</th>
                      <th className="p-3">Delivery</th>
                      <th className="p-3">Owner</th>
                      <th className="p-3 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {vehicles.map((v) => (
                      <tr key={v._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-bold text-white capitalize">{v.category}</td>
                        <td className="p-3 capitalize">{v.fuelType} · {v.seats} Seats</td>
                        <td className="p-3 capitalize">{v.transmission}</td>
                        <td className="p-3 font-extrabold text-emerald-400">₹{v.pricePerDay.toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          {v.deliveryAvailable ? (
                            <span className="text-emerald-400 font-medium">✓ Available</span>
                          ) : (
                            <span className="text-slate-500">Self Pickup</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">{v.ownerId?.name || 'Admin / VITO Host'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-bold text-emerald-400">
                            Available
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 6: OPERATIONS CENTER (RIDES, RENTALS, HIRES)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'OPERATIONS' && (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Navigation className="w-4.5 h-4.5 text-violet-400" />
                  Operations Control Center
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Live monitoring of Cab Rides, Self-Drive Rentals, and Driver Hires</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={opTypeFilter}
                  onChange={(e) => setOpTypeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none"
                >
                  <option value="all">All Service Types</option>
                  <option value="rides">Cab Rides</option>
                  <option value="rentals">Self-Drive Rentals</option>
                  <option value="hires">Driver Hires</option>
                </select>

                <select
                  value={opStatusFilter}
                  onChange={(e) => setOpStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted / Confirmed</option>
                  <option value="in_progress">In Progress / Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {loadingTable ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                Querying live operations records...
              </div>
            ) : (
              <div className="space-y-6">
                {/* CAB RIDES */}
                {(opTypeFilter === 'all' || opTypeFilter === 'rides') && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-cyan-400" /> Cab Rides ({operations.rides.length})
                    </h4>
                    {operations.rides.length === 0 ? (
                      <p className="text-xs text-slate-500 p-3 rounded-xl bg-white/[0.02]">No cab rides matching filter.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {operations.rides.map((r: any) => (
                          <div key={r._id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">Rider: {r.riderId?.name || 'Rider'}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 uppercase">
                                {r.status}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] space-y-0.5">
                              <div>📍 Pickup: {r.pickup?.address || 'Pickup Point'}</div>
                              <div>🏁 Drop: {r.drop?.address || 'Drop Point'}</div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                              <span className="font-extrabold text-emerald-400 text-sm">₹{r.fare}</span>
                              <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SELF-DRIVE RENTALS */}
                {(opTypeFilter === 'all' || opTypeFilter === 'rentals') && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-amber-400" /> Self-Drive Rentals ({operations.rentals.length})
                    </h4>
                    {operations.rentals.length === 0 ? (
                      <p className="text-xs text-slate-500 p-3 rounded-xl bg-white/[0.02]">No rentals matching filter.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {operations.rentals.map((r: any) => (
                          <div key={r._id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">Customer: {r.userId?.name || 'Customer'}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/25 text-amber-300 uppercase">
                                {r.status}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              Vehicle: <strong className="text-white capitalize">{r.vehicleId?.category || 'Vehicle'}</strong> (₹{r.vehicleId?.pricePerDay || 0}/day)
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                              <span className="font-extrabold text-emerald-400">Deposit: ₹{r.depositAmount} ({r.depositStatus})</span>
                              <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DRIVER HIRES */}
                {(opTypeFilter === 'all' || opTypeFilter === 'hires') && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-violet-400" /> Driver Hires ({operations.hires.length})
                    </h4>
                    {operations.hires.length === 0 ? (
                      <p className="text-xs text-slate-500 p-3 rounded-xl bg-white/[0.02]">No driver hires matching filter.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {operations.hires.map((h: any) => (
                          <div key={h._id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">Customer: {h.userId?.name || 'Customer'}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/15 border border-violet-500/25 text-violet-300 uppercase">
                                {h.status}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              Hired Driver: <strong className="text-white">{h.driverName}</strong> ({h.hours} Hours Duty)
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                              <span className="font-extrabold text-emerald-400 text-sm">₹{h.totalFare}</span>
                              <span className="text-[10px] text-slate-500">{new Date(h.createdAt).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 7: PAYMENTS LEDGER
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'PAYMENTS' && (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4.5 h-4.5 text-emerald-400" />
                    Payments & Commission Engine Ledger ({payments.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300">
                    SIMULATED PAYMENT ENGINE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Calculates 18% VITO commission and credits 82% to driver in-app wallet balance</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transaction ref, payer..."
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            {loadingTable ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                Loading payment records...
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                No payment transactions found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Txn Ref</th>
                      <th className="p-3">Booking Type</th>
                      <th className="p-3">Payer</th>
                      <th className="p-3">Total Fare</th>
                      <th className="p-3">Platform Cut (18%)</th>
                      <th className="p-3">Driver Payout (82%)</th>
                      <th className="p-3">Method</th>
                      <th className="p-3 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono font-bold text-white">{p.transactionRef}</td>
                        <td className="p-3 capitalize font-semibold text-slate-300">{p.bookingType}</td>
                        <td className="p-3 text-slate-300">{p.payerId?.name || 'Payer'}</td>
                        <td className="p-3 font-extrabold text-white">₹{p.totalFare.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-violet-300">₹{p.platformCommission.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-emerald-400">₹{p.driverPayout.toLocaleString('en-IN')}</td>
                        <td className="p-3 uppercase font-mono text-[11px]">{p.paymentMethod}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-bold text-emerald-400 uppercase">
                            {p.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 8: SAFETY & EMERGENCY CONTACTS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'SAFETY' && (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
                  Safety & Emergency Contacts Directory ({safetyContacts.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Trusted SOS numbers saved by platform customers</p>
              </div>
            </div>

            {/* Note on SOS persistence */}
            {safetyNote && (
              <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300">Architecture Note:</strong> {safetyNote}
                </div>
              </div>
            )}

            {loadingTable ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                Loading emergency contacts...
              </div>
            ) : safetyContacts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                No emergency contacts registered in database yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Contact Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Relationship</th>
                      <th className="p-3">Belongs To User</th>
                      <th className="p-3 rounded-r-xl">Saved Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {safetyContacts.map((c) => (
                      <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-bold text-white">{c.contactName}</td>
                        <td className="p-3 font-mono text-emerald-400">{c.phone}</td>
                        <td className="p-3 text-slate-300">{c.relationship}</td>
                        <td className="p-3 text-slate-300">{c.userId?.name || 'Customer'} ({c.userId?.email || ''})</td>
                        <td className="p-3 text-slate-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CONFIRMATION DIALOG MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-glow rounded-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-extrabold text-white">{confirmModal.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{confirmModal.description}</p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg ${confirmModal.actionColor}`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
