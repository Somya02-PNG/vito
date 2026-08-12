'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import {
  LayoutDashboard,
  CarFront,
  CalendarDays,
  CalendarRange,
  Wallet,
  Users,
  MessageSquare,
  Star,
  Wrench,
  Settings,
  Zap,
  Bell,
} from 'lucide-react';

const partnerNavItems = [
  { label: 'Overview',    href: '/partner/dashboard',  icon: LayoutDashboard },
  { label: 'Fleet',       href: '/partner/fleet',      icon: CarFront },
  { label: 'Bookings',    href: '/partner/bookings',   icon: CalendarDays },
  { label: 'Calendar',    href: '/partner/calendar',   icon: CalendarRange },
  { label: 'Earnings',    href: '/partner/earnings',   icon: Wallet },
  { label: 'Customers',   href: '/partner/customers',  icon: Users },
  { label: 'Messages',    href: '/partner/messages',   icon: MessageSquare },
  { label: 'Reviews',     href: '/partner/reviews',    icon: Star },
  { label: 'Maintenance', href: '/partner/maintenance',icon: Wrench },
  { label: 'Settings',    href: '/partner/settings',   icon: Settings },
];

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Public auth pages under /partner/* do not use protected shell
  if (pathname === '/partner/login' || pathname === '/partner/register') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={['partner']} allowedPartnerTypes={['rental_partner']} redirectTo="/login">
      <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-between">
        {/* Fleet Management Top Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#0B101E]/95 backdrop-blur-xl border-b border-teal-500/20 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Brand logo & fleet badge */}
              <Link href="/partner/dashboard" className="flex items-center gap-3 group shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1.5px] shadow-lg shadow-teal-500/20">
                  <div className="w-full h-full bg-[#070A12] rounded-[9.5px] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-teal-400 fill-teal-400/20" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-white">VITO</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-teal-500/10 border border-teal-500/30 text-teal-300">
                      FLEET OPERATOR
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Nav Links (Data-dense horizontal bar) */}
              <nav className="hidden xl:flex items-center gap-1 overflow-x-auto">
                {partnerNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/partner/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-inner'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Right profile & logout */}
              <div className="flex items-center gap-3 shrink-0">
                <button className="relative p-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors">
                  <Bell className="w-4 h-4" />
                </button>

                {user && (
                  <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-md">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                      <p className="text-[10px] text-teal-400 mt-0.5 uppercase tracking-wider font-mono">RENTAL PARTNER</p>
                    </div>
                    <LogoutButton className="ml-1 text-slate-400 hover:text-red-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile / Tablet Horizontal Scroll Nav */}
            <div className="xl:hidden flex items-center gap-1 py-2 overflow-x-auto border-t border-white/[0.05] scrollbar-none">
              {partnerNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/partner/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
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

        {/* Main Fleet Management Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
