'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleAppShell from '@/components/navigation/RoleAppShell';
import { usePathname } from 'next/navigation';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Public auth pages under /driver/* do not use protected shell
  if (pathname === '/driver/login') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={['partner', 'driver']} allowedPartnerTypes={['driver']} redirectTo="/login">
      <RoleAppShell role="driver">
        {children}
      </RoleAppShell>
    </ProtectedRoute>
  );
}
