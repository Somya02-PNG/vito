'use client';

import { useAuth, getDashboardPath, PartnerType } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedPartnerTypes?: PartnerType[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  allowedPartnerTypes,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → redirect to appropriate login
    if (!user) {
      router.replace(redirectTo || '/login');
      return;
    }

    // Role not allowed → redirect to their actual dashboard
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDashboardPath(user));
      return;
    }

    // Partner type not allowed → redirect
    if (allowedPartnerTypes && user.partnerType && !allowedPartnerTypes.includes(user.partnerType)) {
      router.replace(getDashboardPath(user));
      return;
    }
  }, [user, loading, router, allowedRoles, allowedPartnerTypes, redirectTo]);

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090E]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) return null;

  // Suspended or blocked
  if (user.status === 'suspended' || user.status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090E] px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Account {user.status === 'suspended' ? 'Suspended' : 'Blocked'}</h2>
          <p className="text-sm text-slate-400">
            {user.status === 'suspended'
              ? 'Your account has been temporarily suspended. Please contact support@vito.com.'
              : 'Your account has been blocked. Please contact support@vito.com for assistance.'}
          </p>
        </div>
      </div>
    );
  }

  // Role not allowed (render nothing, redirect happens in useEffect)
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  // Partner type check
  if (allowedPartnerTypes && user.partnerType && !allowedPartnerTypes.includes(user.partnerType)) return null;

  return <>{children}</>;
}
