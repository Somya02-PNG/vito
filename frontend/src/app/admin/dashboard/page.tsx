'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboardPage from '@/app/dashboard/admin/page';

export default function AdminDashboardRoute() {
  return (
    <ProtectedRoute
      allowedRoles={['admin']}
      redirectTo="/admin/login"
    >
      <AdminDashboardPage />
    </ProtectedRoute>
  );
}
