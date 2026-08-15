'use client';

import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import { RoleType } from './RoleNavConfig';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  role: RoleType;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ role, isOpen, onClose }: MobileDrawerProps) {
  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer content panel */}
      <div className="relative z-10 flex h-full max-w-xs w-full shadow-2xl animate-slideRight">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>

        <Sidebar
          role={role}
          isMobileDrawer={true}
          onCloseMobileDrawer={onClose}
        />
      </div>
    </div>
  );
}
