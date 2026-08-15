'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ROLE_THEMES, RoleType } from '@/components/navigation/RoleNavConfig';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  role: RoleType;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: { label: string; variant?: 'default' | 'success' | 'warning' | 'danger' };
}

export default function PageHeader({
  role,
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge,
}: PageHeaderProps) {
  const theme = ROLE_THEMES[role];

  const badgeVariants = {
    default: `${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`,
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    danger: 'bg-red-500/10 border-red-500/30 text-red-300',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div className="space-y-1.5">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-slate-400' : 'hover:text-slate-300 cursor-pointer'}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title Row */}
        <div className="flex items-center gap-3">
          {/* Role-accented left border */}
          <div
            className="w-1 h-7 rounded-full shrink-0"
            style={{ background: `linear-gradient(180deg, ${theme.accentHex}, ${theme.accentHex}80)` }}
          />
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>
            {badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeVariants[badge.variant ?? 'default']}`}>
                {badge.label}
              </span>
            )}
          </div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-slate-400 leading-relaxed pl-4">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions slot */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
