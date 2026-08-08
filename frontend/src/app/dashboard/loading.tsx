'use client';

import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-white/[0.08]" />
          <div className="h-8 w-64 rounded-xl bg-white/[0.06]" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-white/[0.06]" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/[0.04] p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-white/[0.06]" />
            <div className="h-6 w-28 rounded bg-white/[0.08]" />
          </div>
        ))}
      </div>

      {/* Content Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="h-96 rounded-2xl bg-white/[0.04]" />
        <div className="h-96 rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
