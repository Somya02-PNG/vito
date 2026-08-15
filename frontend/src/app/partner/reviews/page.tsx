'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Star, ThumbsUp, MessageSquare, Car } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface Review {
  _id: string;
  customerName?: string;
  vehicleName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ reviews: Review[] }>('/api/partner/reviews');
      setReviews(res.data?.reviews || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Reviews</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Customer ratings and feedback for your fleet</p>
      </div>

      {!loading && !error && reviews.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-900/30 via-slate-900 to-slate-900 border border-teal-500/20 flex items-center gap-5">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{avg}</p>
            <div className="flex items-center gap-0.5 justify-center mt-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className={`w-4 h-4 ${parseFloat(avg!) >= i ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
              ))}
            </div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <p className="text-xs font-bold text-white">{reviews.length} total reviews</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Based on all customer ratings</p>
          </div>
        </div>
      )}

      <div className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-3">
        {loading ? <SkeletonList count={4} /> : error ? (
          <ErrorState message={error} onRetry={fetchReviews} />
        ) : reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews yet" description="Customers who complete bookings can leave reviews for your fleet. They'll show up here." accentColor="#14B8A6" />
        ) : reviews.map((r) => (
          <div key={r._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">{r.customerName || 'Customer'}</p>
                {r.vehicleName && <p className="text-[10px] text-teal-400 flex items-center gap-1 mt-0.5"><Car className="w-3 h-3" />{r.vehicleName}</p>}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${r.rating >= i ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                ))}
              </div>
            </div>
            {r.comment && <p className="text-[11px] text-slate-300 leading-relaxed">{r.comment}</p>}
            <p className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
