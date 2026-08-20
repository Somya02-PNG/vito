'use client';

import React from 'react';
import {
  Car,
  Sparkles,
  Shield,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Phone,
  Share2,
  ShieldAlert,
} from 'lucide-react';

export interface VehicleCategoryItem {
  id: string;
  name: string;
  categoryName: string;
  vehicleModel: string;
  seats: number;
  total: number;
  fareRange: string;
  eta: string;
  icon: string;
  description: string;
}

export interface RideBottomSheetProps {
  step: string;
  categories: VehicleCategoryItem[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  onConfirmBooking: () => void;
  isLoadingFare?: boolean;
  isCreatingBooking?: boolean;
  distanceKm?: number;
  durationMin?: number;
  otp?: string;
  driverInfo?: any;
  onCancelRide?: () => void;
  onShareRide?: () => void;
  onEmergencySOS?: () => void;
}

export default function RideBottomSheet({
  step,
  categories,
  selectedCategory,
  onSelectCategory,
  onConfirmBooking,
  isLoadingFare = false,
  isCreatingBooking = false,
  distanceKm,
  durationMin,
  otp,
  driverInfo,
  onCancelRide,
  onShareRide,
  onEmergencySOS,
}: RideBottomSheetProps) {
  return (
    <div className="w-full bg-[#0B1728]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
      {/* Category Selection / Fare Preview State */}
      {(step === 'VEHICLE_SELECT' || step === 'ROUTE_PREVIEW' || step === 'RIDE_ENTRY') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">
                Available Vehicle Options
              </h3>
              {distanceKm && (
                <p className="text-[11px] text-slate-400">
                  {distanceKm} km • ~{durationMin} mins travel time
                </p>
              )}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C2B3]/20 text-[#00E5D4] uppercase">
              Upfront Pricing
            </span>
          </div>

          {isLoadingFare ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00C2B3]" />
              <span>Calculating real road routes & fares...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#00C2B3]/15 border-[#00C2B3] shadow-md shadow-[#00C2B3]/10'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          isSelected ? 'bg-[#00C2B3] text-slate-950 font-bold' : 'bg-white/5 text-white'
                        }`}
                      >
                        🚗
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white">{cat.name}</h4>
                          <span className="text-[10px] text-slate-400">• {cat.seats} seats</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{cat.vehicleModel}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-[#00E5D4]">₹{cat.total}</p>
                      <p className="text-[10px] text-slate-400">{cat.eta || '3 min away'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={onConfirmBooking}
            disabled={isCreatingBooking || isLoadingFare}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00C2B3] to-[#00A99D] hover:from-[#00E5D4] hover:to-[#00C2B3] text-slate-950 font-black text-sm shadow-xl shadow-[#00C2B3]/25 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isCreatingBooking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming Booking with Driver Fleet...</span>
              </>
            ) : (
              <>
                <span>Confirm & Request Ride</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Driver Matching Pulse State */}
      {step === 'MATCHING_RADAR' && (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#00C2B3]/20 border border-[#00C2B3]/40 flex items-center justify-center mx-auto animate-pulse">
            <Car className="w-8 h-8 text-[#00E5D4]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Connecting with Nearby Drivers</h3>
            <p className="text-xs text-slate-400 mt-1">
              Dispatching your pickup request to verified drivers in 5km radius...
            </p>
          </div>
          {onCancelRide && (
            <button
              onClick={onCancelRide}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel Request
            </button>
          )}
        </div>
      )}

      {/* Active Driver Assigned / En Route / Arrived / Active Trip State */}
      {(step === 'DRIVER_ASSIGNED' ||
        step === 'DRIVER_ARRIVING' ||
        step === 'DRIVER_ARRIVED' ||
        step === 'ACTIVE_TRIP') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                {step.replace('_', ' ')}
              </span>
            </div>
            {otp && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <span>OTP:</span>
                <span className="font-mono text-sm tracking-widest text-amber-200">{otp}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#00C2B3]/20 flex items-center justify-center text-xl">
                👨‍✈️
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{driverInfo?.name || 'Vito Verified Partner'}</h4>
                <p className="text-[11px] text-slate-400">
                  {driverInfo?.vehicleModel || 'Prime Sedan'} •{' '}
                  <span className="font-mono text-[#00E5D4]">{driverInfo?.vehicleNo || 'DL-01-2026'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onShareRide && (
                <button
                  onClick={onShareRide}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Share Live Trip"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              {onEmergencySOS && (
                <button
                  onClick={onEmergencySOS}
                  className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 transition-colors"
                  title="Emergency SOS"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
