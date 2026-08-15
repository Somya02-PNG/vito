'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load this data. Check your connection and try again.',
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-sm">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-red-300 flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-bold transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}
