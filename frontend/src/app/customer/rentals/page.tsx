'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RentalFlow from '@/components/rentals/RentalFlow';

/**
 * /customer/rentals
 *
 * Vehicle Rental page — thin wrapper over RentalFlow.
 * All logic, state, and API calls live in RentalFlow.tsx.
 *
 * Shared infrastructure reuse (zero duplicates):
 *   - AddressAutocomplete (same as Cab, Hire a Driver)
 *   - EnhancedCabMap (same as Cab, Hire a Driver)
 *   - MockPaymentModal (same as Cab, Hire a Driver)
 */
export default function RentalsPage() {
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