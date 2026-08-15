import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboardView from '@/components/AdminDashboardView';

export default function AdminSafetyPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
      <AdminDashboardView defaultTab="SAFETY" />
    </ProtectedRoute>
  );
}
