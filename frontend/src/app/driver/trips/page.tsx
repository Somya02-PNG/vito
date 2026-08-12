'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DriverDashboardPage from '@/app/partner/driver/dashboard/page';

export default function DriverTripsPage() {
  return (
    <ProtectedRoute allowedRoles={['partner', 'driver']} allowedPartnerTypes={['driver']}>
      <DriverDashboardPage />
    </ProtectedRoute>
  );
}
