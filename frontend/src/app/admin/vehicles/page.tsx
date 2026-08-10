'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboardPage from '@/app/dashboard/admin/page';

export default function AdminVehiclesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
      <AdminDashboardPage defaultTab="VEHICLES" />
    </ProtectedRoute>
  );
}
