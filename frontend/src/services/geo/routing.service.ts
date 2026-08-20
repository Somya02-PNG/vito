/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛣️ ROUTING SERVICE — Road LineString & Route Estimator
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface Point {
  lat: number;
  lng: number;
}

export interface RouteGeometryData {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lng, lat] for MapLibre / GeoJSON
  source: 'OSRM' | 'FALLBACK';
}

export class GeoRoutingService {
  /**
   * Fetch real road geometry and travel duration from OSRM
   */
  static async fetchRoadRoute(origin: Point, destination: Point): Promise<RouteGeometryData> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('OSRM network request failed');

      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.max(1, Number((route.distance / 1000).toFixed(2)));
        const durationMinutes = Math.max(3, Math.ceil(route.duration / 60));
        const coordinates: [number, number][] = route.geometry.coordinates;

        return {
          distanceKm,
          durationMinutes,
          coordinates,
          source: 'OSRM',
        };
      }
      throw new Error('No valid route in response');
    } catch {
      // Fallback straight interpolated line
      const distanceKm = Number((this.calculateCrowDistance(origin, destination) * 1.35).toFixed(2));
      const durationMinutes = Math.max(3, Math.ceil((distanceKm / 25) * 60));

      const steps = 20;
      const coordinates: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = origin.lat + (destination.lat - origin.lat) * t;
        const lng = origin.lng + (destination.lng - origin.lng) * t;
        coordinates.push([lng, lat]);
      }

      return {
        distanceKm,
        durationMinutes,
        coordinates,
        source: 'FALLBACK',
      };
    }
  }

  private static calculateCrowDistance(p1: Point, p2: Point): number {
    const R = 6371;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
