'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'partner' | 'driver' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended' | 'blocked';
export type PartnerType = 'driver' | 'rental_partner';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  partnerType: PartnerType | null;
  status: UserStatus;
  createdAt: string;
}

export interface SignupPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: 'customer' | 'partner' | 'driver';
  partnerType?: PartnerType;
  licenseNumber?: string;
  experience?: number;
  city?: string;
  businessName?: string;
  fleetCount?: number;
  hourlyRate?: number;
}

interface LoginPayload {
  email: string;
  password: string;
  requiredRole?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  backendError: string | null;
  refetchUser: () => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  demoLogin: (role: 'customer' | 'driver' | 'partner' | 'admin') => Promise<AuthUser>;
  logout: () => Promise<void>;
  getDashboardPath: (user: AuthUser) => string;
}

// ─── Helper: Get dashboard path based on role ─────────────────────────────────
export const getDashboardPath = (user: AuthUser): string => {
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'partner') {
    if (user.status === 'pending') return '/partner/pending';
    if (user.partnerType === 'rental_partner') return '/partner/dashboard';
    return '/driver/home';
  }
  if (user.role === 'driver') return '/driver/home';
  return '/customer/home';
};

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Rehydrate session on mount
  const fetchUser = useCallback(async () => {
    setLoading(true);
    setBackendError(null);
    try {
      const res = await fetchAPI<{ user: AuthUser }>('/api/auth/me');
      setUser(res.data?.user ?? null);
    } catch (err: any) {
      setUser(null);
      // 401 indicates unauthenticated / session expired (normal for unauth state)
      if (err?.statusCode === 401) {
        setBackendError(null);
      } else {
        // Backend service outage or network issue
        setBackendError(err?.message || 'Unable to connect to VITO backend service.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signup = useCallback(async (payload: SignupPayload) => {
    const res = await fetchAPI<{ user: AuthUser }>('/api/auth/signup', {
      method: 'POST',
      body: payload as any,
    });
    setUser(res.data?.user ?? null);
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser> => {
    const res = await fetchAPI<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: payload,
    });
    const authUser = res.data?.user ?? null;
    setUser(authUser);
    if (!authUser) throw new Error('Login failed.');
    return authUser;
  }, []);

  const demoLogin = useCallback(async (role: 'customer' | 'driver' | 'partner' | 'admin'): Promise<AuthUser> => {
    const res = await fetchAPI<{ user: AuthUser }>('/api/auth/demo-login', {
      method: 'POST',
      body: { role },
    });
    const authUser = res.data?.user ?? null;
    setUser(authUser);
    if (!authUser) throw new Error('Demo login failed.');
    return authUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetchAPI('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const getDashboardPathBound = useCallback((u: AuthUser) => getDashboardPath(u), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        backendError,
        refetchUser: fetchUser,
        signup,
        login,
        demoLogin,
        logout,
        getDashboardPath: getDashboardPathBound,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
