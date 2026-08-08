'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'customer' | 'driver' | 'admin';
  createdAt: string;
}

interface SignupPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: 'customer' | 'driver';
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

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
      body: payload,
    });
    setUser(res.data?.user ?? null);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await fetchAPI<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: payload,
    });
    setUser(res.data?.user ?? null);
  }, []);

  const logout = useCallback(async () => {
    await fetchAPI('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
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
