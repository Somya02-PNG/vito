'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileDrawer from './MobileDrawer';
import BottomNav from './BottomNav';
import { RoleType } from './RoleNavConfig';
import VITOAIDrawer from '@/components/ai/VITOAIDrawer';

interface RoleAppShellProps {
  role: RoleType;
  children: React.ReactNode;
}

export default function RoleAppShell({ role, children }: RoleAppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#06090E] text-slate-100 flex flex-col md:flex-row">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          role={role}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        role={role}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar Header */}
        <Topbar
          role={role}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav role={role} />
      </div>

      {/* Global VITO AI Floating Button + Drawer */}
      <VITOAIDrawer role={role} />
    </div>
  );
}
