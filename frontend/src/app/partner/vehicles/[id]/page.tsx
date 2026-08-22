'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  CarFront,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Upload,
  Calendar,
  Key,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Archive,
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface DocumentRecord {
  _id: string;
  documentType: string;
  documentName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  expiresAt?: string;
  verificationStatus: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

interface VehicleDetail {
  _id: string;
  vehicleId: string;
  name: string;
  make: string;
  vehicleModel: string;
  variant?: string;
  year: number;
  registrationNumber: string;
  category: string;
  fuelType: string;
  transmission: string;
  seats: number;
  color: string;
  ownershipType: string;
  registeredOwnerName?: string;
  pricePerDay: number;
  depositAmount: number;
  mileagePolicy: string;
  city: string;
  address?: string;
  status: string;
  availabilityStatus: string;
  photos?: Array<{ category: string; url: string; originalFileName?: string }>;
  images?: string[];
  rejectionReason?: string;
}

export default function PartnerVehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [expiringSoonDocs, setExpiringSoonDocs] = useState<DocumentRecord[]>([]);
  const [isBookable, setIsBookable] = useState(false);
  const [eligibilityReasons, setEligibilityReasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Uploading state
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedDocTypeForUpload, setSelectedDocTypeForUpload] = useState<string>('RC');
  const [docExpiresAt, setDocExpiresAt] = useState('');

  // Availability toggle state
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{
        vehicle: VehicleDetail;
        documents: DocumentRecord[];
        expiringSoonDocs: DocumentRecord[];
        isBookable: boolean;
        eligibilityReasons: string[];
      }>(`/api/partner/vehicles/${vehicleId}`);

      if (res.data) {
        setVehicle(res.data.vehicle);
        setDocuments(res.data.documents || []);
        setExpiringSoonDocs(res.data.expiringSoonDocs || []);
        setIsBookable(res.data.isBookable);
        setEligibilityReasons(res.data.eligibilityReasons || []);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) fetchVehicleDetails();
  }, [vehicleId]);

  const handleTriggerDocUpload = (docType: string) => {
    setSelectedDocTypeForUpload(docType);
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Real native file picker
    }
  };

  const handleNativeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vehicle) return;

    setUploadingDocType(selectedDocTypeForUpload);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', selectedDocTypeForUpload);
      if (docExpiresAt) formData.append('expiresAt', docExpiresAt);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/partner/vehicles/${vehicle._id}/upload-document`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Upload failed');
      }

      await fetchVehicleDetails();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploadingDocType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleAvailability = async (newStatus: string) => {
    if (!vehicle) return;
    setUpdatingAvailability(true);
    try {
      await fetchAPI(`/api/partner/vehicles/${vehicle._id}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });
      await fetchVehicleDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update availability');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleArchiveVehicle = async () => {
    if (!vehicle) return;
    if (!confirm('Are you sure you want to archive this vehicle? Historical booking records will be retained.')) {
      return;
    }
    try {
      await fetchAPI(`/api/partner/vehicles/${vehicle._id}`, { method: 'DELETE' });
      router.push('/partner/fleet');
    } catch (err: any) {
      alert(err.message || 'Failed to archive vehicle');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm animate-pulse space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400" />
        <p>Loading vehicle profile & document compliance...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-8 rounded-3xl bg-[#0B101E] border border-red-500/30 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Vehicle Record Error</h2>
        <p className="text-xs text-slate-400">{error || 'Vehicle not found'}</p>
        <Link href="/partner/fleet" className="inline-block px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold">
          Back to Fleet
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-2 sm:px-4 py-4">
      {/* Hidden Native File Input for Re-uploading Documents */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleNativeFileChange}
      />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/partner/fleet" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet List
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {vehicle.name}
            </h1>
            <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-teal-500/10 border border-teal-500/30 text-teal-300">
              {vehicle.registrationNumber}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {vehicle.year} · {vehicle.category.toUpperCase()} · {vehicle.fuelType.toUpperCase()} · {vehicle.transmission.toUpperCase()} · {vehicle.city}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchVehicleDetails}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleArchiveVehicle}
            className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* ── STATUS BANNER & ELIGIBILITY DIAGNOSTICS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Verification Status */}
        <div className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Verification Lifecycle</span>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                vehicle.status === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : vehicle.status === 'UNDER_REVIEW'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : vehicle.status === 'REJECTED'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {vehicle.status}
            </span>
          </div>
          {vehicle.rejectionReason && (
            <p className="text-xs text-red-300 mt-1">Reason: {vehicle.rejectionReason}</p>
          )}
        </div>

        {/* Availability Toggle */}
        <div className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Customer Availability</span>
          <div className="flex items-center gap-2">
            <select
              value={vehicle.availabilityStatus}
              disabled={updatingAvailability}
              onChange={(e) => handleToggleAvailability(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#070A12] border border-white/20 text-white text-xs font-bold focus:border-teal-500 focus:outline-none"
            >
              <option value="AVAILABLE">AVAILABLE (Search Active)</option>
              <option value="UNAVAILABLE">UNAVAILABLE (Blackout)</option>
              <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
            </select>
          </div>
        </div>

        {/* Bookability Status */}
        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            isBookable
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-amber-950/20 border-amber-500/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Discovery Engine Status</span>
          <div className="flex items-center gap-2">
            {isBookable ? (
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 100% Bookable on Customer App
              </span>
            ) : (
              <span className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Excluded from Search
              </span>
            )}
          </div>
          {!isBookable && eligibilityReasons.length > 0 && (
            <p className="text-[11px] text-amber-200/80 line-clamp-2">
              {eligibilityReasons[0]}
            </p>
          )}
        </div>
      </div>

      {/* ── EXPIRATION WARNING (15-Day Alert Rule) ── */}
      {expiringSoonDocs.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Document Expiration Warning</p>
            <p className="text-amber-200/80">
              The following document(s) will expire soon: {expiringSoonDocs.map((d) => `${d.documentType} (Expires on ${new Date(d.expiresAt!).toLocaleDateString('en-IN')})`).join(', ')}. Please re-upload updated copies before expiry to prevent automatic removal from customer discovery.
            </p>
          </div>
        </div>
      )}

      {/* ── MANDATORY COMPLIANCE DOCUMENTS SECTION ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Compliance & RTO Documents</h2>
            <p className="text-xs text-slate-400">Authenticated private storage with verification auditing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['RC', 'INSURANCE', 'PUC', 'FITNESS', 'PERMIT', 'AUTHORIZATION_LETTER'].map((docType) => {
            const doc = documents.find((d) => d.documentType === docType);
            const isUploading = uploadingDocType === docType;

            return (
              <div
                key={docType}
                className="p-5 rounded-2xl bg-[#0B101E] border border-white/10 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase">{docType}</span>
                    {doc ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          doc.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : doc.verificationStatus === 'EXPIRED'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-500 border border-white/10">
                        NOT UPLOADED
                      </span>
                    )}
                  </div>

                  {doc ? (
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-300 truncate font-medium">{doc.originalFileName}</p>
                      <p className="text-[10px] text-slate-500">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                      </p>
                      {doc.expiresAt && (
                        <p className="text-[10px] text-teal-400">
                          Expires: {new Date(doc.expiresAt).toLocaleDateString('en-IN')}
                        </p>
                      )}
                      {doc.rejectionReason && (
                        <p className="text-[10px] text-red-400">Rejection: {doc.rejectionReason}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Document required for road compliance.</p>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {doc && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/partner/documents/${doc._id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold flex items-center gap-1 border border-white/10"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleTriggerDocUpload(docType)}
                    disabled={isUploading}
                    className="flex-1 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 text-[11px] font-bold border border-teal-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{doc ? 'Replace Document' : 'Upload Real File'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PHOTO GALLERY ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Vehicle Photos</h2>
          <p className="text-xs text-slate-400">High-resolution exterior, cabin, and odometer images</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {vehicle.photos && vehicle.photos.length > 0 ? (
            vehicle.photos.map((p, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-[#0B101E] border border-white/10 space-y-2">
                <div className="aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${p.url}`}
                    alt={p.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white capitalize">{p.category}</span>
                  <span className="text-slate-500">Verified Photo</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-6 rounded-2xl bg-[#0B101E] border border-white/10 text-center text-xs text-slate-400">
              No photos attached to this vehicle.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
