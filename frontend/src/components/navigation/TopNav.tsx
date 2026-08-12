'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import {
  Home,
  Car,
  Key,
  UserCheck,
  Sparkles,
  Compass,
  Shield,
  UserCircle,
  Zap,
  Bell,
} from 'lucide-react';

const navItems = [
  { label: 'Home',        href: '/customer/home',             icon: Home },
  { label: 'Book Cab',    href: '/customer/cab',              icon: Car },
  { label: 'Rentals',     href: '/customer/rentals',          icon: Key },
  { label: 'Driver Hire', href: '/customer/driver-hire',     icon: UserCheck },
  { label: 'AI Planner',  href: '/customer/ai-trip-planner', icon: Sparkles },
  { label: 'My Trips',    href: '/customer/trips',            icon: Compass },
  { label: 'Safety',      href: '/customer/safety',           icon: Shield },
  { label: 'Profile',     href: '/customer/profile',          icon: UserCircle },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="hidden lg:block sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0E18]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/customer/home" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <div className="w-full h-full bg-[#0A0E18] rounded-[11px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-400 fill-blue-400/20" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-white">VITO</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/customer/home' && pathname.startsWith(item.href));

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right section with LogoutButton */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="relative p-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0A0E18]" />
            </button>

            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-white/[0.06]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{user.role}</p>
                </div>
                <LogoutButton className="ml-1" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
