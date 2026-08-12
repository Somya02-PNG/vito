'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import {
  Home,
  Radio,
  Navigation,
  Wallet,
  MessageSquare,
  Shield,
  UserCircle,
  Zap,
} from 'lucide-react';

const driverNavItems = [
  { label: 'Home',     href: '/driver/home',     icon: Home },
  { label: 'Requests', href: '/driver/requests', icon: Radio },
  { label: 'Trips',    href: '/driver/trips',    icon: Navigation },
  { label: 'Earnings', href: '/driver/earnings', icon: Wallet },
  { label: 'Messages', href: '/driver/messages', icon: MessageSquare },
  { label: 'Safety',   href: '/driver/safety',   icon: Shield },
  { label: 'Profile',  href: '/driver/profile',  icon: UserCircle },
];

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Public auth pages under /driver/* do not use protected shell
  if (pathname === '/driver/login') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={['partner', 'driver']} allowedPartnerTypes={['driver']} redirectTo="/login">
      <div className="min-h-screen bg-[#06090E] text-slate-100 flex flex-col justify-between">
        {/* Driver Top Navigation Bar (High contrast operational theme) */}
        <header className="sticky top-0 z-50 bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-cyan-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Brand logo & operational badge */}
              <Link href="/driver/home" className="flex items-center gap-3 group shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/20">
                  <div className="w-full h-full bg-[#06090E] rounded-[9.5px] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-white">VITO</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                      DRIVER OPS
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1">
                {driverNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/driver/home' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Driver profile summary & logout */}
              <div className="flex items-center gap-3">
                {user && (
                  <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-md">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                      <p className="text-[10px] text-cyan-400 mt-0.5 uppercase tracking-wider font-mono">DRIVER PARTNER</p>
                    </div>
                    <LogoutButton className="ml-1 text-slate-400 hover:text-red-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0A0F1D]/95 backdrop-blur-xl border-t border-cyan-500/20 pb-safe">
          <div className="flex items-center justify-around px-1 h-16">
            {driverNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/driver/home' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${
                    isActive ? 'text-cyan-400 font-bold' : 'text-slate-500 active:text-slate-300'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'scale-110 text-cyan-400' : ''}`} />
                  <span className={`text-[9px] mt-1 ${isActive ? 'text-cyan-300 font-bold' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
}
