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

        {activeTab === 'OVERVIEW' && (
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
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Fleet Vehicles</span>
              <span className="text-xl font-extrabold text-white">{stats?.vehicles?.totalVehicles ?? '—'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20">
              <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider block mb-1">Platform Commission</span>
              <span className="text-xl font-extrabold text-violet-300">₹{(stats?.financial?.platformCommission ?? 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminDashboardView;
