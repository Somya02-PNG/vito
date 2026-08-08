'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  Car,
  Key,
  UserCheck,
  Shield,
  UserCircle,
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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Frosted glass background */}
      <div className="bg-[#0A0E18]/90 backdrop-blur-xl border-t border-white/[0.06] pb-safe">
        <div className="flex items-center justify-around px-1 h-16">
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
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-accent-500'
                    : 'text-slate-500 active:text-slate-300'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all ${
                      isActive ? 'scale-110' : ''
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-500" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium leading-none mt-0.5 ${
                    isActive ? 'text-accent-400' : ''
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
