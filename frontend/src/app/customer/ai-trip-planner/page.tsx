'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import PlannerPage from '@/app/dashboard/planner/page';

export default function CustomerAITripPlannerPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <PlannerPage />
    </ProtectedRoute>
  );
}
