'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  Car,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Fuel,
  Settings2,
  Users,
  X,
  FileCheck,
  Check,
} from 'lucide-react';
import { CustomerVehicle } from './CustomerVehicleManager';

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
  },
];

interface CustomerVehicleSelectorProps {
  selectedVehicle: CustomerVehicle | null;
  onSelectVehicle: (vehicle: CustomerVehicle) => void;
}

export default function CustomerVehicleSelector({
  selectedVehicle,
  onSelectVehicle,
}: CustomerVehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>(DEFAULT_DEMO_VEHICLES);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form fields for quick registration
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fuelType, setFuelType] = useState('diesel');
  const [transmission, setTransmission] = useState('automatic');
  const [seatingCapacity, setSeatingCapacity] = useState(7);

  // Load vehicles from backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAPI<any>('/customer/vehicles');
        if (res.success && res.data?.vehicles && res.data.vehicles.length > 0) {
          setVehicles(res.data.vehicles);
          // Auto select default vehicle if none is selected yet
          if (!selectedVehicle) {
            const defaultVeh = res.data.vehicles.find((v: any) => v.isDefault) || res.data.vehicles[0];
            onSelectVehicle(defaultVeh);
          }
        } else if (!selectedVehicle && DEFAULT_DEMO_VEHICLES.length > 0) {
          onSelectVehicle(DEFAULT_DEMO_VEHICLES[0]);
        }
      } catch {
        if (!selectedVehicle && DEFAULT_DEMO_VEHICLES.length > 0) {
          onSelectVehicle(DEFAULT_DEMO_VEHICLES[0]);
        }
      }
    };
    load();
  }, []);

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !registrationNumber.trim()) return;

    const newVeh: CustomerVehicle = {
      _id: `cust_veh_${Date.now()}`,
      make: make.trim(),
      model: model.trim(),
      variant: variant.trim() || 'Standard',
      registrationNumber: registrationNumber.trim().toUpperCase(),
      fuelType,
      transmission,
      seatingCapacity,
      verificationStatus: 'VERIFIED',
      isDefault: false,
    };

    setVehicles([newVeh, ...vehicles]);
    onSelectVehicle(newVeh);
    setShowAddModal(false);

    try {
      await fetchAPI('/customer/vehicles', {
        method: 'POST',
        body: newVeh,
      });
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#0B1728] dark:text-white">
            SELECT VEHICLE FROM YOUR REGISTERED CARS
          </h4>
          <p className="text-[11px] text-[#526174]">
            Your driver will be assigned based on transmission and passenger capacity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs font-bold text-[#00A99D] hover:bg-[#00C2B3]/10 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Register Another Car
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {vehicles.map((v) => {
          const isSelected = selectedVehicle?._id === v._id;

          return (
            <div
              key={v._id}
              onClick={() => onSelectVehicle(v)}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-[#00C2B3]/5 border-[#00C2B3] shadow-sm'
                  : 'bg-[#FFFFFF] dark:bg-[#0B1728] border-[#E5EAF0] dark:border-[#17334F] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    isSelected
                      ? 'bg-[#00C2B3] text-[#07111F]'
                      : 'bg-[#F7F9FC] dark:bg-[#10243A] text-[#526174]'
                  }`}
                >
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#0B1728] dark:text-white">
                      {v.make} {v.model}
                    </span>
                    {v.isDefault && (
                      <span className="px-1.5 py-0.2 rounded bg-[#07111F] text-white text-[8px] font-black uppercase">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-[#526174]">
                    {v.registrationNumber} • {v.seatingCapacity} Seats • {v.transmission}
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-[#00C2B3] bg-[#00C2B3] text-white' : 'border-slate-300'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-[#07111F] stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Register Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#E5EAF0] pb-3">
              <h3 className="text-sm font-black text-[#0B1728] dark:text-white">Quick Vehicle Registration</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0B1728] dark:text-white">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="Toyota"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0B1728] dark:text-white">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="Innova Crysta"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0B1728] dark:text-white">Registration Plate</label>
                <input
                  type="text"
                  required
                  placeholder="UP-78-AB-1234"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-mono font-bold outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0B1728] dark:text-white">Seats</label>
                  <select
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(Number(e.target.value))}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  >
                    <option value={4}>4 Seats</option>
                    <option value={5}>5 Seats</option>
                    <option value={7}>7 Seats</option>
                    <option value={8}>8 Seats</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0B1728] dark:text-white">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0B1728] dark:text-white">Fuel</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border text-xs font-bold outline-none"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="cng">CNG</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#00C2B3] text-[#07111F] font-black text-xs shadow cursor-pointer mt-2"
              >
                Save & Select This Vehicle →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
