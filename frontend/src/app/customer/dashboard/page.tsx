'use client';

// This file re-exports the existing customer dashboard from /dashboard
// with role protection baked in via the layout.tsx
// The layout already enforces role='customer' via ProtectedRoute

import CustomerHomePage from '@/app/dashboard/page';

export default CustomerHomePage;
