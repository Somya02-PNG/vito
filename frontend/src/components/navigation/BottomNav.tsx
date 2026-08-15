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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden select-none">
      <div className="bg-[#FFFFFF] border-t border-[#E5EAF0] pb-safe shadow-[0_-4px_20px_rgba(7,17,31,0.06)]">
        <div className="flex items-center justify-around px-1 h-16">
          {items.map((item) => {
            const basePath = item.href.split('?')[0];
            const isAi = item.isAiAssistant;
            const isActive =
              !isAi &&
              (pathname === basePath ||
                (basePath !== '/customer/home' &&
                  basePath !== '/driver/home' &&
                  basePath !== '/partner/dashboard' &&
                  basePath !== '/admin/dashboard' &&
                  pathname.startsWith(basePath)));

            const Icon = item.icon;

            if (isAi) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    const aiBtn = document.getElementById('vito-ai-floating-trigger');
                    aiBtn?.click();
                  }}
                  className="flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-xl transition-all"
                  aria-label="Open VITO AI Assistant"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00C2B3] to-[#7567E8] text-white flex items-center justify-center shadow-md">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-[#00A99D] mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-[#00A99D] font-bold'
                    : 'text-[#8995A5] active:text-[#0B1728]'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all ${
                      isActive ? 'scale-110 text-[#00A99D]' : 'text-[#8995A5]'
                    }`}
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00C2B3]" />
                  )}
                </div>
                <span
                  className={`text-[10px] leading-none mt-0.5 ${
                    isActive ? 'text-[#00A99D] font-bold' : 'text-[#526174]'
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
