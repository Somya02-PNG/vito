'use client';

import React from 'react';
import {
  ShieldCheck,
  Star,
  Award,
  Car,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
} from 'lucide-react';

export interface DriverTrustProfile {
  id?: string;
  name: string;
  photo?: string;
  avatar?: string;
  rating: number;
  totalTrips?: number;
  experienceYears?: number;
  vehicleModel?: string;
  vehiclePlate?: string;
  phone?: string;
  verifiedBadges?: string[];
  bestMatchPercentage?: number;
  matchReasons?: string[];
  hourlyRate?: number;
}

interface DriverTrustCardProps {
  driver: DriverTrustProfile;
  onSelect?: () => void;
  actionLabel?: string;
  variant?: 'compact' | 'full' | 'hire';
}

export default function DriverTrustCard({
  driver,
  onSelect,
  actionLabel = 'Select Driver',
  variant = 'full',
}: DriverTrustCardProps) {
  const badges = driver.verifiedBadges || [
    'Identity Verified',
    'Driving License Verified',
    'Police Background Verified',
  ];

  return (
    <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-[0_4px_20px_rgba(7,17,31,0.06)] hover:shadow-[0_8px_28px_rgba(7,17,31,0.10)] transition-all space-y-4">
      {/* Top Header: Avatar + Name + Checkmark + Rating & Trips */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#07111F] text-white flex items-center justify-center text-sm font-black uppercase shadow-sm shrink-0 border border-[#E5EAF0]">
            {driver.photo ? (
              <img
                src={driver.photo}
                alt={driver.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              driver.avatar || driver.name.charAt(0)
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-[#0B1728] dark:text-white truncate">
                {driver.name}
              </h4>
              <ShieldCheck className="w-4 h-4 text-[#16A67A] shrink-0" />
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-xs font-black text-[#8C6A29]">
                <Star className="w-3.5 h-3.5 fill-[#C9A45C] text-[#C9A45C]" />
                {driver.rating.toFixed(2)}
              </span>
              <span className="text-[11px] text-[#8995A5]">·</span>
              <span className="text-[11px] text-[#526174] dark:text-slate-400 font-medium">
                {driver.totalTrips || 850}+ trips
              </span>
            </div>
          </div>
        </div>

        {/* Best Match Framing (For Driver Hire variant) */}
        {driver.bestMatchPercentage && (
          <span className="badge-vito-gold shrink-0">
            ★ {driver.bestMatchPercentage}% Match
          </span>
        )}
      </div>

      {/* Vehicle Model & Experience line */}
      <div className="flex items-center justify-between text-xs text-[#526174] dark:text-slate-400 pt-1 border-t border-[#E5EAF0] dark:border-[#17334F]">
        <div className="flex items-center gap-1.5 truncate">
          <Car className="w-3.5 h-3.5 text-[#00A99D] shrink-0" />
          <span className="font-semibold text-[#0B1728] dark:text-white truncate">
            {driver.vehicleModel || 'Maruti Dzire'}
          </span>
          {driver.vehiclePlate && (
            <span className="px-1.5 py-0.5 rounded bg-[#F1F5F8] dark:bg-[#10243A] text-[10px] font-mono font-bold text-[#0B1728] dark:text-white">
              {driver.vehiclePlate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 font-medium">
          <Clock className="w-3.5 h-3.5 text-[#8995A5]" />
          <span>{driver.experienceYears || 5} yrs exp</span>
        </div>
      </div>

      {/* Explicit Trust & Verification Badges (Identical Across Modules) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-[#8995A5] uppercase tracking-wider">
          Safety & Verification
        </p>
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F7F2] border border-[#16A67A]/25 text-[#16A67A] text-[10px] font-bold"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Why This Driver / Match Reasons (For Driver Hire) */}
      {driver.matchReasons && driver.matchReasons.length > 0 && (
        <div className="p-3 rounded-xl bg-[#F0FCFB] dark:bg-[#10243A]/60 border border-[#00C2B3]/20 space-y-1">
          <p className="text-[10px] font-bold text-[#00A99D] uppercase tracking-wider">
            Why this driver?
          </p>
          <div className="space-y-0.5">
            {driver.matchReasons.map((r, i) => (
              <p key={i} className="text-[11px] text-[#526174] dark:text-slate-300 font-medium">
                ✓ {r}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA / Action */}
      {onSelect && (
        <div className="pt-2 flex items-center justify-between gap-3">
          {driver.hourlyRate && (
            <div>
              <p className="text-[10px] text-[#8995A5] uppercase font-bold">Rate</p>
              <p className="text-sm font-extrabold text-[#0B1728] dark:text-white">
                ₹{driver.hourlyRate}
                <span className="text-[11px] text-[#8995A5] font-normal">/hr</span>
              </p>
            </div>
          )}

          <button
            onClick={onSelect}
            className="flex-1 py-3 px-4 rounded-xl bg-[#07111F] hover:bg-[#0B1728] text-white text-xs font-bold shadow-sm transition-all active:scale-95 text-center"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
