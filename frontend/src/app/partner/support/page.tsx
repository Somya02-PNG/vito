'use client';

import React from 'react';
import { LifeBuoy, Building2, ShieldCheck, Mail, PhoneCall } from 'lucide-react';

export default function PartnerSupportPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Fleet Operator Dedicated Support</h1>
        <p className="text-sm text-slate-400 mt-1">Direct support line for fleet management, payout inquiries, and rental vehicle insurance claims</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#0B101E] border border-teal-500/20 shadow-xl">
          <Building2 className="w-8 h-8 text-teal-400 mb-3" />
          <h3 className="text-base font-bold text-white">Account Manager</h3>
          <p className="text-xs text-slate-400 mt-1">Dedicated Vito partner manager for fleet onboarding & growth</p>
          <button className="mt-4 w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs">
            Contact Account Manager
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B101E] border border-teal-500/20 shadow-xl">
          <ShieldCheck className="w-8 h-8 text-teal-400 mb-3" />
          <h3 className="text-base font-bold text-white">Insurance Claims Desk</h3>
          <p className="text-xs text-slate-400 mt-1">Submit & track rental vehicle damage claims & insurance processing</p>
          <button className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs">
            File Insurance Claim
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B101E] border border-teal-500/20 shadow-xl">
          <PhoneCall className="w-8 h-8 text-teal-400 mb-3" />
          <h3 className="text-base font-bold text-white">Financial Support Hotline</h3>
          <p className="text-xs text-slate-400 mt-1">Queries regarding weekly payout settlements & GST invoicing</p>
          <button className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs">
            Call Partner Desk
          </button>
        </div>
      </div>
    </div>
  );
}
