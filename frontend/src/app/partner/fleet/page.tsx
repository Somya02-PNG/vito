'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RentalDashboardPage from '@/app/partner/rental/dashboard/page';

export default function PartnerFleetPage() {
  return (
    <ProtectedRoute allowedRoles={['partner']} allowedPartnerTypes={['rental_partner']}>
      <RentalDashboardPage />
    </ProtectedRoute>
  );
}
