/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🗺️ LOCATION SERVICE — OpenStreetMap Nominatim Provider Abstraction
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface LocationSuggestion {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

export interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

export class NominatimLocationProvider {
  private userAgent = 'VITO-Mobility-Engine/1.0 (contact@vito.app)';

  /**
   * Search locations by text query using Nominatim
   */
  async search(query: string, limit = 6): Promise<LocationSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=${limit}&countrycodes=in`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim search failed with status ${response.status}`);
      }

      const data = (await response.json()) as any[];

      return data.map((item) => ({
        placeId: String(item.place_id),
        name: item.display_name.split(',')[0],
        address: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.state_district || 'Delhi NCR',
        state: item.address?.state || 'Delhi',
      }));
    } catch (err: any) {
      console.warn('⚠️ Nominatim search error:', err.message);
      // Fallback: curated offline NCR places if network fails
      return this.fallbackSearch(query);
    }
  }

  /**
   * Reverse geocode coordinates to structured address
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationResult> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse geocode failed with status ${response.status}`);
      }

      const item = (await response.json()) as any;

      return {
        address: item.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
        city: item.address?.city || item.address?.town || item.address?.city_district || 'New Delhi',
        state: item.address?.state || 'Delhi',
        country: item.address?.country || 'India',
      };
    } catch (err: any) {
      console.warn('⚠️ Nominatim reverse geocode error:', err.message);
      return {
        address: `GPS Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
      };
    }
  }

  private fallbackSearch(query: string): LocationSuggestion[] {
    const q = query.toLowerCase();
    const curated = [
      { placeId: 'fb_1', name: 'Connaught Place', address: 'Connaught Place, Central Delhi, New Delhi, Delhi', latitude: 28.6315, longitude: 77.2167, city: 'New Delhi', state: 'Delhi' },
      { placeId: 'fb_2', name: 'IGI Airport T3', address: 'Indira Gandhi International Airport Terminal 3, New Delhi, Delhi', latitude: 28.5562, longitude: 77.1000, city: 'New Delhi', state: 'Delhi' },
      { placeId: 'fb_3', name: 'Cyber City', address: 'DLF Cyber City, Sector 24, Gurugram, Haryana', latitude: 28.4950, longitude: 77.0895, city: 'Gurugram', state: 'Haryana' },
      { placeId: 'fb_4', name: 'Noida Sector 18', address: 'Sector 18 Metro Station, Noida, Uttar Pradesh', latitude: 28.5708, longitude: 77.3260, city: 'Noida', state: 'Uttar Pradesh' },
      { placeId: 'fb_5', name: 'New Delhi Railway Station', address: 'Bhavbhuti Marg, Ratan Lal Market, New Delhi, Delhi', latitude: 28.6429, longitude: 77.2195, city: 'New Delhi', state: 'Delhi' },
      { placeId: 'fb_6', name: 'Select CITYWALK', address: 'Select CITYWALK Saket, District Centre, New Delhi, Delhi', latitude: 28.5284, longitude: 77.2185, city: 'New Delhi', state: 'Delhi' },
    ];
    return curated.filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
  }
}

export const locationService = new NominatimLocationProvider();
