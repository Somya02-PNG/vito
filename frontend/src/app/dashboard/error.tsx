'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Exception:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="glass-panel-glow rounded-3xl p-8 max-w-md w-full border-rose-500/30 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-white">Something Went Wrong</h2>
          <p className="text-xs text-slate-400 mt-1">
            {error?.message || 'An unexpected error occurred while loading this view.'}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/25 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
