import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboardView from '@/components/AdminDashboardView';

export default function AdminDashboardRoute() {
  return (
    <ProtectedRoute
      allowedRoles={['admin']}
      redirectTo="/admin/login"
    >
      <AdminDashboardView defaultTab="OVERVIEW" />
    </ProtectedRoute>
  );
}
