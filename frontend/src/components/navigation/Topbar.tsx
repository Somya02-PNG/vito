'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAV_CONFIGS, RoleType } from './RoleNavConfig';
import LogoutButton from '@/components/auth/LogoutButton';
import {
  Bell,
  Menu,
  ShieldAlert,
  Car,
  CreditCard,
  Key,
  UserCheck,
  Shield,
  Sparkles,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'Ride' | 'Payment' | 'Rental' | 'Driver' | 'Safety' | 'AI' | 'System';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'Ride',
    title: 'Driver Assigned',
    message: 'Your VITO driver Rajesh Kumar (DL 01 AB 4829) is 3 mins away.',
    time: '2 min ago',
    read: false,
  },
  {
    id: 'n2',
    type: 'Payment',
    title: 'Payment Confirmed',
    message: '₹280 successfully settled via UPI. Tax invoice is ready.',
    time: '18 min ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'Safety',
    title: 'Safety Monitoring Active',
    message: '24/7 trip protection & trusted contact alerts are active.',
    time: '1 hour ago',
    read: true,
  },
  {
    id: 'n4',
    type: 'AI',
    title: 'VITO AI Trip Tip',
    message: 'Morning peak surge starts at 8 AM. Schedule your ride early.',
    time: '3 hours ago',
    read: true,
  },
];

const TYPE_CONFIG = {
  Ride: { icon: Car, color: 'text-[#00A99D]', bg: 'bg-[#00C2B3]/10' },
  Payment: { icon: CreditCard, color: 'text-[#16A67A]', bg: 'bg-[#16A67A]/10' },
  Rental: { icon: Key, color: 'text-[#3984E8]', bg: 'bg-[#3984E8]/10' },
  Driver: { icon: UserCheck, color: 'text-[#C9A45C]', bg: 'bg-[#C9A45C]/10' },
  Safety: { icon: Shield, color: 'text-[#E5484D]', bg: 'bg-[#E5484D]/10' },
  AI: { icon: Sparkles, color: 'text-[#7567E8]', bg: 'bg-[#7567E8]/10' },
  System: { icon: CheckCircle2, color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

interface TopbarProps {
  role: RoleType;
  onOpenMobileDrawer: () => void;
}

export default function Topbar({ role, onOpenMobileDrawer }: TopbarProps) {
  const { user } = useAuth();
  const config = ROLE_NAV_CONFIGS[role];
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#FFFFFF] border-b border-[#E5EAF0] px-4 md:px-6 flex items-center justify-between shadow-[0_2px_8px_rgba(7,17,31,0.03)] select-none">
      {/* Left Section: Mobile menu trigger + Role title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 rounded-xl text-[#526174] hover:text-[#0B1728] hover:bg-[#F1F5F8] transition-colors"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-[#0B1728] tracking-tight">
            {config.title}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#00C2B3]/10 border border-[#00C2B3]/25 text-[#00A99D]">
            {config.badgeText}
          </span>
        </div>
      </div>

      {/* Right Section: Safety quick link + Notifications + User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Safety SOS Quick Button */}
        <Link
          href={`/${role}/safety`}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5484D]/10 hover:bg-[#E5484D]/15 border border-[#E5484D]/30 text-xs font-bold text-[#E5484D] transition-all"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Safety</span>
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-[#526174] hover:text-[#0B1728] hover:bg-[#F1F5F8] transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00C2B3] ring-2 ring-white" />
            )}
          </button>

          {/* Notification Menu Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#FFFFFF] border border-[#E5EAF0] shadow-[0_12px_36px_rgba(7,17,31,0.12)] p-4 space-y-3 animate-scaleIn z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF0]">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#0B1728] uppercase tracking-wider">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#00C2B3]/10 text-[#00A99D]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-[#00A99D] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {notifications.map((n) => {
                  const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.System;
                  const Icon = conf.icon;
                  return (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border transition-colors flex items-start gap-3 ${
                        n.read
                          ? 'bg-[#FFFFFF] border-[#E5EAF0] text-[#526174]'
                          : 'bg-[#F0FCFB] border-[#00C2B3]/25 text-[#0B1728]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${conf.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${conf.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#0B1728] truncate">{n.title}</p>
                          <span className="text-[10px] text-[#8995A5] shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-[#526174] mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Avatar */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-[#E5EAF0]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#0B1728] leading-tight">{user.name}</p>
              <p className="text-[10px] text-[#00A99D] font-semibold capitalize">
                {user.role}
              </p>
            </div>

            <div className="w-8.5 h-8.5 rounded-full bg-[#07111F] text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm border border-[#E5EAF0]">
              {user.name.charAt(0)}
            </div>

            <LogoutButton className="hidden sm:block text-[#8995A5] hover:text-[#E5484D] ml-1" />
          </div>
        )}
      </div>
    </header>
  );
}
