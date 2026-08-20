'use client';

import React, { useState, useEffect, useRef } from 'react';
<<<<<<< HEAD
import { Search, MapPin, Clock, X, Loader2, Sparkles, Navigation, Crosshair } from 'lucide-react';

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  displayName?: string;
  placeId?: string;
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  onClose?: () => void;
  accentColor?: string;
  dotColor?: string;
  showGpsButton?: boolean;
  hidePopularList?: boolean;
  className?: string;
}

export const POPULAR_SUGGESTIONS: PlaceResult[] = [
  { address: 'Kanpur Central Railway Station, Kanpur, Uttar Pradesh', lat: 26.4547, lng: 80.3507, placeId: 'knp_central' },
  { address: 'Chaudhary Charan Singh International Airport, Lucknow, Uttar Pradesh', lat: 26.7606, lng: 80.8893, placeId: 'lko_airport' },
  { address: 'Hazratganj Market, Lucknow, Uttar Pradesh', lat: 26.8500, lng: 80.9499, placeId: 'lko_hazratganj' },
  { address: 'Z Square Mall, Mall Road, Kanpur, Uttar Pradesh', lat: 26.4727, lng: 80.3524, placeId: 'knp_zsquare' },
  { address: 'Indira Gandhi International Airport Terminal 3, Delhi', lat: 28.5562, lng: 77.1000, placeId: 'del_t3' },
  { address: 'New Delhi Railway Station, Paharganj, Delhi', lat: 28.6430, lng: 77.2194, placeId: 'del_ndls' },
  { address: 'DLF Cyber City, Building 10, Gurugram, Haryana', lat: 28.4950, lng: 77.0895, placeId: 'ggn_cyber' },
  { address: 'Connaught Place Inner Circle, New Delhi', lat: 28.6315, lng: 77.2167, placeId: 'del_cp' },
  { address: 'Select CITYWALK Mall, Saket District Centre, Delhi', lat: 28.5284, lng: 77.2185, placeId: 'del_saket' },
  { address: 'Sector 62 IT Park, Noida, Uttar Pradesh', lat: 28.6280, lng: 77.3649, placeId: 'noi_sec62' },
  { address: 'Kempegowda International Airport, Bengaluru, Karnataka', lat: 13.1986, lng: 77.7066, placeId: 'blr_airport' },
  { address: 'Chhatrapati Shivaji Maharaj International Airport T2, Mumbai', lat: 19.0896, lng: 72.8656, placeId: 'bom_t2' },
];
=======
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
>>>>>>> somya

export default function AddressAutocomplete({
  value,
  onChange,
<<<<<<< HEAD
  onSelect,
  placeholder = 'Search location, airport, station...',
  label,
  autoFocus = false,
  onClose,
  accentColor = '#00C2B3',
  dotColor,
  showGpsButton = false,
  hidePopularList = false,
  className = '',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recents, setRecents] = useState<PlaceResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
=======
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
>>>>>>> somya
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

<<<<<<< HEAD
  // Debounced search against OpenStreetMap Nominatim
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
=======
  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
>>>>>>> somya
      setLoading(false);
      return;
    }

    setLoading(true);
<<<<<<< HEAD
    const handler = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=in&limit=6&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
=======
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
>>>>>>> somya
            },
          }
        );

<<<<<<< HEAD
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: PlaceResult[] = data.map((item: any) => ({
              address: item.display_name.split(',').slice(0, 3).join(',').trim(),
              displayName: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              placeId: String(item.place_id || item.osm_id || Math.random()),
            }));
            setResults(mapped);
            setIsOpen(true);
          } else {
            // Local fallback filter
            const fallback = POPULAR_SUGGESTIONS.filter((s) =>
              s.address.toLowerCase().includes(query.toLowerCase())
            );
            setResults(fallback);
            setIsOpen(fallback.length > 0);
          }
        } else {
          // Local fallback filter
          const fallback = POPULAR_SUGGESTIONS.filter((s) =>
            s.address.toLowerCase().includes(query.toLowerCase())
          );
          setResults(fallback);
          setIsOpen(fallback.length > 0);
        }
      } catch {
        const fallback = POPULAR_SUGGESTIONS.filter((s) =>
          s.address.toLowerCase().includes(query.toLowerCase())
        );
        setResults(fallback);
        setIsOpen(fallback.length > 0);
      } finally {
        setLoading(false);
      }
    }, 280);

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
    setIsOpen(false);
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
              ? data.display_name.split(',').slice(0, 3).join(',').trim()
              : `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            const currentPlace: PlaceResult = {
              address,
              lat,
              lng,
              displayName: data.display_name,
              placeId: 'current_gps',
            };
            handleSelectPlace(currentPlace);
          } else {
            handleSelectPlace({
              address: 'Current Location (GPS Verified)',
              lat,
              lng,
              placeId: 'current_gps',
            });
          }
        } catch {
          handleSelectPlace({
            address: 'Current Location (GPS Verified)',
            lat,
            lng,
            placeId: 'current_gps',
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
          placeId: 'del_cp',
        });
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div ref={containerRef} className={`w-full relative ${className}`}>
      {/* Label and GPS Action Header */}
      {(label || showGpsButton) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
              {dotColor ? (
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                  style={{ backgroundColor: dotColor }}
                />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              )}
              <span>{label}</span>
            </label>
          )}

          {showGpsButton && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A99D] hover:underline cursor-pointer disabled:opacity-50"
            >
              {locating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Crosshair className="w-3 h-3" />
              )}
              <span>Use Current Location</span>
            </button>
          )}
        </div>
      )}

      {/* Input Field Container */}
      <div className="relative group">
        <MapPin
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 shrink-0 transition-colors pointer-events-none"
          style={{ color: dotColor || accentColor }}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim().length >= 2 || recents.length > 0) {
              setIsOpen(true);
            }
          }}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/[0.04] dark:bg-[#10243A]/80 border border-white/[0.08] dark:border-[#17334F] text-xs sm:text-sm font-semibold text-white dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 dark:focus:border-primary-400 focus:ring-1 focus:ring-blue-500/40 transition-all shadow-inner"
        />

        {/* Clear / Loading Indicator */}
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin pointer-events-none" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 p-2 rounded-2xl bg-[#0B101E]/95 dark:bg-[#0B1728]/95 backdrop-blur-xl border border-blue-500/30 dark:border-[#17334F] shadow-2xl z-50 max-h-[280px] overflow-y-auto space-y-1 scrollbar-hide animate-fadeIn">
          {/* Real Autocomplete Results */}
          {results.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-3 py-1">
                Matched Locations
              </p>
              {results.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPlace(res)}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] dark:hover:bg-[#17334F] text-left transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
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
          ) : query.trim().length >= 2 && !loading ? (
            <div className="p-3 text-center">
              <p className="text-xs text-slate-400">No exact matches found for "{query}"</p>
              <button
                type="button"
                onClick={() => {
                  // Fallback custom location
                  handleSelectPlace({
                    address: query.trim(),
                    lat: 28.6139,
                    lng: 77.2090,
                    placeId: `custom_${Date.now()}`,
                  });
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
              >
                <MapPin className="w-3 h-3" />
                Use "{query.trim()}" as custom location
              </button>
            </div>
          ) : null}

          {/* Recent Searches */}
          {results.length === 0 && recents.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 px-3 py-1">
                <Clock className="w-3 h-3 text-slate-500" /> Recent Places
              </p>
              {recents.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPlace(item)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-300 truncate font-medium">{item.address}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Landmark Suggestions */}
          {!hidePopularList && results.length === 0 && (
            <div className="pt-1 border-t border-white/[0.06]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 px-3 py-1">
                <Navigation className="w-3 h-3 text-slate-500" /> Top Points of Interest
              </p>
              <div className="grid grid-cols-1 gap-1">
                {POPULAR_SUGGESTIONS.slice(0, 5).map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPlace(item)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.06] text-left transition-colors group cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white group-hover:text-primary-300 truncate">
                        {item.address.split(',')[0]}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.address.split(',').slice(1).join(',').trim()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
=======
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
>>>>>>> somya
            </div>
          )}
        </div>
      )}
    </div>
  );
}
