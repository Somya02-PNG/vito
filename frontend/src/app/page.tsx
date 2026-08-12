'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Zap, Loader2, ServerCrash, RefreshCw } from 'lucide-react';

export default function SplashPage() {
  const { user, loading, backendError, refetchUser, getDashboardPath } = useAuth();
  const router = useRouter();

  // Execute routing decision the moment authentication state is resolved
  useEffect(() => {
    if (loading) return;

    // If backend is down, do not redirect to login automatically; show retry UI below
    if (backendError) return;

    if (user) {
      // Authenticated user → redirect to role-specific dashboard
      router.replace(getDashboardPath(user));
    } else {
      // Unauthenticated or expired session → redirect to login
      router.replace('/login');
    }
  }, [user, loading, backendError, router, getDashboardPath]);

  // ─── Backend Service Error State ───────────────────────────────────────────
  if (!loading && backendError) {
    return (
      <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1),transparent_70%)] pointer-events-none" />
        <div className="w-full max-w-md relative z-10 text-center space-y-6 p-8 rounded-3xl bg-[#111827]/90 border border-red-500/20 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-950/40">
            <ServerCrash className="w-8 h-8 text-red-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Service Temporarily Unavailable</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Unable to connect to the VITO backend service. Please ensure the backend server is running or check your connection.
            </p>
          </div>

          <button
            onClick={() => refetchUser()}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-500 border border-red-500/40 shadow-lg shadow-red-950/50 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </main>
    );
  }

  // ─── Minimal Brand Splash Screen ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Subtle ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        {/* Minimal Glowing Brand Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-2xl shadow-blue-500/25">
          <div className="w-full h-full bg-[#07090E] rounded-[14.5px] flex items-center justify-center">
            <Zap className="w-8 h-8 text-blue-400 fill-blue-400/20" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-wider text-white">VITO</h1>
          <p className="text-[11px] font-semibold text-blue-400/80 uppercase tracking-[0.2em]">
            AI Mobility Platform
          </p>
        </div>

        {/* Small Loading Indicator */}
        <div className="pt-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Restoring session...</span>
        </div>
      </div>
    </main>
  );
}
