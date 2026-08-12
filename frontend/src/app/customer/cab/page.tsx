'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CabPage from '@/app/dashboard/cab/page';

export default function CustomerCabPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CabPage />
    </ProtectedRoute>
  );
}
