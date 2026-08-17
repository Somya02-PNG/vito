'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RentalComplianceView from '@/components/admin/RentalComplianceView';

export default function AdminRentalsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#071118]">
        <RentalComplianceView />
      </div>
    </ProtectedRoute>
  );
}
