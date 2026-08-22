'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import {
  CarFront,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  CalendarDays,
  DollarSign,
  Fuel,
  Settings,
  Users,
  Image as ImageIcon,
  Loader2,
  X,
  File,
  Eye,
  Building,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface PhotoUploadState {
  file: File | null;
  previewUrl: string | null;
  progress: number;
  uploaded: boolean;
  error: string | null;
}

interface DocUploadState {
  file: File | null;
  fileName: string | null;
  fileSize: number | null;
  expiresAt: string;
  progress: number;
  uploaded: boolean;
  error: string | null;
}

const PHOTO_CATEGORIES = [
  { id: 'front', label: 'Front Exterior View', required: true },
  { id: 'rear', label: 'Rear Exterior View', required: true },
  { id: 'left', label: 'Left Side Profile', required: true },
  { id: 'right', label: 'Right Side Profile', required: true },
  { id: 'interior', label: 'Cabin / Seats Interior', required: true },
  { id: 'dashboard', label: 'Dashboard & Steering', required: true },
  { id: 'odometer', label: 'Odometer (Current Km)', required: true },
  { id: 'additional', label: 'Boot / Additional Angle', required: false },
] as const;

const DOCUMENT_CATEGORIES = [
  { id: 'RC', label: 'Registration Certificate (Smart Card RC)', required: true, description: 'Clear copy of RC issued by RTO' },
  { id: 'INSURANCE', label: 'Commercial Comprehensive Insurance', required: true, description: 'Active policy with zero-depreciation' },
  { id: 'PUC', label: 'Pollution Under Control (PUC) Certificate', required: true, description: 'Valid emission test certificate' },
  { id: 'FITNESS', label: 'Vehicle Fitness Certificate', required: true, description: 'Mandatory commercial fitness certificate' },
  { id: 'PERMIT', label: 'Commercial Permit / All India Tourist Permit', required: false, description: 'Required for interstate travel' },
  { id: 'AUTHORIZATION_LETTER', label: 'Owner Authorization / Lease Agreement', required: false, description: 'Mandatory if registered owner differs from partner' },
] as const;

export default function NewVehicleRegistrationPage() {
  const router = useRouter();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [vehicleMongoId, setVehicleMongoId] = useState<string | null>(null);
  const [vehicleCode, setVehicleCode] = useState<string | null>(null);

  // Form Field State
  const [make, setMake] = useState('Hyundai');
  const [vehicleModel, setVehicleModel] = useState('Creta');
  const [variant, setVariant] = useState('SX(O) 1.5 Diesel');
  const [year, setYear] = useState('2023');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [category, setCategory] = useState('suv');
  const [fuelType, setFuelType] = useState('diesel');
  const [transmission, setTransmission] = useState('automatic');
  const [seats, setSeats] = useState('5');
  const [color, setColor] = useState('Polar White');

  // Ownership Details
  const [ownershipType, setOwnershipType] = useState<'OWNED_BY_PARTNER' | 'OWNED_BY_AGENCY' | 'LEASED' | 'AUTHORIZED_USE'>('OWNED_BY_PARTNER');
  const [registeredOwnerName, setRegisteredOwnerName] = useState('');

  // Pricing & Availability
  const [pricePerDay, setPricePerDay] = useState('3200');
  const [depositAmount, setDepositAmount] = useState('3000');
  const [mileagePolicy, setMileagePolicy] = useState('250 km/day included, ₹12/km thereafter');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [city, setCity] = useState('Delhi NCR');
  const [address, setAddress] = useState('');

  // Real Native Upload States
  const [photoStates, setPhotoStates] = useState<Record<string, PhotoUploadState>>({});
  const [docStates, setDocStates] = useState<Record<string, DocUploadState>>({});

  // Loading & Submission State
  const [savingStep, setSavingStep] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  // Hidden file input refs mapping
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ─── Step 1 & 2 Save (DRAFT Creation in MongoDB) ───────────────────────────
  const handleSaveBasicDetails = async (): Promise<boolean> => {
    setGeneralError(null);
    if (!registrationNumber.trim()) {
      setGeneralError('Registration Number (e.g. DL-01-AB-1234) is required.');
      return false;
    }
    if (!make.trim() || !vehicleModel.trim()) {
      setGeneralError('Vehicle Make and Model are required.');
      return false;
    }

    setSavingStep(true);
    try {
      if (!vehicleMongoId) {
        // Create new DRAFT vehicle
        const res = await fetchAPI<{ vehicle: { _id: string; vehicleId: string } }>('/api/partner/vehicles', {
          method: 'POST',
          body: JSON.stringify({
            make,
            vehicleModel,
            variant,
            year: Number(year),
            registrationNumber: registrationNumber.trim().toUpperCase(),
            category,
            fuelType,
            transmission,
            seats: Number(seats),
            color,
            ownershipType,
            registeredOwnerName: registeredOwnerName.trim() || undefined,
            pricePerDay: Number(pricePerDay) || 2500,
            depositAmount: Number(depositAmount) || 3000,
            mileagePolicy,
            city,
            address,
          }),
        });
        if (res.data?.vehicle) {
          setVehicleMongoId(res.data.vehicle._id);
          setVehicleCode(res.data.vehicle.vehicleId);
        }
      } else {
        // Update existing DRAFT
        await fetchAPI(`/api/partner/vehicles/${vehicleMongoId}`, {
          method: 'PUT',
          body: JSON.stringify({
            make,
            vehicleModel,
            variant,
            year: Number(year),
            registrationNumber: registrationNumber.trim().toUpperCase(),
            category,
            fuelType,
            transmission,
            seats: Number(seats),
            color,
            ownershipType,
            registeredOwnerName: registeredOwnerName.trim() || undefined,
            pricePerDay: Number(pricePerDay),
            depositAmount: Number(depositAmount),
            mileagePolicy,
            city,
            address,
          }),
        });
      }
      return true;
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save vehicle details');
      return false;
    } finally {
      setSavingStep(false);
    }
  };

  // ─── Real Native File Picker Trigger: Photo ────────────────────────────────
  const triggerPhotoPicker = (catId: string) => {
    const input = photoInputRefs.current[catId];
    if (input) {
      input.click(); // Genuinely triggers OS / browser file explorer
    }
  };

  // ─── Real Native File Picker Trigger: Document ─────────────────────────────
  const triggerDocPicker = (docId: string) => {
    const input = docInputRefs.current[docId];
    if (input) {
      input.click(); // Genuinely triggers OS / browser file explorer
    }
  };

  // ─── Native File Selection Handler: Photo ─────────────────────────────────
  const handlePhotoFileSelected = async (catId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side Validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoStates((prev) => ({
        ...prev,
        [catId]: { ...prev[catId], file: null, previewUrl: null, progress: 0, uploaded: false, error: 'Only JPG, JPEG, PNG, or WEBP images are supported.' },
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPhotoStates((prev) => ({
        ...prev,
        [catId]: { ...prev[catId], file: null, previewUrl: null, progress: 0, uploaded: false, error: 'File exceeds maximum 10MB limit.' },
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoStates((prev) => ({
      ...prev,
      [catId]: { file, previewUrl, progress: 20, uploaded: false, error: null },
    }));

    // If vehicle record created, upload directly to backend
    if (vehicleMongoId) {
      await uploadPhotoToBackend(catId, file);
    } else {
      // Mark as ready to upload
      setPhotoStates((prev) => ({
        ...prev,
        [catId]: { file, previewUrl, progress: 100, uploaded: true, error: null },
      }));
    }
  };

  const uploadPhotoToBackend = async (catId: string, file: File) => {
    if (!vehicleMongoId) return;

    try {
      setPhotoStates((prev) => ({
        ...prev,
        [catId]: { ...prev[catId], progress: 50, error: null },
      }));

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('category', catId);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/partner/vehicles/${vehicleMongoId}/upload-photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Photo upload failed');
      }

      setPhotoStates((prev) => ({
        ...prev,
        [catId]: { ...prev[catId], progress: 100, uploaded: true, error: null },
      }));
    } catch (err: any) {
      setPhotoStates((prev) => ({
        ...prev,
        [catId]: { ...prev[catId], progress: 0, uploaded: false, error: err.message || 'Upload error' },
      }));
    }
  };

  // ─── Native File Selection Handler: Document ──────────────────────────────
  const handleDocFileSelected = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setDocStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], file: null, fileName: null, fileSize: null, progress: 0, uploaded: false, error: 'Only PDF, JPG, PNG, and WEBP documents allowed.' },
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setDocStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], file: null, fileName: null, fileSize: null, progress: 0, uploaded: false, error: 'Document exceeds 10MB limit.' },
      }));
      return;
    }

    setDocStates((prev) => ({
      ...prev,
      [docType]: {
        file,
        fileName: file.name,
        fileSize: file.size,
        expiresAt: prev[docType]?.expiresAt || '',
        progress: 25,
        uploaded: false,
        error: null,
      },
    }));

    if (vehicleMongoId) {
      await uploadDocToBackend(docType, file, docStates[docType]?.expiresAt);
    } else {
      setDocStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], progress: 100, uploaded: true, error: null },
      }));
    }
  };

  const uploadDocToBackend = async (docType: string, file: File, expiresAt?: string) => {
    if (!vehicleMongoId) return;

    try {
      setDocStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], progress: 60, error: null },
      }));

      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', docType);
      if (expiresAt) formData.append('expiresAt', expiresAt);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/partner/vehicles/${vehicleMongoId}/upload-document`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Document upload failed');
      }

      setDocStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], progress: 100, uploaded: true, error: null },
      }));
    } catch (err: any) {
      setDocStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], progress: 0, uploaded: false, error: err.message || 'Upload error' },
      }));
    }
  };

  // ─── Step Navigation ───────────────────────────────────────────────────────
  const handleNextStep = async () => {
    setGeneralError(null);

    if (currentStep === 1 || currentStep === 2) {
      const ok = await handleSaveBasicDetails();
      if (!ok) return;
    }

    if (currentStep === 3) {
      // Ensure at least 3 required photos are selected
      const uploadedCount = Object.values(photoStates).filter((p) => p.file || p.uploaded).length;
      if (uploadedCount < 3) {
        setGeneralError('Please upload at least 3 essential photos (Front, Interior, Dashboard) before proceeding.');
        return;
      }
    }

    if (currentStep === 4) {
      // Ensure RC and Insurance documents are uploaded
      if (!docStates['RC']?.file && !docStates['RC']?.uploaded) {
        setGeneralError('Registration Certificate (RC) document is mandatory.');
        return;
      }
      if (!docStates['INSURANCE']?.file && !docStates['INSURANCE']?.uploaded) {
        setGeneralError('Commercial Insurance document is mandatory.');
        return;
      }
      if (ownershipType !== 'OWNED_BY_PARTNER' && !docStates['AUTHORIZATION_LETTER']?.file && !docStates['AUTHORIZATION_LETTER']?.uploaded) {
        setGeneralError('Leased / Authorized vehicle requires an Authorization Letter document.');
        return;
      }
    }

    if (currentStep < 7) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handlePrevStep = () => {
    setGeneralError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  // ─── Final Step: Submit Vehicle for Verification ───────────────────────────
  const handleSubmitForVerification = async () => {
    setSavingStep(true);
    setGeneralError(null);
    try {
      if (!vehicleMongoId) {
        throw new Error('Vehicle record not initialized. Please go back to step 1.');
      }

      await fetchAPI(`/api/partner/vehicles/${vehicleMongoId}/submit-verification`, {
        method: 'POST',
      });

      setGeneralSuccess('Vehicle submitted for admin review successfully!');
      setTimeout(() => {
        router.push(`/partner/vehicles/${vehicleMongoId}`);
      }, 1200);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to submit vehicle for verification');
    } finally {
      setSavingStep(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-2 sm:px-4 py-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/partner/fleet" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Register New Fleet Vehicle
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Follow the 7-step onboarding flow to verify your vehicle for customer rentals.
          </p>
        </div>

        {vehicleCode && (
          <div className="px-3.5 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold self-start">
            Draft ID: {vehicleCode}
          </div>
        )}
      </div>

      {/* ── STEP INDICATOR (1 to 7) ── */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[650px] p-2 rounded-2xl bg-[#0B101E] border border-white/10 text-xs">
          {[
            { step: 1, label: 'Basic Info' },
            { step: 2, label: 'Ownership' },
            { step: 3, label: 'Photos' },
            { step: 4, label: 'Documents' },
            { step: 5, label: 'Pricing' },
            { step: 6, label: 'Availability' },
            { step: 7, label: 'Submit' },
          ].map((item) => (
            <div
              key={item.step}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                currentStep === item.step
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                  : currentStep > item.step
                  ? 'text-teal-400 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  currentStep === item.step
                    ? 'bg-slate-950 text-teal-400'
                    : currentStep > item.step
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                {currentStep > item.step ? '✓' : item.step}
              </div>
              <span className="whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── GLOBAL ERROR / SUCCESS ALERTS ── */}
      {generalError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{generalError}</span>
        </div>
      )}

      {generalSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{generalSuccess}</span>
        </div>
      )}

      {/* ── STEP CONTENT CONTAINERS ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B101E] border border-white/10 shadow-2xl space-y-6">
        {/* ── STEP 1: BASIC VEHICLE SPECS ── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 1: Vehicle Specifications</h2>
              <p className="text-xs text-slate-400">Enter accurate details as printed on the vehicle RC</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-01-AB-1234"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white font-mono text-sm focus:border-teal-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Vehicle Make *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyundai, Maruti, Tata, Toyota"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Vehicle Model *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Creta, Swift, Nexon, Innova"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Variant / Trim
                </label>
                <input
                  type="text"
                  placeholder="e.g. SX(O) / ZXi+ / XZ+"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Manufacturing Year *
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                >
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017].map((y) => (
                    <option key={y} value={y} className="bg-[#070A12] text-white">{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Vehicle Body Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="suv">SUV</option>
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="muv">MUV / 7-Seater</option>
                  <option value="luxury">Luxury</option>
                  <option value="ev">Electric Vehicle (EV)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Fuel Type *
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="cng">CNG</option>
                  <option value="electric">Electric (EV)</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Transmission *
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Seating Capacity *
                </label>
                <select
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="4">4 Seater</option>
                  <option value="5">5 Seater</option>
                  <option value="6">6 Seater</option>
                  <option value="7">7 Seater</option>
                  <option value="8">8+ Seater</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Vehicle Exterior Color
                </label>
                <input
                  type="text"
                  placeholder="e.g. Polar White, Phantom Black"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: OWNERSHIP & LEGAL RECOGNITION ── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 2: Vehicle Ownership & Authorization</h2>
              <p className="text-xs text-slate-400">
                Never assume logged-in partner is the registered owner. Provide proper ownership designation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ownership Model *
                </label>
                <select
                  value={ownershipType}
                  onChange={(e) => setOwnershipType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="OWNED_BY_PARTNER">Directly Owned by Logged-in Partner</option>
                  <option value="OWNED_BY_AGENCY">Registered Under Company / Rental Agency</option>
                  <option value="LEASED">Commercial Lease Agreement</option>
                  <option value="AUTHORIZED_USE">Authorized Power of Attorney / Third-Party Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Registered Owner Name (As per RC) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Name of owner on the Registration Certificate"
                  value={registeredOwnerName}
                  onChange={(e) => setRegisteredOwnerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {ownershipType !== 'OWNED_BY_PARTNER' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <p className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Authorization Document Requirement
                </p>
                <p className="text-amber-200/80">
                  Because this vehicle is not directly owned in your personal name, you will be required to upload an Authorization Letter or Lease Agreement on Step 4.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: REAL NATIVE FILE PICKER VEHICLE PHOTOS ── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 3: Vehicle Photo Gallery (Real File Picker)</h2>
              <p className="text-xs text-slate-400">
                Click any angle box below to open your system file explorer and select real vehicle photos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PHOTO_CATEGORIES.map((cat) => {
                const state = photoStates[cat.id];
                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      state?.uploaded
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : state?.error
                        ? 'bg-red-950/20 border-red-500/30'
                        : 'bg-[#070A12] border-white/10 hover:border-teal-500/40'
                    }`}
                  >
                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      ref={(el) => {
                        photoInputRefs.current[cat.id] = el;
                      }}
                      onChange={(e) => handlePhotoFileSelected(cat.id, e)}
                    />

                    {/* Preview / Placeholder */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {cat.label} {cat.required && <span className="text-teal-400">*</span>}
                        </span>
                        {state?.uploaded && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>

                      {state?.previewUrl ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={state.previewUrl}
                            alt={cat.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => triggerPhotoPicker(cat.id)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold"
                            >
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => triggerPhotoPicker(cat.id)}
                          className="aspect-video rounded-xl border border-dashed border-white/20 hover:border-teal-400/60 bg-white/[0.02] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
                        >
                          <Upload className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
                          <span className="text-[11px] text-slate-400 group-hover:text-teal-300 font-medium">
                            Choose Image
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status / Error feedback */}
                    <div className="pt-3">
                      {state?.error && (
                        <p className="text-[10px] text-red-400 leading-tight mb-2">{state.error}</p>
                      )}
                      {state?.file && !state.uploaded && (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-teal-500 transition-all duration-300"
                              style={{ width: `${state.progress}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400">Uploading... {state.progress}%</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => triggerPhotoPicker(cat.id)}
                        className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold transition-all border border-white/10"
                      >
                        {state?.uploaded ? 'Replace Photo' : 'Browse OS Files'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: REAL NATIVE FILE PICKER COMPLIANCE DOCUMENTS ── */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 4: Compliance & RTO Documents</h2>
              <p className="text-xs text-slate-400">
                Mandatory Indian vehicle verification documents. All files are securely saved in private authenticated storage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOCUMENT_CATEGORIES.map((doc) => {
                const state = docStates[doc.id];
                const isMandatory = doc.required || (doc.id === 'AUTHORIZATION_LETTER' && ownershipType !== 'OWNED_BY_PARTNER');

                return (
                  <div
                    key={doc.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      state?.uploaded
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : state?.error
                        ? 'bg-red-950/20 border-red-500/30'
                        : 'bg-[#070A12] border-white/10'
                    }`}
                  >
                    {/* Hidden Document File Input */}
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      ref={(el) => {
                        docInputRefs.current[doc.id] = el;
                      }}
                      onChange={(e) => handleDocFileSelected(doc.id, e)}
                    />

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-white">
                            {doc.label} {isMandatory && <span className="text-teal-400">*</span>}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">{doc.description}</p>
                        </div>
                        {state?.uploaded && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>

                      {/* Expiration Date Input for Insurance / PUC / Fitness */}
                      {['INSURANCE', 'PUC', 'FITNESS', 'PERMIT'].includes(doc.id) && (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Document Expiration Date
                          </label>
                          <input
                            type="date"
                            value={state?.expiresAt || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDocStates((prev) => ({
                                ...prev,
                                [doc.id]: {
                                  ...prev[doc.id],
                                  expiresAt: val,
                                  file: prev[doc.id]?.file || null,
                                  fileName: prev[doc.id]?.fileName || null,
                                  fileSize: prev[doc.id]?.fileSize || null,
                                  progress: prev[doc.id]?.progress || 0,
                                  uploaded: prev[doc.id]?.uploaded || false,
                                  error: null,
                                },
                              }));
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Upload status card */}
                      {state?.fileName ? (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <File className="w-4 h-4 text-teal-400 shrink-0" />
                            <div className="truncate">
                              <p className="text-white font-medium truncate">{state.fileName}</p>
                              {state.fileSize && (
                                <p className="text-[10px] text-slate-500">
                                  {(state.fileSize / 1024).toFixed(0)} KB · PENDING Verification
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerDocPicker(doc.id)}
                            className="text-teal-400 hover:text-teal-300 font-semibold text-[11px] shrink-0 ml-2"
                          >
                            Replace
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => triggerDocPicker(doc.id)}
                          className="p-4 rounded-xl border border-dashed border-white/20 hover:border-teal-400/60 bg-white/[0.01] flex items-center justify-center gap-2 cursor-pointer transition-colors group"
                        >
                          <Upload className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                          <span className="text-xs text-slate-400 group-hover:text-teal-300 font-medium">
                            Select File (PDF / JPG)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Button trigger */}
                    <div className="pt-3">
                      {state?.error && (
                        <p className="text-[10px] text-red-400 leading-tight mb-2">{state.error}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => triggerDocPicker(doc.id)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/10 flex items-center justify-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{state?.uploaded ? 'Replace Document' : 'Open Native File Picker'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 5: PRICING & DEPOSIT ── */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 5: Daily Rental Pricing & Security Deposit</h2>
              <p className="text-xs text-slate-400">
                Transparent pricing model. Security deposit is always held separately and refunded after trip return.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Daily Rental Price (₹/day) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="500"
                    required
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm font-bold focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Refundable Security Deposit (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm font-bold focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Free Km Allowance & Policy
                </label>
                <input
                  type="text"
                  value={mileagePolicy}
                  onChange={(e) => setMileagePolicy(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Net payout estimator */}
            <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 text-xs text-teal-200 space-y-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Earnings Breakdown per Day
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Customer Price</span>
                  <span className="text-white font-bold">₹{Number(pricePerDay) || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Platform Fee (15%)</span>
                  <span className="text-slate-300 font-medium">₹{Math.round((Number(pricePerDay) || 0) * 0.15)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Your Net Earnings (80%)</span>
                  <span className="text-teal-300 font-black">₹{Math.round((Number(pricePerDay) || 0) * 0.8)} / day</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 6: AVAILABILITY & LOCATION ── */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 6: Location & Delivery Preferences</h2>
              <p className="text-xs text-slate-400">Configure pickup hub location and doorstep delivery</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Operating City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Delhi NCR, Mumbai, Bengaluru"
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Garage / Hub Pickup Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Exact garage location for customer self-pickup"
                  className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-white/10 text-white text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 7: REVIEW & SUBMIT ── */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 7: Final Review & Submission</h2>
              <p className="text-xs text-slate-400">
                Please verify all vehicle specs, uploaded document count, and pricing before submitting to Admin for verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Vehicle</span>
                <p className="text-base font-bold text-white">{make} {vehicleModel} {variant}</p>
                <p className="text-xs text-teal-400 font-mono font-bold">{registrationNumber}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Pricing</span>
                <p className="text-base font-black text-emerald-400">₹{pricePerDay} <span className="text-xs font-normal text-slate-400">/day</span></p>
                <p className="text-xs text-slate-400">Deposit: ₹{depositAmount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Uploaded Compliance</span>
                <p className="text-base font-bold text-white">
                  {Object.values(docStates).filter((d) => d.file || d.uploaded).length} Documents
                </p>
                <p className="text-xs text-slate-400">
                  {Object.values(photoStates).filter((p) => p.file || p.uploaded).length} Photos Attached
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs">
              <p className="font-bold text-white mb-1">What happens after submission?</p>
              <p className="leading-relaxed text-slate-300">
                1. Your vehicle status will transition from <span className="text-amber-300 font-bold">DRAFT</span> to <span className="text-cyan-300 font-bold">UNDER REVIEW</span>.<br />
                2. VITO RTO Verification Officers will review your uploaded RC, Insurance, and PUC.<br />
                3. Once approved, your vehicle will automatically appear in customer self-drive searches.
              </p>
            </div>
          </div>
        )}

        {/* ── FOOTER WIZARD CONTROLS ── */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || savingStep}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={savingStep}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {savingStep ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Save & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitForVerification}
              disabled={savingStep}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-extrabold transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              {savingStep ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Submit for Verification</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
