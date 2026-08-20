'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
  Car,
  CheckCircle2,
  ShieldCheck,
  Fuel,
  Users,
  Settings,
  Edit3,
  Award,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function DriverVehiclePage() {
  const { user } = useAuth();
  // Driver Type state: 'DRIVER_WITH_VEHICLE' | 'DRIVER_ONLY'
  const [driverType, setDriverType] = useState<'DRIVER_WITH_VEHICLE' | 'DRIVER_ONLY'>('DRIVER_WITH_VEHICLE');

  return (
    <ProtectedRoute allowedRoles={['driver', 'partner']}>
      <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
        {/* Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase text-[#00C2B3] bg-[#00C2B3]/10 px-2.5 py-0.5 rounded-full">
              Fleet & Operational Assignment
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">Vehicle Profile</h1>
            <p className="text-xs text-slate-400">
              Manage your registered commercial fleet or independent chauffeuring qualifications.
            </p>
          </div>

          {/* Mode Switcher Toggle */}
          <div className="flex bg-[#10243A] p-1 rounded-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => setDriverType('DRIVER_WITH_VEHICLE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                driverType === 'DRIVER_WITH_VEHICLE'
                  ? 'bg-[#00C2B3] text-[#07111F] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Driver + Vehicle (Cab)
            </button>
            <button
              type="button"
              onClick={() => setDriverType('DRIVER_ONLY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                driverType === 'DRIVER_ONLY'
                  ? 'bg-[#00C2B3] text-[#07111F] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Driver Only (Chauffeur)
            </button>
          </div>
        </div>

        {/* ─── TYPE B: DRIVER + VEHICLE VIEW ───────────────────────────────── */}
        {driverType === 'DRIVER_WITH_VEHICLE' ? (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border-2 border-[#00C2B3] shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5EAF0] dark:border-[#17334F] pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active & Eligible for Cab Requests
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B1728] dark:text-white">
                    Toyota Innova Crysta 2.4 ZX
                  </h2>
                  <p className="font-mono text-xs font-bold text-[#00A99D]">Registration: UP-78-TX-9901</p>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Editing vehicle specifications modal')}
                  className="px-4 py-2.5 rounded-xl border border-[#E5EAF0] text-xs font-bold text-[#526174] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 self-start"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Specs
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                  <span className="text-[#8995A5] uppercase font-bold text-[10px]">Category</span>
                  <p className="font-bold text-[#0B1728] dark:text-white">Premium MUV / SUV</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                  <span className="text-[#8995A5] uppercase font-bold text-[10px]">Seating Capacity</span>
                  <p className="font-bold text-[#0B1728] dark:text-white">7 Passengers</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                  <span className="text-[#8995A5] uppercase font-bold text-[10px]">Transmission</span>
                  <p className="font-bold text-[#0B1728] dark:text-white">6-Speed Automatic</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                  <span className="text-[#8995A5] uppercase font-bold text-[10px]">Fuel Type</span>
                  <p className="font-bold text-[#0B1728] dark:text-white">Diesel (BS6)</p>
                </div>
              </div>

              {/* Compliance Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Commercial RC Verified
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Insurance Valid (Dec 2026)
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Annual Fitness Certified
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─── TYPE A: DRIVER ONLY (INDEPENDENT CHAUFFEUR) VIEW ─────────────── */
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-3xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center shrink-0">
                  <Award className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#00A99D] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Independent Chauffeur Profile
                  </span>
                  <h2 className="text-xl font-black text-[#0B1728] dark:text-white">
                    Certified Professional Chauffeur
                  </h2>
                  <p className="text-xs text-[#526174]">
                    You operate customer-provided vehicles for hourly and outstation driver hire bookings.
                  </p>
                </div>
              </div>

              {/* Certified Transmission & Vehicle Classes */}
              <div className="p-6 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#526174]">
                  CERTIFIED DRIVING QUALIFICATIONS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#07111F] border flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00C2B3]" /> Manual & Automatic Transmissions
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#07111F] border flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00C2B3]" /> Luxury Sedans & SUVs (4x4)
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#07111F] border flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00C2B3]" /> Outstation Expressway Specialist
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-900 border border-blue-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" /> Customer Vehicle Guarantee
                </div>
                <p className="text-blue-800">
                  During Driver Hire duty, the customer supplies their registered vehicle (with comprehensive insurance). You are covered under VITO Chauffeur On-Duty Protection.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
