'use client';

import React from 'react';
import { HelpCircle, MessageSquare, PhoneCall, ShieldAlert, ChevronRight, FileText } from 'lucide-react';

export default function CustomerSupportPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Help & Support</h1>
        <p className="text-sm text-slate-400 mt-1">Get 24/7 assistance for your bookings, driver queries, and safety features</p>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/30 to-slate-900 border border-blue-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Live AI Chat Support</h3>
            <p className="text-xs text-slate-400 mt-1">Instant resolution for trip questions, cancellations, and billing</p>
          </div>
          <button className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20">
            Start Live Chat
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Priority Phone Helpline</h3>
            <p className="text-xs text-slate-400 mt-1">Direct agent support line for ongoing active trips</p>
          </div>
          <button className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10">
            Call +1-800-VITO-RIDE
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">SOS Safety Escalation</h3>
            <p className="text-xs text-slate-400 mt-1">Emergency dispatch and police desk response</p>
          </div>
          <button className="mt-6 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/20">
            Open Emergency SOS
          </button>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="p-6 rounded-2xl bg-[#0B0F1C] border border-white/10 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {[
            'How do I cancel or reschedule a driver hire booking?',
            'What happens if my rental car experiences a breakdown?',
            'How does Vito calculate dynamic trip pricing & toll fees?',
            'Where can I apply promo codes and corporate discounts?',
          ].map((faq, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">{faq}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
