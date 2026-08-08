'use client';

import React from 'react';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#07090E]">
      <TopNav />
      <main className="pb-20 lg:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
