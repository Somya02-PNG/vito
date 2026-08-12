'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import SafetyPage from '@/app/admin/safety/page';

export default function AdminSupportPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <SafetyPage />
    </ProtectedRoute>
  );
}
