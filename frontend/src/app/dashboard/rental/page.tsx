'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import {
  Search,
  MapPin,
  Calendar,
  Truck,
  Filter,
  X,
  Star,
  Fuel,
  Cog,
  Users,
  ChevronDown,
  SlidersHorizontal,
  Car,
  Bike,
  Sparkles,
  Zap,
  ArrowUpDown,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Key,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Vehicle {
  _id: string;
  category: string;
  fuelType: string;
  transmission: string;
  seats: number;
  pricePerDay: number;
  images: string[];
  rating: number;
  deliveryAvailable: boolean;
  createdAt: string;
}

interface Filters {
  category: string[];
  fuelType: string[];
  transmission: string;
  seats: string;
  minPrice: string;
  maxPrice: string;
  deliveryAvailable: boolean;
  sort: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { id: 'sedan', label: 'Sedan', icon: '🚗' },
  { id: 'suv', label: 'SUV', icon: '🚙' },
  { id: 'hatchback', label: 'Hatch', icon: '🏎️' },
  { id: 'bike', label: 'Bike', icon: '🏍️' },
  { id: 'luxury', label: 'Luxury', icon: '✨' },
  { id: 'van', label: 'Van', icon: '🚐' },
];

const FUEL_TYPES = [
  { id: 'petrol', label: 'Petrol', color: 'text-amber-400' },
  { id: 'diesel', label: 'Diesel', color: 'text-slate-300' },
  { id: 'electric', label: 'Electric', color: 'text-emerald-400' },
  { id: 'hybrid', label: 'Hybrid', color: 'text-cyan-400' },
  { id: 'cng', label: 'CNG', color: 'text-lime-400' },
];

const SEAT_OPTIONS = ['Any', '2', '4', '5', '6', '7+'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  sedan: 'from-blue-600/20 to-indigo-600/20',
  suv: 'from-emerald-600/20 to-teal-600/20',
  hatchback: 'from-violet-600/20 to-purple-600/20',
  bike: 'from-rose-600/20 to-pink-600/20',
  luxury: 'from-amber-600/20 to-yellow-600/20',
  van: 'from-cyan-600/20 to-sky-600/20',
};

const CATEGORY_BORDER: Record<string, string> = {
  sedan: 'border-blue-500/30',
  suv: 'border-emerald-500/30',
  hatchback: 'border-violet-500/30',
  bike: 'border-rose-500/30',
  luxury: 'border-amber-500/30',
  van: 'border-cyan-500/30',
};

const FUEL_ICONS: Record<string, string> = {
  petrol: '⛽',
  diesel: '🛢️',
  electric: '⚡',
  hybrid: '🔋',
  cng: '💨',
};

// ─── Default Filters ─────────────────────────────────────────────────────────
const DEFAULT_FILTERS: Filters = {
  category: [],
  fuelType: [],
  transmission: '',
  seats: '',
  minPrice: '',
  maxPrice: '',
  deliveryAvailable: false,
  sort: 'newest',
};

// ─── Skeleton Card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#111827]/60 border border-white/[0.06] overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-44 bg-gradient-to-br from-white/[0.04] to-white/[0.02]">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer bg-[length:200%_100%]" />
      </div>
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
        </div>
        <div className="h-3 w-36 rounded-full bg-white/[0.04]" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-14 rounded-full bg-white/[0.04]" />
          <div className="h-3 w-14 rounded-full bg-white/[0.04]" />
          <div className="h-3 w-14 rounded-full bg-white/[0.04]" />
        </div>
        <div className="pt-2 border-t border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
            <div className="h-9 w-24 rounded-xl bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Card ────────────────────────────────────────────────────────────
function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const gradient = CATEGORY_GRADIENTS[vehicle.category] || 'from-slate-600/20 to-slate-700/20';

  return (
    <Link href={`/dashboard/rental/${vehicle._id}`} className="block">
      <VehicleCardInner vehicle={vehicle} gradient={gradient} />
    </Link>
  );
}

function VehicleCardInner({ vehicle, gradient }: { vehicle: Vehicle; gradient: string }) {
  const borderColor = CATEGORY_BORDER[vehicle.category] || 'border-slate-500/30';
  const fuelIcon = FUEL_ICONS[vehicle.fuelType] || '⛽';

  return (
    <div className="group module-card rounded-2xl bg-[#111827]/60 border border-white/[0.06] overflow-hidden backdrop-blur-sm">
      {/* Image Area */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {/* Gradient overlay mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.04),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03),transparent_50%)]" />

        {vehicle.images && vehicle.images.length > 0 ? (
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.category} vehicle`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Car className="w-12 h-12 text-white/20 mx-auto mb-2" />
              <span className="text-xs text-white/30 font-medium">No Image</span>
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border ${borderColor} text-[10px] font-bold uppercase tracking-wider text-white`}>
          {vehicle.category}
        </div>

        {/* Availability Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-300">Available</span>
        </div>

        {/* Delivery Badge */}
        {vehicle.deliveryAvailable && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500/20 backdrop-blur-md border border-primary-500/30">
            <Truck className="w-3 h-3 text-primary-300" />
            <span className="text-[10px] font-medium text-primary-200">Home Delivery</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title + Rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-bold text-white capitalize group-hover:text-primary-200 transition-colors">
            {vehicle.category} {vehicle.transmission === 'automatic' ? 'AT' : 'MT'}
          </h3>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-amber-300">
              {vehicle.rating > 0 ? vehicle.rating.toFixed(1) : 'New'}
            </span>
          </div>
        </div>

        {/* Specs Row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <span className="text-xs">{fuelIcon}</span>
            <span className="text-[11px] text-slate-400 capitalize">{vehicle.fuelType}</span>
          </div>
          <div className="w-px h-3 bg-white/[0.08]" />
          <div className="flex items-center gap-1">
            <Cog className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] text-slate-400 capitalize">{vehicle.transmission}</span>
          </div>
          <div className="w-px h-3 bg-white/[0.08]" />
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] text-slate-400">{vehicle.seats} seats</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div>
            <span className="text-lg font-extrabold text-white">₹{vehicle.pricePerDay.toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-slate-500 ml-1">/day</span>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-xs font-bold transition-all duration-200 shadow-lg shadow-primary-500/20 active:scale-95">
            <Key className="w-3.5 h-3.5" />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 px-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-white/[0.06] flex items-center justify-center mb-5">
        <XCircle className="w-10 h-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No vehicles match your filters</h3>
      <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
        Try adjusting your search criteria or removing some filters to see more results.
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-slate-300 hover:bg-white/[0.1] hover:text-white transition-all duration-200"
      >
        <RotateCcw className="w-4 h-4" />
        Reset All Filters
      </button>
    </div>
  );
}

// ─── Filter Chip ─────────────────────────────────────────────────────────────
function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
        active
          ? 'bg-primary-500/15 border-primary-500/40 text-primary-300 shadow-sm shadow-primary-500/10'
          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/[0.1]'
      }`}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function RentalPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [showFilters, setShowFilters] = useState(false);

  // Search bar state
  const [location, setLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropDate, setDropDate] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch Vehicles ──────────────────────────────────────────────────────
  const fetchVehicles = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (filters.category.length > 0) params.set('category', filters.category.join(','));
        if (filters.fuelType.length > 0) params.set('fuelType', filters.fuelType.join(','));
        if (filters.transmission) params.set('transmission', filters.transmission);
        if (filters.seats && filters.seats !== 'Any') {
          const s = filters.seats.replace('+', '');
          params.set('seats', s);
        }
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.deliveryAvailable) params.set('deliveryAvailable', 'true');
        if (filters.sort) params.set('sort', filters.sort);
        params.set('page', page.toString());
        params.set('limit', '12');

        const queryString = params.toString();
        const res = await fetchAPI<{
          vehicles: Vehicle[];
          total: number;
          page: number;
          totalPages: number;
        }>(`/api/vehicles${queryString ? `?${queryString}` : ''}`);

        setVehicles(res.data?.vehicles ?? []);
        setTotalResults(res.data?.total ?? 0);
        setTotalPages(res.data?.totalPages ?? 0);
        setCurrentPage(res.data?.page ?? 1);
      } catch {
        setVehicles([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Debounced fetch on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchVehicles(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchVehicles]);

  // ─── Filter Helpers ──────────────────────────────────────────────────────
  const toggleArrayFilter = (key: 'category' | 'fuelType', value: string) => {
    setFilters((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setLocation('');
    setPickupDate('');
    setDropDate('');
  };

  const activeFilterCount =
    filters.category.length +
    filters.fuelType.length +
    (filters.transmission ? 1 : 0) +
    (filters.seats && filters.seats !== 'Any' ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.deliveryAvailable ? 1 : 0);

  // Today's date string for date inputs min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* ── Background Ambient Effects ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-hero-glow pointer-events-none opacity-60" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-60 -left-40 w-[400px] h-[400px] bg-primary-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ════════════════════════════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════════════════════════════ */}
        <section className="pt-6 pb-4 sm:pt-8 sm:pb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              <Key className="w-3 h-3" />
              Self Drive
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Vehicle <span className="text-gradient">Rental</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-lg">
            Choose from our curated fleet of cars, bikes & SUVs. Daily rates, flexible durations, doorstep delivery.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SEARCH BAR
        ════════════════════════════════════════════════════════════════════ */}
        <section className="pb-5">
          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              {/* Location */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  <MapPin className="w-3 h-3" />
                  Pickup Location
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="City or area..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Pickup Date */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3 h-3" />
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  min={today}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all [color-scheme:dark]"
                />
              </div>

              {/* Drop Date */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3 h-3" />
                  Drop-off Date
                </label>
                <input
                  type="date"
                  value={dropDate}
                  min={pickupDate || today}
                  onChange={(e) => setDropDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all [color-scheme:dark]"
                />
              </div>

              {/* Home Delivery Toggle + Search */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      deliveryAvailable: !prev.deliveryAvailable,
                    }))
                  }
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    filters.deliveryAvailable
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span className="hidden sm:inline">Home Delivery</span>
                  <div
                    className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
                      filters.deliveryAvailable ? 'bg-emerald-500' : 'bg-white/[0.15]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${
                        filters.deliveryAvailable ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </button>

                <button
                  onClick={() => fetchVehicles(1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary-500/25 active:scale-95 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            FILTER BAR + RESULTS GRID
        ════════════════════════════════════════════════════════════════════ */}
        <section className="pb-10 sm:pb-16">
          {/* Filter Toggle + Result Count + Sort */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                  showFilters
                    ? 'bg-primary-500/15 border-primary-500/40 text-primary-300'
                    : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/[0.12]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-slate-400 hover:text-white hover:border-white/[0.12] transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}

              {!loading && (
                <span className="text-xs text-slate-500">
                  {totalResults} vehicle{totalResults !== 1 ? 's' : ''} found
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                  className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary-500/40 cursor-pointer [color-scheme:dark]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Expandable Filter Panel ── */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showFilters ? 'max-h-[600px] opacity-100 mb-5' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="glass-panel rounded-2xl p-5 space-y-5">
              {/* Vehicle Type */}
              <div>
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  <Car className="w-3 h-3" />
                  Vehicle Type
                </h4>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_TYPES.map((type) => (
                    <FilterChip
                      key={type.id}
                      label={type.label}
                      icon={type.icon}
                      active={filters.category.includes(type.id)}
                      onClick={() => toggleArrayFilter('category', type.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Fuel Type */}
              <div>
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  <Fuel className="w-3 h-3" />
                  Fuel Type
                </h4>
                <div className="flex flex-wrap gap-2">
                  {FUEL_TYPES.map((fuel) => (
                    <FilterChip
                      key={fuel.id}
                      label={fuel.label}
                      icon={FUEL_ICONS[fuel.id]}
                      active={filters.fuelType.includes(fuel.id)}
                      onClick={() => toggleArrayFilter('fuelType', fuel.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Transmission */}
                <div>
                  <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    <Cog className="w-3 h-3" />
                    Transmission
                  </h4>
                  <div className="flex gap-2">
                    {['manual', 'automatic'].map((t) => (
                      <FilterChip
                        key={t}
                        label={t === 'manual' ? 'Manual' : 'Automatic'}
                        active={filters.transmission === t}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            transmission: prev.transmission === t ? '' : t,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Seats */}
                <div>
                  <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    <Users className="w-3 h-3" />
                    Seats
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {SEAT_OPTIONS.map((s) => (
                      <FilterChip
                        key={s}
                        label={s}
                        active={filters.seats === s}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            seats: prev.seats === s ? '' : s,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    💰 Price Range (₹/day)
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/40 transition-all [color-scheme:dark]"
                    />
                    <span className="text-slate-500 text-xs">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/40 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Vehicle Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {loading ? (
              // Skeleton loading state
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : vehicles.length === 0 ? (
              // Empty state
              <EmptyState onReset={resetFilters} />
            ) : (
              // Vehicle cards
              vehicles.map((vehicle) => (
                <VehicleCard key={vehicle._id} vehicle={vehicle} />
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => fetchVehicles(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-slate-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchVehicles(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => fetchVehicles(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-slate-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
