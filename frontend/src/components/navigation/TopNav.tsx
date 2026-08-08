'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Sparkles,
  Car,
  Key,
  UserCheck,
  Shield,
  UserCircle,
  Zap,
  LogOut,
  Bell,
} from 'lucide-react';

const navItems = [
  { label: 'Home',        href: '/dashboard',          icon: Home },
  { label: 'AI Planner',  href: '/dashboard/planner',  icon: Sparkles },
  { label: 'Cab',         href: '/dashboard/cab',       icon: Car },
  { label: 'Rental',      href: '/dashboard/rental',    icon: Key },
  { label: 'Driver Hire', href: '/dashboard/hire',      icon: UserCheck },
  { label: 'Safety',      href: '/dashboard/safety',    icon: Shield },
  { label: 'Profile',     href: '/dashboard/profile',   icon: UserCircle },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="hidden lg:block sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0E18]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 via-primary-400 to-accent-500 p-[1px] shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
              <div className="w-full h-full bg-[#0A0E18] rounded-[11px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-300 fill-primary-400/20" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-white">VITO</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="relative p-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full border-2 border-[#0A0E18]" />
            </button>

            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-white/[0.06]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-1 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
