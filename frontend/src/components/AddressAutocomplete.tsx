'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search, X } from 'lucide-react';

export interface NominatimLocation {
  address: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (location: NominatimLocation) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Search address or location...',
  icon = <MapPin className="w-4 h-4 text-emerald-400" />,
  className = '',
  inputClassName = '',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes to internal query state
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            trimmed
          )}&addressdetails=1&limit=5`,
          {
            headers: {
              'Accept-Language': 'en-US,en',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch location suggestions');
        }

        const data: NominatimResult[] = await response.json();
        setSuggestions(data || []);
        setIsOpen(true);
      } catch (err: any) {
        setError(err.message || 'Error fetching addresses');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
  };

  const handleSelect = (item: NominatimResult) => {
    const address = item.display_name;
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    setQuery(address);
    onChange(address);
    onSelectLocation({ address, lat, lng });
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          {loading ? <Loader2 className="w-4 h-4 text-primary-400 animate-spin" /> : icon}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim().length >= 3) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all ${inputClassName}`}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-[#0F172A] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {loading && suggestions.length === 0 && (
            <div className="p-3.5 text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
              Searching locations...
            </div>
          )}

          {!loading && suggestions.length === 0 && query.trim().length >= 3 && (
            <div className="p-3.5 text-xs text-slate-400 text-center">
              No matching locations found
            </div>
          )}

          {suggestions.length > 0 && (
            <ul className="max-h-60 overflow-y-auto divide-y divide-white/[0.04]">
              {suggestions.map((item) => {
                const parts = item.display_name.split(',');
                const title = parts[0];
                const subtitle = parts.slice(1).join(',').trim();

                return (
                  <li key={item.place_id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full text-left p-3 hover:bg-white/[0.06] transition-colors flex items-start gap-2.5 group"
                    >
                      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-primary-400 shrink-0 mt-0.5 transition-colors" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white group-hover:text-primary-300 truncate transition-colors">
                          {title}
                        </div>
                        {subtitle && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {error && (
            <div className="p-3 text-[11px] text-rose-400 text-center bg-rose-500/10 border-t border-rose-500/20">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
