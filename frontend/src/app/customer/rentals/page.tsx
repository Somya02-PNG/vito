'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Key,
  ShieldCheck,
  Star,
  Users,
  Fuel,
  Sparkles,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Filter,
  Check,
} from 'lucide-react';

interface RentalVehicle {
  id: string;
  name: string;
  category: string;
  image: string;
  transmission: 'Automatic' | 'Manual';
  fuel: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  seats: number;
  pricePerDay: number;
  deposit: number;
  rating: number;
  tripsCount: number;
  deliveryAvailable: boolean;
}

const RENTAL_FLEET: RentalVehicle[] = [
  {
    id: 'rv_1',
    name: 'Hyundai Verna Turbo',
    category: 'Sedan',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 5,
    pricePerDay: 2400,
    deposit: 3000,
    rating: 4.92,
    tripsCount: 42,
    deliveryAvailable: true,
  },
  {
    id: 'rv_2',
    name: 'Toyota Innova Hycross',
    category: 'SUV',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    transmission: 'Automatic',
    fuel: 'Hybrid',
    seats: 7,
    pricePerDay: 3800,
    deposit: 5000,
    rating: 4.96,
    tripsCount: 68,
    deliveryAvailable: true,
  },
  {
    id: 'rv_3',
    name: 'Tata Nexon EV Max',
    category: 'Electric',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    transmission: 'Automatic',
    fuel: 'Electric',
    seats: 5,
    pricePerDay: 2800,
    deposit: 3500,
    rating: 4.88,
    tripsCount: 35,
    deliveryAvailable: true,
  },
  {
    id: 'rv_4',
    name: 'Maruti Suzuki Dzire',
    category: 'Sedan',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    transmission: 'Manual',
    fuel: 'Petrol',
    seats: 5,
    pricePerDay: 1600,
    deposit: 2000,
    rating: 4.85,
    tripsCount: 120,
    deliveryAvailable: false,
  },
  {
    id: 'rv_5',
    name: 'BMW 3 Series Gran Limousine',
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 5,
    pricePerDay: 8500,
    deposit: 15000,
    rating: 4.98,
    tripsCount: 19,
    deliveryAvailable: true,
  },
  {
    id: 'rv_6',
    name: 'Mahindra Thar 4x4',
    category: 'SUV',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    transmission: 'Automatic',
    fuel: 'Diesel',
    seats: 4,
    pricePerDay: 3500,
    deposit: 5000,
    rating: 4.9,
    tripsCount: 54,
    deliveryAvailable: true,
  },
];

const CATEGORIES = ['All Fleet', 'Sedan', 'SUV', 'Electric', 'Luxury'];

function RentalsPageContent() {
  const [selectedCat, setSelectedCat] = useState('All Fleet');
  const [selectedVehicle, setSelectedVehicle] = useState<RentalVehicle | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const filteredFleet =
    selectedCat === 'All Fleet'
      ? RENTAL_FLEET
      : RENTAL_FLEET.filter((v) => v.category === selectedCat);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ─── Header: Rental Marketplace ────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3984E8]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#3984E8]">
            VITO Self-Drive Fleet
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1728] dark:text-white tracking-tight">
          Rent a Verified Vehicle
        </h1>
        <p className="text-sm sm:text-base text-[#526174] dark:text-slate-400 mt-1 font-medium">
          Transparent daily pricing, comprehensive insurance included, zero hidden charges, and doorstep delivery.
        </p>
      </div>

      {/* ─── Category Filter Chips ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#07111F] text-white shadow-sm'
                  : 'bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] text-[#526174] dark:text-slate-300 hover:border-[#CCD6E2]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ─── Rental Fleet Cards Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFleet.map((vehicle) => (
          <div
            key={vehicle.id}
            className="rounded-3xl bg-[#FFFFFF] dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-[0_4px_20px_rgba(7,17,31,0.06)] hover:shadow-[0_8px_28px_rgba(7,17,31,0.10)] transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Vehicle Image (Consistent 16:9 Aspect Ratio) */}
              <div className="relative aspect-[16/9] w-full bg-[#F1F5F8] dark:bg-[#10243A] overflow-hidden">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider">
                  {vehicle.category}
                </span>

                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#0B1728] text-xs font-black shadow-sm">
                  <Star className="w-3 h-3 fill-[#C9A45C] text-[#C9A45C]" />
                  {vehicle.rating}
                </span>
              </div>

              {/* Card Details */}
              <div className="p-5 space-y-3">
                {/* Vehicle Name */}
                <h3 className="text-base font-extrabold text-[#0B1728] dark:text-white group-hover:text-[#00A99D] transition-colors">
                  {vehicle.name}
                </h3>

                {/* Specs Line: Transmission · Fuel · Seats */}
                <div className="flex items-center gap-3 text-xs text-[#526174] dark:text-slate-400 font-semibold">
                  <span>{vehicle.transmission}</span>
                  <span>·</span>
                  <span>{vehicle.fuel}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {vehicle.seats} Seats
                  </span>
                </div>

                {/* Verification Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F7F2] text-[#16A67A] text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Vehicle
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EDF4FD] text-[#3984E8] text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Insurance Included
                  </span>
                </div>
              </div>
            </div>

            {/* Price & Booking Footer */}
            <div className="p-5 pt-3 border-t border-[#E5EAF0] dark:border-[#17334F] flex items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-[#0B1728] dark:text-white">
                    ₹{vehicle.pricePerDay}
                  </span>
                  <span className="text-xs text-[#8995A5]">/day</span>
                </div>
                <p className="text-[10px] text-[#8995A5]">
                  Deposit: ₹{vehicle.deposit} (Refundable)
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setBookingSuccess(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#07111F] hover:bg-[#0B1728] text-white text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                View Details & Book
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Booking Confirmation Modal ─────────────────────────────────────── */}
      {bookingSuccess && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#0B1728] border border-[#E5EAF0] dark:border-[#17334F] shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#16A67A]/10 text-[#16A67A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-[#0B1728] dark:text-white">
                Vehicle Reserved Successfully!
              </h3>
              <p className="text-xs text-[#526174] dark:text-slate-400 mt-1">
                Booking reference: <strong className="text-[#0B1728] dark:text-white">#VITO-RENT-2049</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8995A5]">Vehicle:</span>
                <span className="font-bold text-[#0B1728] dark:text-white">{selectedVehicle.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8995A5]">Daily Rate:</span>
                <span className="font-bold text-[#0B1728] dark:text-white">₹{selectedVehicle.pricePerDay} / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8995A5]">Security Deposit:</span>
                <span className="font-bold text-[#0B1728] dark:text-white">₹{selectedVehicle.deposit}</span>
              </div>
              <div className="flex justify-between border-t border-[#E5EAF0] dark:border-[#17334F] pt-2">
                <span className="font-bold text-[#0B1728] dark:text-white">Insurance Coverage:</span>
                <span className="font-bold text-[#16A67A]">Zero-Depreciation Included</span>
              </div>
            </div>

            <button
              onClick={() => setBookingSuccess(false)}
              className="w-full py-3.5 rounded-xl bg-[#07111F] text-white text-xs font-bold shadow-md hover:bg-[#0B1728]"
            >
              Done & Return to Fleet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerRentalsPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <RentalsPageContent />
    </ProtectedRoute>
  );
}
