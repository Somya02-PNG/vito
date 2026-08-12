'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Car,
  Key,
  UserCheck,
  Sparkles,
  Compass,
  Shield,
  UserCircle,
} from 'lucide-react';

const navItems = [
  { label: 'Home',        href: '/customer/home',             icon: Home },
  { label: 'Cab',         href: '/customer/cab',              icon: Car },
  { label: 'Rentals',     href: '/customer/rentals',          icon: Key },
  { label: 'Hire',        href: '/customer/driver-hire',     icon: UserCheck },
  { label: 'AI Plan',     href: '/customer/ai-trip-planner', icon: Sparkles },
  { label: 'Trips',       href: '/customer/trips',            icon: Compass },
  { label: 'Safety',      href: '/customer/safety',           icon: Shield },
  { label: 'Profile',     href: '/customer/profile',          icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Frosted glass background */}
      <div className="bg-[#0A0E18]/95 backdrop-blur-xl border-t border-white/[0.06] pb-safe">
        <div className="flex items-center justify-between px-1 h-16">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/customer/home' && pathname.startsWith(item.href));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-blue-400 font-semibold'
                    : 'text-slate-500 active:text-slate-300'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-4.5 h-4.5 transition-all ${
                      isActive ? 'scale-110 text-blue-400' : ''
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </div>
                <span
                  className={`text-[9px] leading-none mt-0.5 ${
                    isActive ? 'text-blue-300 font-bold' : ''
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
