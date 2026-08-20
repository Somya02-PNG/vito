'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Siren,
  PhoneCall,
  AlertTriangle,
  FileText,
  MapPin,
  Eye,
  ChevronRight,
  CheckCircle2,
  Share2,
  Shield,
  LifeBuoy,
  X,
} from 'lucide-react';

export default function DriverSafetyPage() {
  const { user } = useAuth();
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('Passenger Misconduct');
  const [reportText, setReportText] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const safetyProtocols = [
    { title: 'GPS Telemetry Recording', desc: 'Active trip coordinates and route traces are encrypted & monitored 24/7.' },
    { title: 'Night Driving Safety Checkpoints', desc: 'Automated prompt checks for long-distance outstation duty between 11 PM – 5 AM.' },
    { title: 'Zero Tolerance Alcohol & Drug Policy', desc: 'Strict platform protection ensuring driver and passenger integrity.' },
  ];

  return (
    <ProtectedRoute allowedRoles={['driver', 'partner']}>
      <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
        {/* Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full">
              Driver Protection & Emergency
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">Driver Safety Center</h1>
            <p className="text-xs text-slate-400">
              Immediate emergency assistance, live route monitoring, and incident reporting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:18008486723"
              className="px-5 py-3 rounded-2xl bg-[#10243A] hover:bg-[#17334F] text-white text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" /> 24/7 Helpline
            </a>
          </div>
        </div>

        {/* SOS Banner with accidental protection */}
        <div className="p-6 sm:p-8 rounded-3xl bg-red-950/40 border-2 border-red-500/50 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                <Siren className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-white">Emergency Assistance (Driver SOS)</h2>
                <p className="text-xs text-red-200 max-w-lg">
                  Instantly transmits your emergency location to VITO Safety Operations and alerts local police dispatch. Protected by a confirmation modal to avoid accidental triggers.
                </p>
              </div>
            </div>

            {sosActive ? (
              <button
                type="button"
                onClick={() => setSosActive(false)}
                className="px-6 py-3.5 rounded-2xl bg-slate-800 text-slate-200 text-xs font-black uppercase hover:bg-slate-700 cursor-pointer shrink-0"
              >
                Cancel SOS
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSosModalOpen(true)}
                className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-xl transition-all cursor-pointer shrink-0"
              >
                🚨 ACTIVATE SOS
              </button>
            )}
          </div>

          {sosActive && (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold animate-fadeIn">
              🚨 Live Emergency Beacon Active. Safety Desk agent is monitoring your vehicle coordinates.
            </div>
          )}
        </div>

        {/* Safety Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Incident Report Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0B1728] dark:text-white">Report Unsafe Situation</h3>
                <p className="text-xs text-[#526174]">Report passenger misconduct, road hazards, or breakdowns</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-[#07111F] text-white text-xs font-bold hover:bg-[#00C2B3] hover:text-[#07111F] transition-all cursor-pointer"
            >
              Submit Incident Report →
            </button>
          </div>

          {/* Live Route Sharing Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0B1728] dark:text-white">Share Live Journey</h3>
                <p className="text-xs text-[#526174]">Share real-time tracking link with family or fleet manager</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Live telemetry tracking link copied: https://vito.ai/track/driver-live')}
              className="w-full py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold text-[#0B1728] dark:text-white hover:bg-slate-100 cursor-pointer"
            >
              Copy Live Tracking Link
            </button>
          </div>
        </div>

        {/* Safety Guidelines */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4">
          <h3 className="text-base font-black text-[#0B1728] dark:text-white">Active Chauffeur Protection Standards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {safetyProtocols.map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-1">
                <h4 className="font-bold text-[#0B1728] dark:text-white">{p.title}</h4>
                <p className="text-[#526174]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SOS Confirmation Modal */}
        {sosModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border-2 border-red-500 shadow-2xl space-y-6 text-center">
              <div className="w-14 h-14 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Siren className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#0B1728] dark:text-white">Confirm SOS Dispatch?</h3>
                <p className="text-xs text-[#526174]">
                  Are you sure you want to activate emergency assistance? This immediately engages the safety command center.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSosModalOpen(false)}
                  className="py-3 rounded-2xl border text-xs font-bold text-[#526174] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSosModalOpen(false);
                    setSosActive(true);
                  }}
                  className="py-3 rounded-2xl bg-red-600 text-white text-xs font-black shadow-lg cursor-pointer"
                >
                  Confirm SOS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Incident Report Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[#0B1728] dark:text-white">Report Unsafe Incident</h3>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-sm text-emerald-900">Incident Logged</h4>
                  <p className="text-xs text-emerald-700">
                    VITO Support has received your report and will follow up with you.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1728] dark:text-white">Category</label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                    >
                      <option value="Passenger Misconduct">Passenger Misconduct / Refusal</option>
                      <option value="Hazardous Weather / Roads">Hazardous Weather / Closed Expressway</option>
                      <option value="Vehicle Breakdown">Vehicle Breakdown / Mechanical Failure</option>
                      <option value="Other">Other Safety Concern</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1728] dark:text-white">Description</label>
                    <textarea
                      rows={3}
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Describe what occurred during the trip..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border text-xs font-bold text-[#526174] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportSubmitted(true);
                        setTimeout(() => {
                          setReportSubmitted(false);
                          setReportModalOpen(false);
                        }, 2000);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-[#07111F] text-white text-xs font-bold cursor-pointer"
                    >
                      Submit Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
