'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: 'primary' | 'secondary';
  };
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  accentColor = '#3B82F6',
  size = 'md',
}: EmptyStateProps) {
  const sizeConfig = {
    sm: { wrapper: 'py-8', icon: 'w-8 h-8', iconBox: 'w-12 h-12', title: 'text-sm', desc: 'text-xs' },
    md: { wrapper: 'py-12', icon: 'w-10 h-10', iconBox: 'w-16 h-16', title: 'text-base', desc: 'text-sm' },
    lg: { wrapper: 'py-16', icon: 'w-12 h-12', iconBox: 'w-20 h-20', title: 'text-lg', desc: 'text-sm' },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeConfig.wrapper} px-6 animate-fadeInUp`}>
      {/* Icon */}
      <div
        className={`${sizeConfig.iconBox} rounded-2xl flex items-center justify-center mb-4 border`}
        style={{
          background: `${accentColor}12`,
          borderColor: `${accentColor}30`,
        }}
      >
        <Icon
          className={sizeConfig.icon}
          style={{ color: accentColor }}
        />
      </div>

      {/* Text */}
      <h3 className={`font-bold text-white mb-2 ${sizeConfig.title}`}>{title}</h3>
      {description && (
        <p className={`text-slate-400 max-w-sm leading-relaxed ${sizeConfig.desc}`}>{description}</p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <a
              href={action.href}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                action.variant === 'secondary'
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  : 'text-white shadow-lg'
              }`}
              style={action.variant !== 'secondary' ? { background: accentColor, boxShadow: `0 4px 20px ${accentColor}40` } : undefined}
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                action.variant === 'secondary'
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  : 'text-white shadow-lg'
              }`}
              style={action.variant !== 'secondary' ? { background: accentColor, boxShadow: `0 4px 20px ${accentColor}40` } : undefined}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
