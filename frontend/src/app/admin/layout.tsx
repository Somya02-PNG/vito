'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  CarFront,
  Navigation,
  Key,
  UserPlus,
  CreditCard,
  Shield,
  LifeBuoy,
  BarChart3,
  Settings,
  Zap,
  Bell,
  Activity,
} from 'lucide-react';

const adminNavItems = [
  { label: 'Overview',     href: '/admin/dashboard',    icon: LayoutDashboard },
  { label: 'Users',        href: '/admin/users',        icon: Users },
  { label: 'Drivers',      href: '/admin/drivers',      icon: UserCheck },
  { label: 'Partners',     href: '/admin/partners',     icon: Building2 },
  { label: 'Vehicles',     href: '/admin/vehicles',     icon: CarFront },
  { label: 'Rides',        href: '/admin/rides',        icon: Navigation },
  { label: 'Rentals',      href: '/admin/rentals',      icon: Key },
  { label: 'Driver Hires', href: '/admin/driver-hires', icon: UserPlus },
  { label: 'Payments',     href: '/admin/payments',     icon: CreditCard },
  { label: 'Safety',       href: '/admin/safety',       icon: Shield },
  { label: 'Support',      href: '/admin/support',      icon: LifeBuoy },
  { label: 'Analytics',    href: '/admin/analytics',    icon: BarChart3 },
  { label: 'Settings',     href: '/admin/settings',     icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Public auth pages under /admin/* do not use protected shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
      <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between">
        {/* Command Center Top Header & Navigation */}
        <header className="sticky top-0 z-50 bg-[#0C0F1D]/95 backdrop-blur-xl border-b border-violet-500/20 shadow-2xl">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Brand & Command Center Badge */}
              <Link href="/admin/dashboard" className="flex items-center gap-3 group shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-500/20">
                  <div className="w-full h-full bg-[#07090E] rounded-[9.5px] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-violet-400 fill-violet-400/20" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-white">VITO</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-violet-500/10 border border-violet-500/30 text-violet-300 flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5 text-violet-400 animate-pulse" />
                      <span>OPS COMMAND CENTER</span>
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Nav Links (High Density Horizontal Bar) */}
              <nav className="hidden xl:flex items-center gap-0.5 overflow-x-auto">
                {adminNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        isActive
                          ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-inner'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Admin profile & logout */}
              <div className="flex items-center gap-3 shrink-0">
                <button className="relative p-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-[#0C0F1D]" />
                </button>

                {user && (
                  <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-md">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                      <p className="text-[10px] text-violet-400 mt-0.5 uppercase tracking-wider font-mono">SYSTEM ADMIN</p>
                    </div>
                    <LogoutButton className="ml-1 text-slate-400 hover:text-red-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile / Tablet Horizontal Scroll Nav Bar */}
            <div className="xl:hidden flex items-center gap-1 py-2 overflow-x-auto border-t border-white/[0.05] scrollbar-none">
              {adminNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {/* Command Center Main Workspace Area */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
