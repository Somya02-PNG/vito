'use client';

import React, { useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DriverDashboardPage from '@/app/dashboard/driver/page';

function DriverDashboardGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    // Check partner type: must be driver or legacy driver role
    const isDriverPartner =
      (user.role === 'partner' && user.partnerType === 'driver') ||
      user.role === 'driver';

    if (!isDriverPartner) {
      router.replace(getDashboardPath(user));
      return;
    }

    // If pending, redirect to pending page
    if (user.status === 'pending') {
      router.replace('/partner/pending');
    }
  }, [user, loading, router]);

  return <DriverDashboardPage />;
}

export default function PartnerDriverDashboardPage() {
  return (
    <ProtectedRoute
      allowedRoles={['partner', 'driver']}
      redirectTo="/partner/login"
    >
      <DriverDashboardGuard />
    </ProtectedRoute>
  );
}
