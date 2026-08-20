/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔍 GEOCODING SERVICE — Location Autocomplete & Reverse Geocoding
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { fetchAPI } from '@/lib/api';

export interface LocationSuggestion {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

export class GeocodingService {
  private static cache = new Map<string, LocationSuggestion[]>();
  private static reverseCache = new Map<string, GeocodeResult>();

  /**
   * Search locations with local memoization
   */
  static async search(query: string): Promise<LocationSuggestion[]> {
    const clean = query.trim().toLowerCase();
    if (!clean || clean.length < 2) return [];

    if (this.cache.has(clean)) {
      return this.cache.get(clean)!;
    }

    try {
      const res = await fetchAPI<{ results: LocationSuggestion[] }>(
        `/api/location/search?q=${encodeURIComponent(clean)}`
      );

      const results = res.data?.results || [];
      this.cache.set(clean, results);
      return results;
    } catch (err) {
      console.warn('Location search fallback:', err);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to structured address
   */
  static async reverse(lat: number, lng: number): Promise<GeocodeResult> {
    const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    if (this.reverseCache.has(key)) {
      return this.reverseCache.get(key)!;
    }

    try {
      const res = await fetchAPI<GeocodeResult>('/api/location/resolve', {
        method: 'POST',
        body: { latitude: lat, longitude: lng },
      });

      const result: GeocodeResult = res.data || {
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
      };

      this.reverseCache.set(key, result);
      return result;
    } catch {
      return {
        address: `GPS Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
      };
    }
  }
}
