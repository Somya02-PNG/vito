'use client';

import React from 'react';
import AdminDashboardView, { AdminTab } from '@/components/AdminDashboardView';

export default function AdminDashboardPage({ searchParams }: { searchParams?: { tab?: string } }) {
  const initialTab = (searchParams?.tab?.toUpperCase() as AdminTab) || 'OVERVIEW';
  return <AdminDashboardView defaultTab={initialTab} />;
}
