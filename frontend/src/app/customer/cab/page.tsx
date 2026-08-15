'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CabBookingFlow from '@/components/cab/CabBookingFlow';

export default function CustomerCabPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CabBookingFlow />
    </ProtectedRoute>
  );
}
