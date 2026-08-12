'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/navigation/AppShell';
import { usePathname } from 'next/navigation';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Public auth pages under /customer/* do not use protected shell
  if (pathname === '/customer/login' || pathname === '/customer/register') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
      <AppShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
