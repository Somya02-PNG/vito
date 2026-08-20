/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛣️ ROUTING SERVICE — OSRM Road Distance & Geometry Provider
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry?: string;
  source: 'OSRM' | 'HAVERSINE_FALLBACK';
}

export class OSRMRoutingProvider {
  /**
   * Calculate real road distance and duration using OSRM demo routing cluster
   */
  async getRoute(origin: Coordinate, destination: Coordinate): Promise<RouteResult> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=simplified&geometries=geojson`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VITO-Mobility-Engine/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`OSRM API responded with status ${response.status}`);
      }

      const data = (await response.json()) as any;

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const distanceKm = Math.max(1, Number((primaryRoute.distance / 1000).toFixed(2)));
        const durationMinutes = Math.max(3, Math.ceil(primaryRoute.duration / 60));

        return {
          distanceKm,
          durationMinutes,
          geometry: JSON.stringify(primaryRoute.geometry),
          source: 'OSRM',
        };
      }

      throw new Error('No valid routes returned from OSRM');
    } catch (err: any) {
      console.warn('⚠️ OSRM routing failed, applying Haversine fallback formula:', err.message);
      return this.haversineFallback(origin, destination);
    }
  }

  /**
   * Haversine mathematical distance calculation for reliable fallback
   */
  private haversineFallback(origin: Coordinate, destination: Coordinate): RouteResult {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(destination.latitude - origin.latitude);
    const dLon = this.deg2rad(destination.longitude - origin.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(origin.latitude)) *
        Math.cos(this.deg2rad(destination.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const crowFliesKm = R * c;

    // Road factor adjustment (typical urban road network is ~1.35x crow-flies distance)
    const distanceKm = Math.max(1, Number((crowFliesKm * 1.35).toFixed(2)));
    // Average urban speed 25 km/h
    const durationMinutes = Math.max(3, Math.ceil((distanceKm / 25) * 60));

    return {
      distanceKm,
      durationMinutes,
      source: 'HAVERSINE_FALLBACK',
    };
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const routingService = new OSRMRoutingProvider();
