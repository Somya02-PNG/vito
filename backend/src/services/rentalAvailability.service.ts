/**
 * RentalAvailabilityService
 *
 * Checks whether a vehicle is available for a given time window.
 * Uses the RentalBooking collection with an overlap query:
 *   requestedStart < existingEnd AND requestedEnd > existingStart
 *
 * This is the single source for availability checks used by:
 * - Search endpoint
 * - Booking creation
 * - Extension confirmation
 */

import RentalBooking from '../models/RentalBooking.model';
import { Types } from 'mongoose';

// Active statuses that block a vehicle's calendar
const BLOCKING_STATUSES = [
  'PAYMENT_PENDING',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'CUSTOMER_ARRIVING',
  'HANDOVER_PENDING',
  'HANDOVER_ACCEPTED',
  'ACTIVE',
  'EXTENSION_REQUESTED',
  'EXTENDED',
  'RETURN_PENDING',
  'RETURNED',
  'INSPECTION_PENDING',
  'INSPECTION_COMPLETED',
  'DAMAGE_REVIEW_PENDING',
  'FINAL_BILL_PENDING',
];

export interface AvailabilityResult {
  isAvailable: boolean;
  conflictingBookingId?: string;
  nextAvailableFrom?: Date;
}

/**
 * Check if a vehicle is available for the given window.
 * Pass excludeBookingId to ignore the current booking when checking extensions.
 */
export async function checkVehicleAvailability(
  vehicleId: string | Types.ObjectId,
  requestedStart: Date,
  requestedEnd: Date,
  excludeBookingId?: string
): Promise<AvailabilityResult> {
  const query: any = {
    vehicleId,
    status: { $in: BLOCKING_STATUSES },
    pickupDateTime: { $lt: requestedEnd },
    currentReturnDateTime: { $gt: requestedStart },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await RentalBooking.findOne(query).sort({ pickupDateTime: 1 }).lean();

  if (!conflict) {
    return { isAvailable: true };
  }

  return {
    isAvailable: false,
    conflictingBookingId: conflict._id?.toString(),
    nextAvailableFrom: conflict.currentReturnDateTime,
  };
}

/**
 * Filter a list of vehicleIds to only those available in the window.
 */
export async function filterAvailableVehicles(
  vehicleIds: (string | Types.ObjectId)[],
  requestedStart: Date,
  requestedEnd: Date
): Promise<string[]> {
  // Find all vehicles that have a conflicting booking
  const conflictingVehicleIds = await RentalBooking.distinct('vehicleId', {
    vehicleId: { $in: vehicleIds },
    status: { $in: BLOCKING_STATUSES },
    pickupDateTime: { $lt: requestedEnd },
    currentReturnDateTime: { $gt: requestedStart },
  });

  const conflictSet = new Set(conflictingVehicleIds.map((id: any) => id.toString()));

  return vehicleIds
    .map((id) => id.toString())
    .filter((id) => !conflictSet.has(id));
}
