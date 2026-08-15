'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleAppShell from '@/components/navigation/RoleAppShell';
import { usePathname } from 'next/navigation';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Public auth pages under /partner/* do not use protected shell
  if (pathname === '/partner/login' || pathname === '/partner/register') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={['partner']} allowedPartnerTypes={['rental_partner']} redirectTo="/login">
      <RoleAppShell role="partner">
        {children}
      </RoleAppShell>
    </ProtectedRoute>
  );
}
