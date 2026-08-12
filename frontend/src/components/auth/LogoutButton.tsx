'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, AlertCircle } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}

export default function LogoutButton({ className = '', showText = false }: LogoutButtonProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setShowConfirm(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20 text-xs font-semibold ${className}`}
        title="Log Out of VITO"
        aria-label="Log Out of VITO"
      >
        <LogOut className="w-4 h-4" />
        {showText && <span>Logout</span>}
      </button>

      {/* Lightweight Confirmation Dropdown */}
      {showConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowConfirm(false)}
          />
          <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-[#0B101D] border border-red-500/30 shadow-2xl shadow-black/80 z-50 text-left space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Log out of VITO?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Are you sure you want to end your current session? You will be redirected to the login gateway.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1 active:scale-95"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Logout</span>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
