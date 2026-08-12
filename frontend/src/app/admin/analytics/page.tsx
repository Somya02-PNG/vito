'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboardMain from '@/app/dashboard/admin/page';

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardMain />
    </ProtectedRoute>
  );
}
