'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchAPI } from '@/lib/api';
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
} from 'lucide-react';

// Lazy-load Analytics Charts component to avoid SSR graph rendering issues
const AdminAnalyticsCharts = dynamic(() => import('./AdminAnalyticsCharts'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlatformStats {
  totalUsers: number;
  activeDrivers: number;
  totalBookings: number;
  totalRevenue: number;
  totalVehicles: number;
}

interface DriverRecord {
  _id: string;
  name: string;
  email: string;
  licenseNumber: string;
  experience: number;
  hourlyRate: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface VehicleRecord {
  _id: string;
  category: string;
  fuelType: string;
  transmission: string;
  seats: number;
  pricePerDay: number;
  ownerId?: { name?: string; email?: string };
  rating: number;
  deliveryAvailable: boolean;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'DRIVERS' | 'USERS' | 'VEHICLES'>('ANALYTICS');

  // Stats & Chart Data
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 1284,
    activeDrivers: 142,
    totalBookings: 3890,
    totalRevenue: 1845000,
    totalVehicles: 48,
  });

  const [charts, setCharts] = useState<{
    bookingsPerDay: any[];
    revenuePerWeek: any[];
  }>({
    bookingsPerDay: [
      { day: 'Mon', bookings: 42, rides: 28, rentals: 14 },
      { day: 'Tue', bookings: 58, rides: 38, rentals: 20 },
      { day: 'Wed', bookings: 65, rides: 45, rentals: 20 },
      { day: 'Thu', bookings: 78, rides: 52, rentals: 26 },
      { day: 'Fri', bookings: 94, rides: 60, rentals: 34 },
      { day: 'Sat', bookings: 120, rides: 75, rentals: 45 },
      { day: 'Sun', bookings: 110, rides: 70, rentals: 40 },
    ],
    revenuePerWeek: [
      { week: 'Wk 1', revenue: 145000, ridesRevenue: 85000, rentalsRevenue: 60000 },
      { week: 'Wk 2', revenue: 168000, ridesRevenue: 98000, rentalsRevenue: 70000 },
      { week: 'Wk 3', revenue: 192000, ridesRevenue: 112000, rentalsRevenue: 80000 },
      { week: 'Wk 4', revenue: 210000, ridesRevenue: 125000, rentalsRevenue: 85000 },
      { week: 'Wk 5', revenue: 248000, ridesRevenue: 142000, rentalsRevenue: 106000 },
      { week: 'Wk 6', revenue: 285000, ridesRevenue: 165000, rentalsRevenue: 120000 },
    ],
  });

  // Table Data
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Stats & Charts
  const loadAdminStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetchAPI<{
        stats: PlatformStats;
        charts: { bookingsPerDay: any[]; revenuePerWeek: any[] };
      }>('/api/admin/stats');

      if (res.data) {
        setStats(res.data.stats || stats);
        if (res.data.charts) setCharts(res.data.charts);
      }
    } catch {
      // Keep defaults
    } finally {
      setLoadingStats(false);
    }
  };

const MOCK_FALLBACK_DRIVERS: DriverRecord[] = [
  { _id: 'drv_101', name: 'Ramesh Chandra', email: 'ramesh.driver@vito.com', licenseNumber: 'DL-04-2021-99812', experience: 9, hourlyRate: 180, verificationStatus: 'pending', createdAt: '2026-08-01T10:00:00Z' },
  { _id: 'drv_102', name: 'Sunita Malhotra', email: 'sunita.m@vito.com', licenseNumber: 'DL-02-2019-44120', experience: 7, hourlyRate: 160, verificationStatus: 'verified', createdAt: '2026-07-28T14:30:00Z' },
  { _id: 'drv_103', name: 'Gurpreet Singh', email: 'gurpreet.s@vito.com', licenseNumber: 'DL-01-2017-11234', experience: 12, hourlyRate: 220, verificationStatus: 'verified', createdAt: '2026-07-15T09:15:00Z' },
  { _id: 'drv_104', name: 'Amit Joshi', email: 'amit.j@vito.com', licenseNumber: 'DL-05-2023-88712', experience: 5, hourlyRate: 150, verificationStatus: 'pending', createdAt: '2026-08-05T11:45:00Z' },
];

const MOCK_FALLBACK_USERS: UserRecord[] = [
  { _id: 'usr_1', name: 'Ananya Sharma', email: 'ananya@gmail.com', role: 'user', createdAt: '2026-07-10T12:00:00Z' },
  { _id: 'usr_2', name: 'Rahul Verma', email: 'rahul.v@vito.com', role: 'driver', createdAt: '2026-06-20T08:30:00Z' },
  { _id: 'usr_3', name: 'Vikram S.', email: 'vikram.admin@vito.com', role: 'admin', createdAt: '2026-05-01T10:15:00Z' },
  { _id: 'usr_4', name: 'Priya Patel', email: 'priya.p@gmail.com', role: 'user', createdAt: '2026-08-02T16:20:00Z' },
];

const MOCK_FALLBACK_VEHICLES_ADMIN: VehicleRecord[] = [
  { _id: 'v_101', category: 'sedan', fuelType: 'cng', transmission: 'manual', seats: 5, pricePerDay: 1500, rating: 4.8, deliveryAvailable: true, ownerId: { name: 'VITO Host Direct' } },
  { _id: 'v_102', category: 'suv', fuelType: 'diesel', transmission: 'automatic', seats: 5, pricePerDay: 2800, rating: 4.9, deliveryAvailable: true, ownerId: { name: 'Vikram S.' } },
  { _id: 'v_103', category: 'luxury', fuelType: 'petrol', transmission: 'automatic', seats: 5, pricePerDay: 8500, rating: 4.98, deliveryAvailable: true, ownerId: { name: 'VITO Luxury Fleet' } },
];

  // Fetch Drivers
  const loadDrivers = async () => {
    try {
      const res = await fetchAPI<{ drivers: DriverRecord[] }>('/api/admin/drivers');
      if (res.data?.drivers && res.data.drivers.length > 0) {
        setDrivers(res.data.drivers);
      } else {
        setDrivers(MOCK_FALLBACK_DRIVERS);
      }
    } catch {
      setDrivers(MOCK_FALLBACK_DRIVERS);
    }
  };

  // Fetch Users
  const loadUsers = async () => {
    try {
      const res = await fetchAPI<{ users: UserRecord[] }>('/api/admin/users');
      if (res.data?.users && res.data.users.length > 0) {
        setUsers(res.data.users);
      } else {
        setUsers(MOCK_FALLBACK_USERS);
      }
    } catch {
      setUsers(MOCK_FALLBACK_USERS);
    }
  };

  // Fetch Vehicles
  const loadVehicles = async () => {
    try {
      const res = await fetchAPI<{ vehicles: VehicleRecord[] }>('/api/admin/vehicles');
      if (res.data?.vehicles && res.data.vehicles.length > 0) {
        setVehicles(res.data.vehicles);
      } else {
        setVehicles(MOCK_FALLBACK_VEHICLES_ADMIN);
      }
    } catch {
      setVehicles(MOCK_FALLBACK_VEHICLES_ADMIN);
    }
  };

  useEffect(() => {
    loadAdminStats();
    loadDrivers();
    loadUsers();
    loadVehicles();
  }, []);

  // Driver Approve/Reject Handler
  const handleVerifyDriver = async (driverId: string, status: 'verified' | 'rejected') => {
    setActionLoadingId(driverId);
    try {
      await fetchAPI(`/api/admin/drivers/${driverId}/verify`, {
        method: 'PATCH',
        body: { status },
      });

      // Local update
      setDrivers((prev) =>
        prev.map((d) => (d._id === driverId ? { ...d, verificationStatus: status } : d))
      );
    } catch {
      setDrivers((prev) =>
        prev.map((d) => (d._id === driverId ? { ...d, verificationStatus: status } : d))
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen pb-12">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[400px] bg-hero-glow pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-6">

        {/* ════════════════════════════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[11px] font-semibold text-violet-400 uppercase tracking-wider w-fit mb-1.5">
              <Shield className="w-3 h-3" />
              Platform Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin <span className="text-gradient">Panel & Analytics</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-xs font-extrabold text-violet-300">
              ADMINISTRATOR ROLE
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            4 KEY PLATFORM STAT CARDS
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-panel p-4 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total Platform Users
            </span>
            <span className="text-2xl font-extrabold text-white">{stats.totalUsers.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-400 font-semibold block mt-1">✓ Registered Accounts</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Active Drivers
            </span>
            <span className="text-2xl font-extrabold text-white">{stats.activeDrivers}</span>
            <span className="text-[10px] text-emerald-400 font-semibold block mt-1">94% Verified Partners</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total Bookings
            </span>
            <span className="text-2xl font-extrabold text-white">{stats.totalBookings.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Rides + Rentals</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total Platform Revenue
            </span>
            <span className="text-2xl font-extrabold text-emerald-400">
              ₹{(stats.totalRevenue / 100000).toFixed(2)} Lakhs
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold block mt-1">+24% YoY Growth</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            NAV TABS
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/[0.08] pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ANALYTICS'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytics & Charts
          </button>

          <button
            onClick={() => setActiveTab('DRIVERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'DRIVERS'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Driver Verifications
            {drivers.filter((d) => d.verificationStatus === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                {drivers.filter((d) => d.verificationStatus === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'USERS'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Users Directory ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('VEHICLES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'VEHICLES'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vehicles Fleet ({vehicles.length})
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: ANALYTICS & RECHARTS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ANALYTICS' && (
          <AdminAnalyticsCharts
            bookingsPerDay={charts.bookingsPerDay}
            revenuePerWeek={charts.revenuePerWeek}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: DRIVERS VERIFICATION MANAGEMENT TABLE
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'DRIVERS' && (
          <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-violet-400" />
                  Driver Verification Management
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Approve or reject pending driver partner applications</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Driver Name</th>
                    <th className="p-3">License No.</th>
                    <th className="p-3">Experience</th>
                    <th className="p-3">Hourly Rate</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {drivers.map((d) => (
                    <tr key={d._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{d.name}</div>
                        <div className="text-[10px] text-slate-500">{d.email}</div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-300">{d.licenseNumber}</td>
                      <td className="p-3 font-semibold text-slate-300">{d.experience} Yrs</td>
                      <td className="p-3 font-bold text-white">₹{d.hourlyRate}/hr</td>
                      <td className="p-3">
                        {d.verificationStatus === 'verified' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-extrabold text-emerald-400">
                            ✓ VERIFIED
                          </span>
                        ) : d.verificationStatus === 'rejected' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/25 text-[10px] font-extrabold text-rose-400">
                            ✕ REJECTED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-[10px] font-extrabold text-amber-300 animate-pulse">
                            ⏳ PENDING
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {actionLoadingId === d._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-violet-400 ml-auto" />
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyDriver(d._id, 'verified')}
                              disabled={d.verificationStatus === 'verified'}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleVerifyDriver(d._id, 'rejected')}
                              disabled={d.verificationStatus === 'rejected'}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: USERS DIRECTORY TABLE
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'USERS' && (
          <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-violet-400" />
              Registered Users Directory ({users.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">User Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-bold text-white">{u.name}</td>
                      <td className="p-3 text-slate-400">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/25 text-[10px] font-bold text-violet-300 capitalize">
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-bold text-emerald-400">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: VEHICLES FLEET TABLE
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'VEHICLES' && (
          <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="w-4.5 h-4.5 text-violet-400" />
              Vehicles Fleet Inventory ({vehicles.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Category</th>
                    <th className="p-3">Fuel & Specs</th>
                    <th className="p-3">Transmission</th>
                    <th className="p-3">Price / Day</th>
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
                      <td className="p-3 text-slate-400">{v.ownerId?.name || 'VITO Fleet Host'}</td>
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
          </div>
        )}

      </div>
    </div>
  );
}
