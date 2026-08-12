'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import HirePage from '@/app/dashboard/hire/page';

export default function CustomerDriverHirePage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <HirePage />
    </ProtectedRoute>
  );
}
