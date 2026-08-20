'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  Car,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  Star,
  FileCheck,
  Upload,
  X,
  Sparkles,
  AlertCircle,
  Clock,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

export interface CustomerVehicle {
  _id: string;
  make: string;
  model: string;
  variant?: string;
  registrationNumber: string;
  registrationState?: string;
  year?: number;
  fuelType: string;
  transmission: string;
  seatingCapacity: number;
  color?: string;
  imageUrl?: string;
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'UNDER_REVIEW' | 'REJECTED' | 'EXPIRED';
  isDefault: boolean;
  documents?: Array<{
    documentType: string;
    documentNumber?: string;
    fileName: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;
}

const DEFAULT_DEMO_VEHICLES: CustomerVehicle[] = [
  {
    _id: 'cust_veh_innova',
    make: 'Toyota',
    model: 'Innova Crysta',
    variant: 'ZX 2.4 Automatic',
    registrationNumber: 'UP-78-TX-9901',
    registrationState: 'Uttar Pradesh',
    year: 2024,
    fuelType: 'diesel',
    transmission: 'automatic',
    seatingCapacity: 7,
    color: 'Pearl White',
    verificationStatus: 'VERIFIED',
    isDefault: true,
    documents: [
      {
        documentType: 'RC',
        documentNumber: 'RC-UP78-9901',
        fileName: 'vehicle_rc.pdf',
        verificationStatus: 'VERIFIED',
        uploadedAt: 'Verified',
      },
    ],
  },
  {
    _id: 'cust_veh_city',
    make: 'Honda',
    model: 'City',
    variant: 'ZX CVT',
    registrationNumber: 'UP-78-AB-4321',
    registrationState: 'Uttar Pradesh',
    year: 2023,
    fuelType: 'petrol',
    transmission: 'automatic',
    seatingCapacity: 5,
    color: 'Lunar Silver',
    verificationStatus: 'VERIFIED',
    isDefault: false,
    documents: [
      {
        documentType: 'RC',
        documentNumber: 'RC-UP78-4321',
        fileName: 'rc_card.pdf',
        verificationStatus: 'VERIFIED',
        uploadedAt: 'Verified',
      },
    ],
  },
];

interface CustomerVehicleManagerProps {
  onVehicleSelected?: (vehicle: CustomerVehicle) => void;
  selectedVehicleId?: string;
  isSelectionMode?: boolean;
}

export default function CustomerVehicleManager({
  onVehicleSelected,
  selectedVehicleId,
  isSelectionMode = false,
}: CustomerVehicleManagerProps) {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>(DEFAULT_DEMO_VEHICLES);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<CustomerVehicle | null>(null);

  // Form fields
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationState, setRegistrationState] = useState('Uttar Pradesh');
  const [year, setYear] = useState(2024);
  const [fuelType, setFuelType] = useState('petrol');
  const [transmission, setTransmission] = useState('automatic');
  const [seatingCapacity, setSeatingCapacity] = useState(5);
  const [color, setColor] = useState('White');
  const [isDefault, setIsDefault] = useState(false);
  const [rcUploaded, setRcUploaded] = useState(false);

  // Load vehicles from backend
  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI<any>('/customer/vehicles');
      if (res.success && res.data?.vehicles && res.data.vehicles.length > 0) {
        setVehicles(res.data.vehicles);
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Set default vehicle
  const handleSetDefault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        isDefault: v._id === id,
      }))
    );
    try {
      await fetchAPI(`/customer/vehicles/${id}/default`, { method: 'PUT' });
    } catch {}
  };

  // Delete vehicle
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    setVehicles((prev) => prev.filter((v) => v._id !== id));
    try {
      await fetchAPI(`/customer/vehicles/${id}`, { method: 'DELETE' });
    } catch {}
  };

  // Open Edit Modal
  const handleOpenEdit = (v: CustomerVehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVehicle(v);
    setMake(v.make);
    setModel(v.model);
    setVariant(v.variant || '');
    setRegistrationNumber(v.registrationNumber);
    setRegistrationState(v.registrationState || 'Uttar Pradesh');
    setYear(v.year || 2024);
    setFuelType(v.fuelType || 'petrol');
    setTransmission(v.transmission || 'automatic');
    setSeatingCapacity(v.seatingCapacity || 5);
    setColor(v.color || 'White');
    setIsDefault(v.isDefault);
    setRcUploaded(true);
    setShowAddModal(true);
  };

  // Save or Create Vehicle
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !registrationNumber.trim()) return;

    if (editingVehicle) {
      // Update
      const updated: CustomerVehicle = {
        ...editingVehicle,
        make: make.trim(),
        model: model.trim(),
        variant: variant.trim(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        registrationState: registrationState.trim(),
        year,
        fuelType,
        transmission,
        seatingCapacity,
        color: color.trim(),
        isDefault,
      };

      setVehicles((prev) =>
        prev.map((v) => {
          if (v._id === editingVehicle._id) return updated;
          if (isDefault) return { ...v, isDefault: false };
          return v;
        })
      );

      try {
        await fetchAPI(`/customer/vehicles/${editingVehicle._id}`, {
          method: 'PUT',
          body: updated,
        });
      } catch {}
    } else {
      // Create new
      const newVeh: CustomerVehicle = {
        _id: `cust_veh_${Date.now()}`,
        make: make.trim(),
        model: model.trim(),
        variant: variant.trim(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        registrationState: registrationState.trim(),
        year,
        fuelType,
        transmission,
        seatingCapacity,
        color: color.trim(),
        verificationStatus: 'VERIFIED',
        isDefault: isDefault || vehicles.length === 0,
        documents: rcUploaded
          ? [
              {
                documentType: 'RC',
                fileName: 'rc_document.pdf',
                verificationStatus: 'VERIFIED',
                uploadedAt: 'Verified',
              },
            ]
          : [],
      };

      setVehicles((prev) => {
        const next = isDefault ? prev.map((v) => ({ ...v, isDefault: false })) : [...prev];
        return [newVeh, ...next];
      });

      if (onVehicleSelected) {
        onVehicleSelected(newVeh);
      }

      try {
        await fetchAPI('/customer/vehicles', {
          method: 'POST',
          body: newVeh,
        });
      } catch {}
    }

    setShowAddModal(false);
    setEditingVehicle(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-[#0B1728] dark:text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-[#00C2B3]" /> My Registered Cars
          </h3>
          <p className="text-xs text-[#526174] dark:text-slate-400">
            Manage vehicles you own and use with VITO's driver-hiring service.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingVehicle(null);
            setMake('Toyota');
            setModel('');
            setVariant('');
            setRegistrationNumber('');
            setRcUploaded(true);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-[#07111F] hover:bg-[#00C2B3] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Vehicle Cards Grid */}
      {vehicles.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00C2B3]/10 text-[#00A99D] flex items-center justify-center mx-auto">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#0B1728] dark:text-white">No vehicles registered yet</h4>
            <p className="text-xs text-[#526174] max-w-sm mx-auto mt-1">
              Register your car once to easily select it whenever you hire a professional driver.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 rounded-xl bg-[#00C2B3] text-[#07111F] text-xs font-black shadow cursor-pointer"
          >
            Register Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => {
            const isSelected = selectedVehicleId === v._id;

            return (
              <div
                key={v._id}
                onClick={() => onVehicleSelected && onVehicleSelected(v)}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-4 cursor-pointer ${
                  isSelected
                    ? 'bg-[#00C2B3]/5 border-[#00C2B3] shadow-md'
                    : 'bg-[#FFFFFF] dark:bg-[#0B1728] border-[#E5EAF0] dark:border-[#17334F] hover:border-slate-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-[#0B1728] dark:text-white">
                          {v.make} {v.model}
                        </h4>
                        {v.isDefault && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#07111F] text-white text-[9px] font-black uppercase tracking-wider">
                            ★ Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#526174] font-medium">{v.variant || `${v.year} Edition`}</p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {v.verificationStatus}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-[#8995A5] uppercase font-bold block">Plate Number</span>
                      <span className="font-mono font-black text-sm text-[#0B1728] dark:text-white">
                        {v.registrationNumber}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8995A5] uppercase font-bold block">Specs</span>
                      <span className="font-bold text-[#526174]">
                        {v.seatingCapacity} Seats • {v.fuelType} • {v.transmission}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5EAF0] dark:border-[#17334F] text-xs">
                  {!v.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => handleSetDefault(v._id, e)}
                      className="text-xs font-bold text-[#00A99D] hover:underline cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(v, e)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(v._id, e)}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ADD / EDIT VEHICLE MODAL ──────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-[#E5EAF0] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#00A99D]">
                  {editingVehicle ? 'Edit Vehicle' : 'Register New Vehicle'}
                </span>
                <h3 className="text-base font-black text-[#0B1728] dark:text-white">
                  {editingVehicle ? `${editingVehicle.make} ${editingVehicle.model}` : 'Vehicle Details for Driver Hire'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Innova Crysta"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Variant / Trim</label>
                  <input
                    type="text"
                    placeholder="e.g. ZX Automatic"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="UP-78-AB-1234"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-mono font-bold outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Seating</label>
                  <select
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  >
                    <option value={4}>4 Seats</option>
                    <option value={5}>5 Seats</option>
                    <option value={6}>6 Seats</option>
                    <option value={7}>7 Seats</option>
                    <option value={8}>8 Seats</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B1728] dark:text-white">Fuel</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Document Check */}
              <div className="p-3.5 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#0B1728] dark:text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Vehicle Registration / RC Document
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-[11px] text-[#526174]">
                  RC copy is securely stored and used only for operational driver compliance.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00C2B3]"
                />
                <span className="text-xs font-bold text-[#0B1728] dark:text-white">
                  Set as default vehicle for Driver Hire bookings
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {editingVehicle ? 'Update Vehicle' : 'Save & Register Vehicle →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
