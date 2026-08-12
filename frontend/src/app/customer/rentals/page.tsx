'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RentalPage from '@/app/dashboard/rental/page';

export default function CustomerRentalsPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <RentalPage />
    </ProtectedRoute>
  );
}
