'use client';

import React from 'react';
import { Star } from 'lucide-react';

export default function PartnerReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#0B101E] border border-teal-500/20 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Star className="w-6 h-6 text-teal-400 fill-teal-400/20" />
          <span>Vehicle Fleet Reviews</span>
        </h1>
        <p className="text-xs text-slate-400">Renter ratings and vehicle condition feedback</p>
      </div>

      <div className="p-12 rounded-3xl bg-[#0B101E] border border-white/10 text-center space-y-2">
        <Star className="w-8 h-8 text-teal-400 mx-auto" />
        <h3 className="text-sm font-bold text-white">Fleet Reviews & Ratings</h3>
        <p className="text-xs text-slate-400">Renter reviews will be displayed in the upcoming phase.</p>
      </div>
    </div>
  );
}
