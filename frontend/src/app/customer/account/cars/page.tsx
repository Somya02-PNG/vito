'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CustomerVehicleManager from '@/components/customer-vehicles/CustomerVehicleManager';

export default function MyCarsPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm">
          <CustomerVehicleManager />
        </div>
      </div>
    </ProtectedRoute>
  );
}
