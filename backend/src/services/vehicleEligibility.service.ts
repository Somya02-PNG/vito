import { Types } from 'mongoose';
import Vehicle, { IVehicle } from '../models/Vehicle.model';
import RentalPartner, { IRentalPartner } from '../models/RentalPartner.model';
import VehicleDocument, { IVehicleDocument, VehicleDocType } from '../models/VehicleDocument.model';
import RentalBooking from '../models/RentalBooking.model';

export interface EligibilityResult {
  isBookable: boolean;
  vehicle: IVehicle | null;
  partner: IRentalPartner | null;
  documents: IVehicleDocument[];
  expiredDocs: string[];
  missingDocs: string[];
  unverifiedDocs: string[];
  reasons: string[];
}

export class VehicleEligibilityService {
  /**
   * Centralized Single Source of Truth for vehicle bookability.
   * Both customer search/discovery and partner dashboard consult this service.
   */
  public static async isVehicleBookable(
    vehicleId: Types.ObjectId | string,
    requestedStart?: Date,
    requestedEnd?: Date
  ): Promise<EligibilityResult> {
    const vId = typeof vehicleId === 'string' ? new Types.ObjectId(vehicleId) : vehicleId;
    const reasons: string[] = [];
    const expiredDocs: string[] = [];
    const missingDocs: string[] = [];
    const unverifiedDocs: string[] = [];

    // 1. Fetch Vehicle
    const vehicle = await Vehicle.findById(vId);
    if (!vehicle) {
      return {
        isBookable: false,
        vehicle: null,
        partner: null,
        documents: [],
        expiredDocs: [],
        missingDocs: [],
        unverifiedDocs: [],
        reasons: ['Vehicle does not exist.'],
      };
    }

    // 2. Fetch Partner Profile
    let partner: IRentalPartner | null = null;
    if (vehicle.partnerId) {
      partner = await RentalPartner.findById(vehicle.partnerId);
    }
    if (!partner && vehicle.ownerId) {
      partner = await RentalPartner.findOne({ userId: vehicle.ownerId });
    }

    if (!partner) {
      reasons.push('No associated partner profile found for this vehicle.');
    } else if (partner.verificationStatus !== 'verified') {
      reasons.push(`Partner account is not verified (status: ${partner.verificationStatus}).`);
    }

    // 3. Check Vehicle Status
    if (vehicle.status !== 'VERIFIED') {
      reasons.push(`Vehicle is not verified (status: ${vehicle.status}).`);
    }

    if (
      vehicle.availabilityStatus === 'UNAVAILABLE' ||
      vehicle.availabilityStatus === 'UNDER_MAINTENANCE' ||
      vehicle.availabilityStatus === 'SUSPENDED'
    ) {
      reasons.push(`Vehicle is currently set to ${vehicle.availabilityStatus}.`);
    }

    // 4. Check Mandatory Documents & Expiration
    const now = new Date();
    const docs = await VehicleDocument.find({ vehicleId: vId });

    // Required documents based on vehicle & ownership type
    const mandatoryTypes: VehicleDocType[] = ['RC', 'INSURANCE', 'PUC', 'FITNESS'];
    if (vehicle.ownershipType && vehicle.ownershipType !== 'OWNED_BY_PARTNER') {
      mandatoryTypes.push('AUTHORIZATION_LETTER');
    }

    for (const reqType of mandatoryTypes) {
      const doc = docs.find((d) => d.documentType === reqType);
      if (!doc) {
        missingDocs.push(reqType);
        reasons.push(`Missing required document: ${reqType}.`);
      } else {
        // Expiration check
        const isExpired = doc.expiresAt && new Date(doc.expiresAt) <= now;
        const willExpireBeforeTrip =
          requestedEnd && doc.expiresAt && new Date(doc.expiresAt) < requestedEnd;

        if (doc.verificationStatus === 'EXPIRED' || isExpired) {
          if (doc.verificationStatus !== 'EXPIRED') {
            doc.verificationStatus = 'EXPIRED';
            await doc.save();
          }
          expiredDocs.push(reqType);
          reasons.push(`Document ${reqType} has expired (expired on ${new Date(doc.expiresAt!).toLocaleDateString('en-IN')}).`);
        } else if (willExpireBeforeTrip) {
          expiredDocs.push(reqType);
          reasons.push(`Document ${reqType} will expire before requested rental completion date.`);
        } else if (doc.verificationStatus !== 'VERIFIED') {
          unverifiedDocs.push(reqType);
          reasons.push(`Document ${reqType} is not verified (status: ${doc.verificationStatus}).`);
        }
      }
    }

    // If documents are expired or missing, auto-update vehicle availability status if needed
    if (expiredDocs.length > 0 && vehicle.availabilityStatus === 'AVAILABLE') {
      vehicle.availabilityStatus = 'VERIFICATION_REQUIRED';
      await vehicle.save();
    }

    // 5. Booking Conflict Protection (if dates provided)
    if (requestedStart && requestedEnd) {
      const conflictingBooking = await RentalBooking.findOne({
        vehicleId: vId,
        status: {
          $in: [
            'CONFIRMED',
            'READY_FOR_PICKUP',
            'HANDOVER_PENDING',
            'HANDOVER_ACCEPTED',
            'ACTIVE',
            'EXTENDED',
            'EXTENSION_REQUESTED',
            'RETURN_PENDING',
          ],
        },
        $and: [
          { pickupDateTime: { $lt: requestedEnd } },
          {
            $or: [
              { currentReturnDateTime: { $gt: requestedStart } },
              { returnDateTime: { $gt: requestedStart } },
            ],
          },
        ],
      });

      if (conflictingBooking) {
        reasons.push('Vehicle is already booked for the requested date and time slot.');
      }

      // Check custom availability blocks
      if (vehicle.customAvailabilityBlocks && vehicle.customAvailabilityBlocks.length > 0) {
        for (const block of vehicle.customAvailabilityBlocks) {
          if (block.status === 'UNAVAILABLE' || block.status === 'MAINTENANCE') {
            if (new Date(block.startDate) < requestedEnd && new Date(block.endDate) > requestedStart) {
              reasons.push(`Vehicle is marked ${block.status} by partner for selected dates (${block.reason || 'Not available'}).`);
              break;
            }
          }
        }
      }
    }

    const isBookable = reasons.length === 0;

    return {
      isBookable,
      vehicle,
      partner,
      documents: docs,
      expiredDocs,
      missingDocs,
      unverifiedDocs,
      reasons,
    };
  }

  /**
   * Filter a list of vehicles, returning ONLY those that are verified and bookable.
   */
  public static async filterBookableVehicles(
    vehicles: (IVehicle | any)[],
    requestedStart?: Date,
    requestedEnd?: Date
  ): Promise<any[]> {
    const bookableVehicles: IVehicle[] = [];
    for (const v of vehicles) {
      const eligibility = await VehicleEligibilityService.isVehicleBookable(
        v._id as Types.ObjectId,
        requestedStart,
        requestedEnd
      );
      if (eligibility.isBookable) {
        bookableVehicles.push(v);
      }
    }
    return bookableVehicles;
  }
}

export default VehicleEligibilityService;
