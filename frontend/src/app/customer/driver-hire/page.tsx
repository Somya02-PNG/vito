'use client';

import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';

const DriverHireFlow = dynamic(() => import('@/components/driver-hire/DriverHireFlow'), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-slate-400">Loading Hire a Driver...</div>,
});

export default function DriverHirePage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="py-2">
        <DriverHireFlow />
      </div>
    </ProtectedRoute>
  );
}
