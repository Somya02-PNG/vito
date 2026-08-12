'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import SafetyPage from '@/app/dashboard/safety/page';

export default function CustomerSafetyPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <SafetyPage />
    </ProtectedRoute>
  );
}
