'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, X, Loader2, Sparkles, Navigation } from 'lucide-react';

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
  autoFocus = true,
  onClose,
  accentColor = '#3B82F6',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<PlaceResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Debounced search against Nominatim
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
    }, 350);

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

    onChange(place.address);
    onSelect(place);
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          {label}
        </label>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.12] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              onChange('');
              setResults([]);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Results */}
      {results.length > 0 && (
        <div className="space-y-1 p-2 rounded-2xl bg-[#0F172A]/90 border border-blue-500/20 backdrop-blur-md shadow-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-3 py-1">
            Search Results
          </p>
          {results.map((res, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPlace(res)}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] text-left transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                  {res.address}
                </p>
                {res.displayName && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
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
        <div className="space-y-1.5 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 px-1">
            <Clock className="w-3 h-3" /> Recent Searches
          </p>
          <div className="space-y-1">
            {recents.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSelectPlace(item)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-left transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-300 truncate font-medium">{item.address}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Suggestions */}
      {results.length === 0 && (
        <div className="space-y-1.5 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 px-1">
            <Navigation className="w-3 h-3" /> Popular Points of Interest
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {POPULAR_SUGGESTIONS.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSelectPlace(item)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-left transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {item.address.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{item.address.split(',')[1] || 'Delhi NCR'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
