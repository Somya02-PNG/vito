/**
 * RentalPricingService
 *
 * Calculates dynamic, itemized pricing for a vehicle rental.
 * Factors: vehicle base rate, city multiplier, duration tier discount,
 * pickup method (delivery fee), one-way fee, protection fee,
 * platform fee, GST, and security deposit (always a separate line item).
 *
 * Never returns a flat/single price — always returns a full breakdown.
 */

export interface RentalPricingParams {
  pricePerDay: number;           // Vehicle's base daily rate
  depositAmount: number;         // Vehicle's security deposit
  pickupDateTime: Date;
  returnDateTime: Date;
  city: string;
  pickupMethod: 'self_pickup' | 'doorstep_delivery';
  deliveryDistanceKm?: number;   // For delivery fee calculation
  isOneWay: boolean;
  couponCode?: string;
}

export interface RentalPricingResult {
  durationHours: number;
  durationDays: number;
  durationLabel: string;         // e.g. "2 Days 6 Hours"
  baseRental: number;
  durationAdjustment: number;    // negative = discount
  deliveryFee: number;
  oneWayFee: number;
  protectionFee: number;
  platformFee: number;
  tax: number;
  securityDeposit: number;       // ALWAYS separate — never merged into totalPayable
  discount: number;
  totalPayable: number;          // rental total, EXCLUDING deposit
  totalWithDeposit: number;      // total including deposit (shown as "pay now")
}

// ─── City Pricing Multipliers ────────────────────────────────────────────────
const CITY_MULTIPLIERS: Record<string, number> = {
  'delhi ncr': 1.0,
  'mumbai': 1.15,
  'bengaluru': 1.10,
  'hyderabad': 1.05,
  'chennai': 1.05,
  'pune': 1.05,
  'jaipur': 0.95,
  'goa': 1.20,
  'kolkata': 1.0,
  'lucknow': 0.92,
};

// ─── Duration Discount Tiers ─────────────────────────────────────────────────
// 1 day: 0%, 3+ days: 5%, 7+ days: 12%, 14+ days: 18%
function getDurationDiscount(days: number): number {
  if (days >= 14) return 0.18;
  if (days >= 7) return 0.12;
  if (days >= 3) return 0.05;
  return 0;
}

// ─── Protection Fee (mandatory, covers basic damage protection) ──────────────
function getProtectionFee(baseRental: number): number {
  // 8% of base rental, min ₹150, max ₹2000/day
  return Math.min(Math.max(Math.round(baseRental * 0.08), 150), 2000);
}

// ─── Platform Fee ────────────────────────────────────────────────────────────
function getPlatformFee(subtotal: number): number {
  // 5% of rental subtotal (not deposit)
  return Math.round(subtotal * 0.05);
}

// ─── Delivery Fee ────────────────────────────────────────────────────────────
function getDeliveryFee(distanceKm: number = 10, city: string): number {
  const base = city === 'mumbai' || city === 'goa' ? 399 : 299;
  const perKm = 12;
  return base + Math.max(0, distanceKm - 5) * perKm;
}

// ─── Main Calculator ─────────────────────────────────────────────────────────
export function calculateRentalPrice(params: RentalPricingParams): RentalPricingResult {
  const {
    pricePerDay,
    depositAmount,
    pickupDateTime,
    returnDateTime,
    city,
    pickupMethod,
    deliveryDistanceKm,
    isOneWay,
    couponCode,
  } = params;

  // Duration calculation
  const durationMs = returnDateTime.getTime() - pickupDateTime.getTime();
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
  const durationDays = Math.ceil(durationHours / 24);
  const fracDays = durationHours / 24;

  const durationDaysDisplay = Math.floor(fracDays);
  const remainderHours = durationHours - durationDaysDisplay * 24;
  const durationLabel =
    durationDaysDisplay > 0 && remainderHours > 0
      ? `${durationDaysDisplay} Day${durationDaysDisplay !== 1 ? 's' : ''} ${remainderHours} Hour${remainderHours !== 1 ? 's' : ''}`
      : durationDaysDisplay > 0
      ? `${durationDaysDisplay} Day${durationDaysDisplay !== 1 ? 's' : ''}`
      : `${durationHours} Hour${durationHours !== 1 ? 's' : ''}`;

  // City multiplier
  const cityKey = city.toLowerCase();
  const cityMult = CITY_MULTIPLIERS[cityKey] || 1.0;

  // Base rental (pricePerDay × fracDays × cityMultiplier)
  const baseRental = Math.round(pricePerDay * fracDays * cityMult);

  // Duration discount
  const discountRate = getDurationDiscount(durationDays);
  const durationAdjustment = -Math.round(baseRental * discountRate);

  // Rental subtotal after discount
  const rentalAfterDiscount = baseRental + durationAdjustment;

  // Delivery fee (₹0 if self-pickup)
  const deliveryFee = pickupMethod === 'doorstep_delivery'
    ? getDeliveryFee(deliveryDistanceKm, cityKey)
    : 0;

  // One-way fee
  const oneWayFee = isOneWay ? Math.round(pricePerDay * 0.3) : 0;

  // Protection fee
  const protectionFee = getProtectionFee(baseRental);

  // Subtotal before platform fee
  const prePlatformSubtotal = rentalAfterDiscount + deliveryFee + oneWayFee + protectionFee;

  // Platform fee (5% of rental components only)
  const platformFee = getPlatformFee(rentalAfterDiscount);

  // Tax (18% GST on rental + protection + platform fee — NOT on deposit)
  const taxBase = rentalAfterDiscount + protectionFee + platformFee + deliveryFee + oneWayFee;
  const tax = Math.round(taxBase * 0.18);

  // Coupon discount (demo: VITO10 = 10%, VITO20 = 20%)
  let discount = 0;
  if (couponCode) {
    const code = couponCode.toUpperCase();
    if (code === 'VITO10') discount = Math.round(rentalAfterDiscount * 0.10);
    if (code === 'VITO20') discount = Math.round(rentalAfterDiscount * 0.20);
    if (code === 'VITOLAUNCH') discount = Math.round(rentalAfterDiscount * 0.15);
  }

  const totalPayable = prePlatformSubtotal + platformFee + tax - discount;
  const securityDeposit = depositAmount; // always stored/displayed separately

  return {
    durationHours,
    durationDays,
    durationLabel,
    baseRental,
    durationAdjustment,
    deliveryFee,
    oneWayFee,
    protectionFee,
    platformFee,
    tax,
    securityDeposit,
    discount,
    totalPayable,
    totalWithDeposit: totalPayable + securityDeposit,
  };
}
