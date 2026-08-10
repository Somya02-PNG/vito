'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/navigation/AppShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['customer']} redirectTo="/customer/login">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
