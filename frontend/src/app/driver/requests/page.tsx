'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DriverDashboardPage from '@/app/partner/driver/dashboard/page';

export default function DriverRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={['partner', 'driver']} allowedPartnerTypes={['driver']}>
      <DriverDashboardPage />
    </ProtectedRoute>
  );
}
