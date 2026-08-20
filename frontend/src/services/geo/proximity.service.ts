/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🧭 PROXIMITY & VEHICLE INTERPOLATION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Point } from './routing.service';

export interface VehicleTelemetry {
  id: string;
  lat: number;
  lng: number;
  heading: number; // 0 to 360 degrees
  speedKmh?: number;
  vehicleType?: string;
  etaMinutes?: number;
}

export class ProximityService {
  /**
   * Calculate true bearing angle (heading) between two coordinates in degrees
   */
  static calculateHeading(from: Point, to: Point): number {
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }

  /**
   * Linear interpolation between two coordinates
   */
  static interpolatePosition(from: Point, to: Point, fraction: number): Point {
    const clampedFraction = Math.max(0, Math.min(1, fraction));
    return {
      lat: from.lat + (to.lat - from.lat) * clampedFraction,
      lng: from.lng + (to.lng - from.lng) * clampedFraction,
    };
  }
}
