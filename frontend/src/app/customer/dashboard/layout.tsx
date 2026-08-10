'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      allowedRoles={['customer']}
      redirectTo="/customer/login"
    >
      {children}
    </ProtectedRoute>
  );
}
