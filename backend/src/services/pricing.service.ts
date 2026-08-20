/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💰 PRICING SERVICE — Dynamic Fare Engine & Surge Calculator
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface VehicleFareConfig {
  id: string;
  name: string;
  categoryName: string;
  vehicleModel: string;
  seats: number;
  baseFare: number;
  baseKm: number;
  perKmRate: number;
  perMinRate: number;
  bookingFee: number;
  description: string;
  icon: string;
}

export const FARE_CONFIGS: Record<string, VehicleFareConfig> = {
  mini: {
    id: 'mini',
    name: 'Mini',
    categoryName: 'Compact Hatchback',
    vehicleModel: 'Maruti WagonR / Alto K10',
    seats: 4,
    baseFare: 45,
    baseKm: 1.5,
    perKmRate: 12.5,
    perMinRate: 1.2,
    bookingFee: 15,
    description: 'Affordable, compact rides for everyday quick city travel',
    icon: 'car',
  },
  sedan: {
    id: 'sedan',
    name: 'Sedan',
    categoryName: 'Comfortable Sedan',
    vehicleModel: 'Maruti Dzire / Honda Amaze',
    seats: 4,
    baseFare: 65,
    baseKm: 2.0,
    perKmRate: 15.5,
    perMinRate: 1.6,
    bookingFee: 20,
    description: 'Comfortable AC sedans with extra legroom & boot space',
    icon: 'car',
  },
  xcar: {
    id: 'xcar',
    name: 'Prime Executive',
    categoryName: 'Executive Sedan',
    vehicleModel: 'Honda City / Hyundai Verna',
    seats: 4,
    baseFare: 95,
    baseKm: 2.0,
    perKmRate: 19.5,
    perMinRate: 2.2,
    bookingFee: 25,
    description: 'Top-rated drivers & executive premium sedans',
    icon: 'sparkles',
  },
  suv: {
    id: 'suv',
    name: 'Prime SUV',
    categoryName: 'Spacious 6-Seater SUV',
    vehicleModel: 'Toyota Innova / Maruti Ertiga',
    seats: 6,
    baseFare: 135,
    baseKm: 3.0,
    perKmRate: 24.0,
    perMinRate: 3.0,
    bookingFee: 35,
    description: 'Extra room for groups & family with heavy luggage',
    icon: 'users',
  },
};

export interface CalculatedFareBreakdown {
  serviceType: string;
  vehicleType: string;
  vehicleConfig: VehicleFareConfig;
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surgeMultiplier: number;
  surgeLabel: string;
  surgeAmount: number;
  bookingFee: number;
  taxes: number;
  total: number;
  fareRange: string;
  etaMinutes: number;
}

export class PricingService {
  /**
   * Determine surge multiplier based on current hour / simulated peak periods
   */
  getSurgeMultiplier(date: Date = new Date()): { multiplier: number; label: string } {
    const hour = date.getHours();
    if (hour >= 8 && hour < 11) {
      return { multiplier: 1.25, label: 'Morning Rush Surge (1.25x)' };
    }
    if (hour >= 18 && hour < 21) {
      return { multiplier: 1.30, label: 'Evening Peak Surge (1.30x)' };
    }
    if (hour >= 23 || hour < 5) {
      return { multiplier: 1.15, label: 'Late Night Surge (1.15x)' };
    }
    return { multiplier: 1.0, label: 'Standard Rate' };
  }

  /**
   * Calculate complete itemized fare for a specific category
   */
  calculateFare(
    vehicleType = 'sedan',
    distanceKm: number,
    durationMinutes: number,
    date: Date = new Date()
  ): CalculatedFareBreakdown {
    const key = vehicleType.toLowerCase();
    const config = FARE_CONFIGS[key] || FARE_CONFIGS['sedan'];
    const { multiplier, label } = this.getSurgeMultiplier(date);

    const billableKm = Math.max(0, distanceKm - config.baseKm);
    const distanceCharge = Math.round(billableKm * config.perKmRate);
    const timeCharge = Math.round(durationMinutes * config.perMinRate);

    const subtotal = (config.baseFare + distanceCharge + timeCharge) * multiplier;
    const surgeAmount = Math.max(0, Math.round(subtotal - (config.baseFare + distanceCharge + timeCharge)));
    const bookingFee = config.bookingFee;
    const taxes = Math.round((subtotal + bookingFee) * 0.05); // 5% GST on transport

    const total = Math.round(subtotal + bookingFee + taxes);

    const lowEstimate = Math.max(config.baseFare, Math.round(total * 0.95));
    const highEstimate = Math.round(total * 1.1);
    const fareRange = `₹${lowEstimate} - ₹${highEstimate}`;

    const etaMinutes = Math.max(3, Math.min(12, Math.round(3 + Math.random() * 4)));

    return {
      serviceType: 'CAB',
      vehicleType: config.id,
      vehicleConfig: config,
      distanceKm,
      durationMinutes,
      baseFare: config.baseFare,
      distanceCharge,
      timeCharge,
      surgeMultiplier: multiplier,
      surgeLabel: label,
      surgeAmount,
      bookingFee,
      taxes,
      total,
      fareRange,
      etaMinutes,
    };
  }

  /**
   * Calculate fare options across all available vehicle tiers
   */
  calculateAllTiers(distanceKm: number, durationMinutes: number, date: Date = new Date()) {
    return Object.keys(FARE_CONFIGS).map((tierKey) =>
      this.calculateFare(tierKey, distanceKm, durationMinutes, date)
    );
  }
}

export const pricingService = new PricingService();
