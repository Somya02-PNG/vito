'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import OperationsPage from '@/app/admin/operations/page';

export default function AdminRentalsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <OperationsPage />
    </ProtectedRoute>
  );
}
