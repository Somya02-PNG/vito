'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

function SkeletonLine({ className = '' }: SkeletonProps) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="p-5 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] space-y-3">
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-8 w-32" />
      <SkeletonLine className="h-3 w-20" />
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-3/4" />
        <SkeletonLine className="h-2.5 w-1/2" />
      </div>
      <SkeletonLine className="h-3 w-16 shrink-0" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-[#0B0F1C] border border-white/[0.06] space-y-4">
      <div className="flex items-start justify-between">
        <div className="skeleton w-11 h-11 rounded-xl" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-3/5" />
        <SkeletonLine className="h-3 w-4/5" />
        <SkeletonLine className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-48" />
        <SkeletonLine className="h-4 w-72" />
      </div>
      <div className="skeleton h-9 w-32 rounded-xl" />
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function SkeletonStatGrid({ count = 4, columns = 4 }: SkeletonGridProps) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${colClass} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}

export default SkeletonCard;
