'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import { ROLE_NAV_CONFIGS, RoleType, NavItem, NavSubItem } from './RoleNavConfig';
import {
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  role: RoleType;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export default function Sidebar({
  role,
  isCollapsed = false,
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const config = ROLE_NAV_CONFIGS[role];
  const theme = config.theme;

  // Track open accordion state for sub-items
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    config.groups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const isChildActive = item.subItems.some((sub) =>
            pathname.startsWith(sub.href.split('?')[0])
          );
          if (isChildActive) {
            initialState[item.label] = true;
          }
        }
      });
    });
    return initialState;
  });

  const toggleAccordion = (label: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isLinkActive = (href: string) => {
    const basePath = href.split('?')[0];
    if (basePath === '/customer/home' || basePath === '/driver/home' || basePath === '/partner/dashboard' || basePath === '/admin/dashboard') {
      return pathname === basePath;
    }
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#080C16] border-r border-white/[0.08] text-slate-200 select-none transition-all duration-300 ${
        isMobileDrawer
          ? 'w-72'
          : isCollapsed
          ? 'w-20'
          : 'w-64 md:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06] shrink-0">
        <Link
          href={config.groups[0]?.items[0]?.href || '/'}
          onClick={onCloseMobileDrawer}
          className="flex items-center gap-3 group overflow-hidden"
        >
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${theme.avatarGradient} p-[1.5px] shadow-lg ${theme.glow} group-hover:scale-105 transition-transform shrink-0`}
          >
            <div className="w-full h-full bg-[#090D18] rounded-[9.5px] flex items-center justify-center">
              <Zap className={`w-4 h-4 ${theme.activeIcon} fill-current`} />
            </div>
          </div>

          {(!isCollapsed || isMobileDrawer) && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">VITO</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText} border`}
                >
                  {config.badgeText}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {config.title}
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle button for Desktop/Tablet */}
        {!isMobileDrawer && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Links Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {config.groups.map((group, groupIdx) => (
          <div key={group.id} className="space-y-1">
            {groupIdx > 0 && <div className="my-3 border-t border-white/[0.06]" />}
            {group.title && (!isCollapsed || isMobileDrawer) && (
              <h4 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h4>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isActive = isLinkActive(item.href) || (hasSubItems && item.subItems?.some(s => isLinkActive(s.href)));
              const isOpen = openAccordions[item.label];

              if (hasSubItems) {
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => {
                        if (isCollapsed && !isMobileDrawer && onToggleCollapse) {
                          onToggleCollapse();
                        }
                        toggleAccordion(item.label);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? `${theme.activeBg} ${theme.activeText} border ${theme.activeBorder}`
                          : `text-slate-400 ${theme.hoverBg}`
                      }`}
                    >
                      <div className="flex items-center gap-3 shrink-0">
                        <Icon className={`w-4.5 h-4.5 ${isActive ? theme.activeIcon : 'text-slate-400'}`} />
                        {(!isCollapsed || isMobileDrawer) && <span>{item.label}</span>}
                      </div>

                      {(!isCollapsed || isMobileDrawer) && (
                        <div className="text-slate-500">
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                      )}
                    </button>

                    {/* Sub-items accordion container */}
                    {isOpen && (!isCollapsed || isMobileDrawer) && (
                      <div className="pl-9 pr-1 py-1 space-y-1 border-l border-white/[0.08] ml-5">
                        {item.subItems?.map((sub) => {
                          const isSubActive = isLinkActive(sub.href);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={onCloseMobileDrawer}
                              className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isSubActive
                                  ? `${theme.activeText} font-semibold bg-white/[0.06]`
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Single Link item
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobileDrawer}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    item.isAiAssistant
                      ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 text-purple-300 border border-purple-500/30 hover:border-purple-400/50 shadow-sm'
                      : isActive
                      ? `${theme.activeBg} ${theme.activeText} border ${theme.activeBorder} shadow-sm`
                      : `text-slate-400 ${theme.hoverBg}`
                  }`}
                  title={isCollapsed && !isMobileDrawer ? item.label : undefined}
                >
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      item.isAiAssistant
                        ? 'text-purple-400 animate-pulse'
                        : isActive
                        ? theme.activeIcon
                        : 'text-slate-400'
                    }`}
                  />

                  {(!isCollapsed || isMobileDrawer) && (
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Area: AI Assistant persistent trigger + Profile + Settings/Logout */}
      <div className="p-3 border-t border-white/[0.08] bg-[#060912]/80 space-y-2 shrink-0">
        {/* Footer actions like persistent AI Assistant / Settings */}
        {config.footerItems.map((item) => {
          const Icon = item.icon;
          const isActive = isLinkActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobileDrawer}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                item.isAiAssistant
                  ? 'bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 text-purple-200 border border-purple-500/30 hover:border-purple-400 shadow-md'
                  : isActive
                  ? `${theme.activeBg} ${theme.activeText} border ${theme.activeBorder}`
                  : `text-slate-400 ${theme.hoverBg}`
              }`}
              title={isCollapsed && !isMobileDrawer ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  item.isAiAssistant ? 'text-pink-400 animate-pulse' : 'text-slate-400'
                }`}
              />
              {(!isCollapsed || isMobileDrawer) && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User Profile Summary Section */}
        {user && (
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-tr ${theme.avatarGradient} flex items-center justify-center text-xs font-black text-white uppercase shadow-md shrink-0`}
              >
                {user.name.charAt(0)}
              </div>

              {(!isCollapsed || isMobileDrawer) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white leading-tight truncate">
                    {user.name}
                  </p>
                  <p className={`text-[10px] ${theme.badgeText} capitalize font-medium truncate`}>
                    {user.role}
                  </p>
                </div>
              )}
            </div>

            {/* Logout button */}
            {(!isCollapsed || isMobileDrawer) && (
              <LogoutButton className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/[0.06] rounded-lg transition-colors" />
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
