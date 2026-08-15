'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROLE_NAV_CONFIGS, RoleType } from './RoleNavConfig';

interface BottomNavProps {
  role?: RoleType;
}

export default function BottomNav({ role = 'customer' }: BottomNavProps) {
  const pathname = usePathname();
  const config = ROLE_NAV_CONFIGS[role];
  const items = config.bottomNavItems;
  const theme = config.theme;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* Frosted glass background */}
      <div className="bg-[#090D18]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe shadow-2xl">
        <div className="flex items-center justify-around px-1 h-16">
          {items.map((item) => {
            const basePath = item.href.split('?')[0];
            const isActive =
              pathname === basePath ||
              (basePath !== '/customer/home' &&
                basePath !== '/driver/home' &&
                basePath !== '/partner/dashboard' &&
                basePath !== '/admin/dashboard' &&
                pathname.startsWith(basePath));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-xl transition-all duration-200 ${
                  isActive
                    ? `${theme.activeText} font-bold`
                    : 'text-slate-500 active:text-slate-300'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all ${
                      isActive ? `scale-110 ${theme.activeIcon}` : ''
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {isActive && (
                    <div
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${theme.activeBg} bg-current`}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] leading-none mt-0.5 ${
                    isActive ? `${theme.activeText} font-bold` : ''
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
