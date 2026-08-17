'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, X, Loader2, Sparkles, Navigation, Crosshair } from 'lucide-react';

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  displayName?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  onClose?: () => void;
  accentColor?: string;
}

const POPULAR_SUGGESTIONS: PlaceResult[] = [
  { address: 'Indira Gandhi International Airport Terminal 3, Delhi', lat: 28.5562, lng: 77.1000 },
  { address: 'New Delhi Railway Station, Paharganj, Delhi', lat: 28.6430, lng: 77.2194 },
  { address: 'DLF Cyber City, Building 10, Gurugram', lat: 28.4950, lng: 77.0895 },
  { address: 'Connaught Place Inner Circle, New Delhi', lat: 28.6315, lng: 77.2167 },
  { address: 'Select CITYWALK Mall, Saket District Centre, Delhi', lat: 28.5284, lng: 77.2185 },
  { address: 'Sector 62 IT Park, Noida', lat: 28.6280, lng: 77.3649 },
];

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search destination, airport, station...',
  label = 'Where to?',
  autoFocus = false,
  onClose,
  accentColor = '#00C2B3',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recents, setRecents] = useState<PlaceResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal query state with external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Load recents from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vito_recent_searches');
      if (saved) {
        setRecents(JSON.parse(saved).slice(0, 4));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced search against OpenStreetMap Nominatim
  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=in&limit=6&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const mapped: PlaceResult[] = data.map((item: any) => ({
            address: item.display_name.split(',').slice(0, 3).join(','),
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          setResults(mapped);
        } else {
          // Local fallback filter
          const fallback = POPULAR_SUGGESTIONS.filter((s) =>
            s.address.toLowerCase().includes(query.toLowerCase())
          );
          setResults(fallback);
        }
      } catch {
        const fallback = POPULAR_SUGGESTIONS.filter((s) =>
          s.address.toLowerCase().includes(query.toLowerCase())
        );
        setResults(fallback);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelectPlace = (place: PlaceResult) => {
    // Save to recents
    try {
      const existing = recents.filter((r) => r.address !== place.address);
      const updated = [place, ...existing].slice(0, 5);
      setRecents(updated);
      localStorage.setItem('vito_recent_searches', JSON.stringify(updated));
    } catch {
      // Ignore
    }

    setQuery(place.address);
    setResults([]);
    onChange(place.address);
    onSelect(place);
  };

  // Geolocation handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          // Reverse geocode via Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const address = data.display_name
              ? data.display_name.split(',').slice(0, 3).join(',')
              : `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            const currentPlace: PlaceResult = {
              address,
              lat,
              lng,
              displayName: data.display_name,
            };
            handleSelectPlace(currentPlace);
          } else {
            handleSelectPlace({
              address: 'Current Location (Connaught Place, New Delhi)',
              lat: 28.6315,
              lng: 77.2167,
            });
          }
        } catch {
          handleSelectPlace({
            address: 'Current Location (Connaught Place, New Delhi)',
            lat: 28.6315,
            lng: 77.2167,
          });
        } finally {
          setLocating(false);
        }
      },
      () => {
        // Fallback if user denies permission
        handleSelectPlace({
          address: 'Connaught Place Inner Circle, New Delhi',
          lat: 28.6315,
          lng: 77.2167,
        });
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="w-full space-y-3 animate-fadeIn">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[#526174] dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#00C2B3]" />
          {label}
        </label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A99D] hover:underline"
        >
          {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />}
          Use Current Location
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8995A5]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs sm:text-sm font-semibold text-[#0B1728] dark:text-white placeholder:text-[#8995A5] focus:outline-none focus:border-[#00C2B3] focus:ring-1 focus:ring-[#00C2B3] transition-all"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00C2B3] animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
              setResults([]);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8995A5] hover:text-[#0B1728] dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Results */}
      {results.length > 0 && (
        <div className="space-y-1 p-2 rounded-2xl bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#00C2B3]/30 shadow-xl z-20 relative">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#00A99D] px-3 py-1">
            Search Results
          </p>
          {results.map((res, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPlace(res)}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F0FCFB] dark:hover:bg-[#10243A] text-left transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00C2B3]/10 border border-[#00C2B3]/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4 text-[#00A99D]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0B1728] dark:text-white group-hover:text-[#00A99D] transition-colors truncate">
                  {res.address}
                </p>
                {res.displayName && (
                  <p className="text-[10px] text-[#526174] dark:text-slate-400 truncate mt-0.5">
                    {res.displayName}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {results.length === 0 && recents.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8995A5] flex items-center gap-1 px-1">
            <Clock className="w-3 h-3" /> Recent Searches
          </p>
          <div className="space-y-1">
            {recents.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPlace(item)}
                className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] hover:bg-[#F1F5F8] border border-[#E5EAF0] dark:border-[#17334F] text-left transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-[#8995A5] shrink-0" />
                <span className="text-xs text-[#0B1728] dark:text-slate-300 truncate font-semibold">{item.address}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Suggestions */}
      {results.length === 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8995A5] flex items-center gap-1 px-1">
            <Navigation className="w-3 h-3" /> Popular Points of Interest
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {POPULAR_SUGGESTIONS.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPlace(item)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] hover:bg-[#F0FCFB] dark:hover:bg-[#17334F] border border-[#E5EAF0] dark:border-[#17334F] text-left transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 text-[#00A99D] shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#0B1728] dark:text-slate-200 group-hover:text-[#00A99D] truncate">
                    {item.address.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-[#526174] dark:text-slate-400 truncate">{item.address.split(',')[1] || 'Delhi NCR'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
