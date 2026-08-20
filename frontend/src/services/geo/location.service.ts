/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📍 BROWSER LOCATION SERVICE — High-Accuracy Geolocation Provider
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface UserCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export type LocationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface LocationState {
  status: 'IDLE' | 'DETECTING' | 'DETECTED' | 'PERMISSION_DENIED' | 'TIMEOUT' | 'UNAVAILABLE';
  coords: UserCoordinate | null;
  confidence: LocationConfidence;
  errorMessage?: string;
}

export class BrowserLocationService {
  /**
   * Determine confidence level based on GPS accuracy radius
   */
  static getConfidence(accuracyMeters?: number): LocationConfidence {
    if (!accuracyMeters) return 'MEDIUM';
    if (accuracyMeters <= 25) return 'HIGH';
    if (accuracyMeters <= 100) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Capture current high-accuracy position from browser with timeout
   */
  static getCurrentPosition(timeoutMs = 8000): Promise<UserCoordinate> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your device browser.'));
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          });
        },
        (err) => {
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Watch live GPS stream for mobile drivers / moving customers
   */
  static watchPosition(
    onSuccess: (coords: UserCoordinate) => void,
    onError: (err: GeolocationPositionError) => void
  ): number | null {
    if (typeof window === 'undefined' || !navigator.geolocation) return null;

    return navigator.geolocation.watchPosition(
      (pos) => {
        onSuccess({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
      },
      onError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }

  static clearWatch(watchId: number) {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}
