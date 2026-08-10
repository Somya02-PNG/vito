'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboardPage from '@/app/dashboard/admin/page';

export default function AdminOperationsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
      <AdminDashboardPage defaultTab="OPERATIONS" />
    </ProtectedRoute>
  );
}
