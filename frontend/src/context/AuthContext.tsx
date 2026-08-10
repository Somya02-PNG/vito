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
  role: 'customer' | 'partner';
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
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  getDashboardPath: (user: AuthUser) => string;
}

// ─── Helper: Get dashboard path based on role ─────────────────────────────────
export const getDashboardPath = (user: AuthUser): string => {
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'partner') {
    if (user.status === 'pending') return '/partner/pending';
    if (user.partnerType === 'rental_partner') return '/partner/rental/dashboard';
    return '/partner/driver/dashboard';
  }
  // Backward compat: legacy 'driver' role
  if (user.role === 'driver') return '/partner/driver/dashboard';
  // Default: customer
  return '/customer/dashboard';
};

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetchAPI<{ user: AuthUser }>('/api/auth/me');
        setUser(res.data?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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
        signup,
        login,
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
