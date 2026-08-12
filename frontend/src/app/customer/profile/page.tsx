'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import ProfilePage from '@/app/dashboard/profile/page';

export default function CustomerProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <ProfilePage />
    </ProtectedRoute>
  );
}
