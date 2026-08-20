'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  ShieldCheck,
  Eye,
  Calendar,
  X,
} from 'lucide-react';

interface DriverDoc {
  id: string;
  name: string;
  category: 'DRIVER' | 'VEHICLE';
  docNumber: string;
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'PENDING';
  validTill: string;
  fileName: string;
}

export default function DriverDocumentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'driver' | 'vehicle'>('all');
  const [selectedDoc, setSelectedDoc] = useState<DriverDoc | null>(null);

  const [docs, setDocs] = useState<DriverDoc[]>([
    {
      id: 'doc_1',
      name: 'Commercial Driving Licence (LMV / Transport)',
      category: 'DRIVER',
      docNumber: 'DL-04-2022-771891',
      status: 'VERIFIED',
      validTill: '14 May 2032',
      fileName: 'driving_licence_front_back.pdf',
    },
    {
      id: 'doc_2',
      name: 'Government Identity Proof (Aadhaar Card)',
      category: 'DRIVER',
      docNumber: 'XXXX-XXXX-8819',
      status: 'VERIFIED',
      validTill: 'Lifetime',
      fileName: 'aadhaar_card_verified.pdf',
    },
    {
      id: 'doc_3',
      name: 'Police Background Verification Certificate',
      category: 'DRIVER',
      docNumber: 'PCC-UP-8921-2025',
      status: 'VERIFIED',
      validTill: '20 Nov 2026',
      fileName: 'police_clearance_certificate.pdf',
    },
    {
      id: 'doc_4',
      name: 'Vehicle Registration Certificate (RC)',
      category: 'VEHICLE',
      docNumber: 'UP-78-TX-9901',
      status: 'VERIFIED',
      validTill: '08 Mar 2035',
      fileName: 'vehicle_rc_smartcard.pdf',
    },
    {
      id: 'doc_5',
      name: 'Commercial Vehicle Comprehensive Insurance',
      category: 'VEHICLE',
      docNumber: 'POL-ICICI-9928172',
      status: 'VERIFIED',
      validTill: '18 Dec 2026',
      fileName: 'insurance_policy_schedule.pdf',
    },
    {
      id: 'doc_6',
      name: 'Pollution Under Control Certificate (PUC)',
      category: 'VEHICLE',
      docNumber: 'PUC-2026-8812',
      status: 'VERIFIED',
      validTill: '15 Jan 2027',
      fileName: 'puc_certificate.pdf',
    },
  ]);

  const filteredDocs = docs.filter((d) => {
    if (activeTab === 'driver') return d.category === 'DRIVER';
    if (activeTab === 'vehicle') return d.category === 'VEHICLE';
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={['driver', 'partner']}>
      <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
        {/* Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07111F] text-white border border-[#17334F] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase text-[#00C2B3] bg-[#00C2B3]/10 px-2.5 py-0.5 rounded-full">
              Trust & Compliance Vault
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">Driver & Vehicle Documents</h1>
            <p className="text-xs text-slate-400">
              Verified legal credentials for commercial chauffeuring and operating authorization.
            </p>
          </div>

          <div className="flex bg-[#10243A] p-1 rounded-2xl border border-slate-700">
            {(['all', 'driver', 'vehicle'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#00C2B3] text-[#07111F] shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All Documents' : tab === 'driver' ? 'Driver Only' : 'Vehicle Docs'}
              </button>
            ))}
          </div>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0B1728] dark:text-white">{doc.name}</h3>
                    <span className="text-[11px] font-mono text-[#526174]">{doc.docNumber}</span>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              </div>

              <div className="pt-3 border-t border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between text-xs text-[#8995A5]">
                <span>Valid Till: <strong className="text-[#0B1728] dark:text-white">{doc.validTill}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className="text-xs font-bold text-[#00A99D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View Document Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#0B1728] dark:text-white">{selectedDoc.name}</h3>
                  <p className="text-xs text-[#526174]">{selectedDoc.docNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 rounded-2xl bg-[#07111F] text-center text-white space-y-2 border border-slate-700">
                <ShieldCheck className="w-12 h-12 text-[#00C2B3] mx-auto" />
                <p className="font-bold text-xs">VITO Official Document Verification Seal</p>
                <p className="text-[11px] text-slate-400 font-mono">File: {selectedDoc.fileName}</p>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase mt-2">
                  Authenticated & Encrypted
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#07111F] text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
