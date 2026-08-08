'use client';

import React, { useState } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  CreditCard,
  QrCode,
  Building,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  Receipt,
  Lock,
} from 'lucide-react';

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingType: 'cab' | 'rental' | 'driver_hire';
  totalFare: number;
  itemDescription?: string;
  driverId?: string;
  onPaymentSuccess?: (receipt: any) => void;
}

export default function MockPaymentModal({
  isOpen,
  onClose,
  bookingId,
  bookingType,
  totalFare,
  itemDescription = 'VITO Mobility Service',
  driverId,
  onPaymentSuccess,
}: MockPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cash'>('upi');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  if (!isOpen) return null;

  const commissionPct = 18;
  const platformCommission = Math.round(totalFare * (commissionPct / 100));
  const driverPayout = totalFare - platformCommission;

  const handlePay = async () => {
    setProcessing(true);

    try {
      const res = await fetchAPI<{ receipt: any }>('/api/payments/process', {
        method: 'POST',
        body: {
          bookingId,
          bookingType,
          totalFare,
          paymentMethod,
          commissionPct: 18,
          driverId,
        },
      });

      setTimeout(() => {
        setProcessing(false);
        if (res.data?.receipt) {
          setReceipt(res.data.receipt);
          onPaymentSuccess?.(res.data.receipt);
        } else {
          setReceipt({
            transactionRef: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            totalFare,
            platformCommission,
            driverPayout,
            paymentMethod,
            paymentStatus: 'completed',
          });
        }
      }, 1200);
    } catch {
      setTimeout(() => {
        setProcessing(false);
        setReceipt({
          transactionRef: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          totalFare,
          platformCommission,
          driverPayout,
          paymentMethod,
          paymentStatus: 'completed',
        });
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel-glow rounded-3xl max-w-md w-full p-6 space-y-5 border-primary-500/30 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {!receipt ? (
          <>
            {/* Header */}
            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold text-primary-300 uppercase tracking-wider w-fit mb-1.5">
                <Lock className="w-3 h-3" /> 256-Bit Encrypted Gateway
              </div>
              <h3 className="text-xl font-extrabold text-white">Payment & Settlement</h3>
              <p className="text-xs text-slate-400 mt-0.5">{itemDescription}</p>
            </div>

            {/* Total Fare & Commission Breakdown Preview */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Rider Charge</span>
                <span className="text-xl font-black text-white">₹{totalFare.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-white/[0.06] pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Platform Commission ({commissionPct}%)</span>
                  <span className="font-semibold text-rose-400">−₹{platformCommission}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Driver / Host Net Payout (82%)</span>
                  <span className="font-extrabold text-emerald-400">₹{driverPayout.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Options */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Select Payment Method
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'upi', name: 'Instant UPI / GPay', icon: QrCode, color: 'text-emerald-400' },
                  { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, color: 'text-blue-400' },
                  { id: 'netbanking', name: 'Netbanking', icon: Building, color: 'text-violet-400' },
                  { id: 'cash', name: 'Cash on Arrival', icon: Banknote, color: 'text-amber-400' },
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary-500/15 border-primary-500/40 text-white shadow-sm'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.12] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1.5 ${method.color}`} />
                      <p className="text-xs font-bold text-white">{method.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Securing Payment & Transferring Payout...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Pay ₹{totalFare.toLocaleString('en-IN')} & Complete
                </>
              )}
            </button>
          </>
        ) : (
          /* SUCCESS RECEIPT VIEW */
          <div className="text-center py-2 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">Payment Completed!</h3>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">Ref: {receipt.transactionRef}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Charged</span>
                <span className="font-bold text-white">₹{receipt.totalFare.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Platform Fee (18%)</span>
                <span className="font-semibold">−₹{receipt.platformCommission}</span>
              </div>
              <div className="flex justify-between text-emerald-400 pt-1 border-t border-white/[0.06]">
                <span className="font-bold">Credited to Driver Wallet (82%)</span>
                <span className="font-extrabold">₹{receipt.driverPayout.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Done & Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
