'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DriverHireFlow from '@/components/driver-hire/DriverHireFlow';

export default function DriverHirePage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="py-2">
        <DriverHireFlow />
      </div>
    </ProtectedRoute>
  );
}
