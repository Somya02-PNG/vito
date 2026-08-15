'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleAppShell from '@/components/navigation/RoleAppShell';
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
      <RoleAppShell role="customer">
        {children}
      </RoleAppShell>
    </ProtectedRoute>
  );
}
