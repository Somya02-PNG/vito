'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboardMain from '@/app/dashboard/admin/page';

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardMain />
    </ProtectedRoute>
  );
}
