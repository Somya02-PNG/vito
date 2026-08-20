'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RentalFlow from '@/components/rentals/RentalFlow';

/**
 * /dashboard/rental
 *
 * VITO Premium Vehicle Rental Marketplace
 * Connects Customer Rental Flow with Rental Partner Fleet Inventory.
 */
export default function DashboardRentalPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#071118]">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <RentalFlow />
        </div>
      </div>
    </ProtectedRoute>
  );
}
