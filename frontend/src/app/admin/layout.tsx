'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleAppShell from '@/components/navigation/RoleAppShell';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Public auth pages under /admin/* do not use protected shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
      <RoleAppShell role="admin">
        {children}
      </RoleAppShell>
    </ProtectedRoute>
  );
}
