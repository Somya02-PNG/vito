'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAV_CONFIGS, RoleType } from './RoleNavConfig';
import LogoutButton from '@/components/auth/LogoutButton';
import { Zap, Bell, Menu, Search } from 'lucide-react';

interface TopbarProps {
  role: RoleType;
  onOpenMobileDrawer: () => void;
}

export default function Topbar({ role, onOpenMobileDrawer }: TopbarProps) {
  const { user } = useAuth();
  const config = ROLE_NAV_CONFIGS[role];
  const theme = config.theme;

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#090D18]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 md:px-6 flex items-center justify-between shadow-lg">
      {/* Left section: Mobile menu trigger + Brand & Role Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-bold text-slate-300">
              {config.title}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText} border`}
          >
            {config.badgeText}
          </span>
        </div>
      </div>

      {/* Right section: Search/Notifications + User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${theme.activeBg} bg-current`} />
        </button>

        {/* User Info & Avatar */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/[0.08]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
              <p className={`text-[10px] ${theme.badgeText} font-mono uppercase tracking-wider`}>
                {user.role}
              </p>
            </div>

            <div
              className={`w-8.5 h-8.5 rounded-full bg-gradient-to-tr ${theme.avatarGradient} flex items-center justify-center text-xs font-black text-white uppercase shadow-md border border-white/10`}
            >
              {user.name.charAt(0)}
            </div>

            <LogoutButton className="hidden sm:block text-slate-400 hover:text-red-400 ml-1" />
          </div>
        )}
      </div>
    </header>
  );
}
