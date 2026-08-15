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
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ShieldCheck,
  Shield,
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
    if (
      basePath === '/customer/home' ||
      basePath === '/driver/home' ||
      basePath === '/partner/dashboard' ||
      basePath === '/admin/dashboard'
    ) {
      return pathname === basePath;
    }
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#07111F] border-r border-[#17334F]/40 text-slate-200 select-none transition-all duration-300 ${
        isMobileDrawer ? 'w-72' : isCollapsed ? 'w-20' : 'w-64 md:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#17334F]/30 shrink-0">
        <Link
          href={config.groups[0]?.items[0]?.href || '/'}
          onClick={onCloseMobileDrawer}
          className="flex items-center gap-3 group overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00C2B3] to-[#00A99D] p-[1.5px] shadow-lg shadow-[#00C2B3]/25 group-hover:scale-105 transition-transform shrink-0">
            <div className="w-full h-full bg-[#07111F] rounded-[9.5px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#00C2B3] fill-[#00C2B3]" />
            </div>
          </div>

          {(!isCollapsed || isMobileDrawer) && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">VITO</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#00C2B3]/10 border border-[#00C2B3]/30 text-[#00C2B3]">
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
            {groupIdx > 0 && <div className="my-3 border-t border-[#17334F]/30" />}
            {group.title && (!isCollapsed || isMobileDrawer) && (
              <h4 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h4>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isActive =
                isLinkActive(item.href) ||
                (hasSubItems && item.subItems?.some((s) => isLinkActive(s.href)));
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
                          ? 'bg-[#00C2B3] text-white font-bold shadow-[0_0_16px_rgba(0,194,179,0.35)]'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                      title={isCollapsed && !isMobileDrawer ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        {(!isCollapsed || isMobileDrawer) && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {(!isCollapsed || isMobileDrawer) && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white">
                              {item.badge}
                            </span>
                          )}
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                          )}
                        </div>
                      )}
                    </button>

                    {/* Accordion Children */}
                    {isOpen && (!isCollapsed || isMobileDrawer) && (
                      <div className="pl-9 pr-1 py-1 space-y-1 animate-fadeIn">
                        {item.subItems?.map((sub) => {
                          const isSubActive = isLinkActive(sub.href);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={onCloseMobileDrawer}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isSubActive
                                  ? 'text-[#00C2B3] font-bold bg-[#00C2B3]/10'
                                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                              {sub.badge && (
                                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#00C2B3]/20 text-[#00C2B3]">
                                  {sub.badge}
                                </span>
                              )}
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
                      ? 'bg-gradient-to-r from-[#00C2B3]/20 to-[#7567E8]/20 text-white border border-[#00C2B3]/30 hover:border-[#00C2B3]/60 shadow-[0_0_12px_rgba(0,194,179,0.25)]'
                      : isActive
                      ? 'bg-[#00C2B3] text-white font-bold shadow-[0_0_16px_rgba(0,194,179,0.35)]'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                  title={isCollapsed && !isMobileDrawer ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      item.isAiAssistant
                        ? 'text-[#00C2B3] animate-pulse'
                        : isActive
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  />

                  {(!isCollapsed || isMobileDrawer) && (
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/15 text-white">
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

        {/* VITO Safety Reassurance Card */}
        {(!isCollapsed || isMobileDrawer) && (
          <div className="p-3 rounded-2xl bg-[#10243A]/60 border border-[#17334F]/40 space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16A67A]" />
              <span className="text-xs font-bold text-white">VITO Safety Active</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              24/7 real-time ride monitoring & verified emergency response.
            </p>
          </div>
        )}
      </div>

      {/* Footer Area: AI Assistant Trigger + Profile + Logout */}
      <div className="p-3 border-t border-[#17334F]/30 bg-[#0B1728]/80 space-y-2 shrink-0">
        {/* Persistent Ask VITO AI Button */}
        <button
          onClick={() => {
            const aiBtn = document.getElementById('vito-ai-floating-trigger');
            aiBtn?.click();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#00C2B3]/20 via-[#7567E8]/20 to-[#00C2B3]/20 text-white border border-[#00C2B3]/30 hover:border-[#00C2B3]/60 shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#00C2B3] shrink-0 animate-pulse" />
          {(!isCollapsed || isMobileDrawer) && <span>✦ Ask VITO AI</span>}
        </button>

        {/* User Profile Summary Section */}
        {user && (
          <div className="pt-2 border-t border-[#17334F]/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00C2B3] to-[#00A99D] flex items-center justify-center text-xs font-black text-white uppercase shadow-md shrink-0">
                {user.name.charAt(0)}
              </div>

              {(!isCollapsed || isMobileDrawer) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white leading-tight truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#00C2B3] capitalize font-medium truncate">
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
