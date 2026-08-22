import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Vehicle from '../models/Vehicle.model';
import RentalBooking from '../models/RentalBooking.model';
import RentalHub from '../models/RentalHub.model';
import RentalDocument from '../models/RentalDocument.model';
import VehicleInspection from '../models/VehicleInspection.model';
import VehicleDamage from '../models/VehicleDamage.model';
import User from '../models/User.model';
import { AppError } from '../middleware/error.middleware';
import { calculateRentalPrice } from '../services/rentalPricing.service';
import { checkVehicleAvailability, filterAvailableVehicles } from '../services/rentalAvailability.service';
import { resolveLocationToHub, calculateHaversineDistanceKm } from '../services/rentalLocation.service';
import { autoSeedRentals } from '../services/rentalSeeder.service';
import { filterCompliantVehicles, checkVehicleDocumentCompliance, maskIdentifier } from '../services/rentalDocument.service';
import VehicleEligibilityService from '../services/vehicleEligibility.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateBookingId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'VR-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generateTicketId(): string {
  return 'TKT-' + Math.floor(100000 + Math.random() * 900000);
}

function addTimelineEvent(booking: any, event: string, description: string, actor: string = 'Customer') {
  if (!booking.timeline) booking.timeline = [];
  booking.timeline.push({
    event,
    timestamp: new Date(),
    description,
    actor,
  });
}

function getRecommendationScore(vehicle: any, pickupCoords: { lat: number; lng: number } | null): number {
  let score = 0;
  score += ((vehicle.rating || 4.5) / 5) * 40;
  score += Math.min((vehicle.totalRentals || 10) / 50, 1) * 20;
  score += Math.max(0, 1 - (vehicle.pricePerDay || 2000) / 10000) * 20;
  if (pickupCoords && vehicle.location) {
    const dist = Math.sqrt(
      Math.pow(vehicle.location.lat - pickupCoords.lat, 2) +
      Math.pow(vehicle.location.lng - pickupCoords.lng, 2)
    );
    score += Math.max(0, 1 - dist / 0.2) * 20;
  }
  return Math.round(score);
}

// ─── 1. SEARCH AVAILABLE VEHICLES (with Automatic Document Expiry Check) ─────
export const searchVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      pickupLocation, pickupLat, pickupLng,
      returnLocation, returnLat, returnLng,
      tripDestination,
      pickupDateTime, returnDateTime,
      pickupMethod = 'self_pickup',
      category, transmission, fuelType, seats, maxPrice, minRating,
      features,
      sort = 'recommended',
    } = req.query;

    if (!pickupDateTime || !returnDateTime) {
      return next(new AppError('pickupDateTime and returnDateTime are required.', 400));
    }

    const start = new Date(pickupDateTime as string);
    const end = new Date(returnDateTime as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format.', 400));
    }
    if (end <= start) {
      return next(new AppError('Return date must be after pickup date.', 400));
    }

    // 1. Resolve Location to Hub
    let pLat = pickupLat ? parseFloat(pickupLat as string) : undefined;
    let pLng = pickupLng ? parseFloat(pickupLng as string) : undefined;
    let resolvedPickup = await resolveLocationToHub({
      locationName: pickupLocation as string,
      lat: pLat,
      lng: pLng,
    });

    if (!resolvedPickup) {
      await autoSeedRentals();
      resolvedPickup = await resolveLocationToHub({
        locationName: pickupLocation as string,
        lat: pLat,
        lng: pLng,
      });
    }

    const pickupHub = resolvedPickup?.hub;
    const searchTier = resolvedPickup?.searchTier || 'fallback';
    const hubNotice = resolvedPickup?.hubNotice || '';
    const isNearbyAlternative = resolvedPickup?.isNearbyAlternative || false;

    // 2. Resolve Return Location (if one-way)
    let isOneWay = false;
    let returnHub: any = null;
    let oneWayAvailable = true;
    let oneWayMessage = '';

    if (returnLocation && returnLocation !== pickupLocation) {
      let rLat = returnLat ? parseFloat(returnLat as string) : undefined;
      let rLng = returnLng ? parseFloat(returnLng as string) : undefined;
      const resolvedReturn = await resolveLocationToHub({
        locationName: returnLocation as string,
        lat: rLat,
        lng: rLng,
      });
      returnHub = resolvedReturn?.hub;

      if (pickupHub && returnHub && pickupHub._id.toString() !== returnHub._id.toString()) {
        isOneWay = true;
        const isPairingSupported =
          pickupHub.oneWayReturnSupported &&
          (pickupHub.supportedOneWayReturnHubCodes?.length === 0 ||
            pickupHub.supportedOneWayReturnHubCodes?.includes(returnHub.code));

        if (!isPairingSupported) {
          oneWayAvailable = false;
          oneWayMessage = `One-way return from ${pickupHub.name} to ${returnHub.name} is currently not supported.`;
        }
      }
    }

    // 3. Build Vehicle Filter
    const vehicleFilter: any = { status: 'VERIFIED' };
    if (pickupHub) {
      vehicleFilter.$or = [
        { hubId: pickupHub._id },
        { hubCode: pickupHub.code },
        { city: new RegExp('^' + pickupHub.city + '$', 'i') },
      ];
    }

    if (isOneWay) vehicleFilter.oneWayRentalSupported = true;
    if (category) vehicleFilter.category = category;
    if (transmission) vehicleFilter.transmission = transmission;
    if (fuelType) vehicleFilter.fuelType = fuelType;
    if (seats) vehicleFilter.seats = { $gte: parseInt(seats as string) };
    if (maxPrice) vehicleFilter.pricePerDay = { $lte: parseInt(maxPrice as string) };
    if (minRating) vehicleFilter.rating = { $gte: parseFloat(minRating as string) };
    if (pickupMethod === 'doorstep_delivery') vehicleFilter.deliveryAvailable = true;
    if (features) {
      const featureList = (features as string).split(',');
      vehicleFilter.features = { $all: featureList };
    }

    let allVehicles = await Vehicle.find(vehicleFilter).lean();

    if (allVehicles.length === 0 && searchTier === 'fallback') {
      delete vehicleFilter.$or;
      allVehicles = await Vehicle.find(vehicleFilter).lean();
    }

    // 4. Availability & Document Compliance Check via Centralized VehicleEligibilityService
    const allIds = allVehicles.map((v: any) => v._id);
    const availableIds = await filterAvailableVehicles(allIds, start, end);
    const availableVehicles = allVehicles.filter((v: any) => availableIds.includes(v._id.toString()));

    // 5. AUTOMATIC EXPIRY & ELIGIBILITY RULE — Filter Out Vehicles with Expired Insurance/RC/PUC or Unverified Partner
    const compliantVehicles = await VehicleEligibilityService.filterBookableVehicles(availableVehicles, start, end);
    let results = compliantVehicles.length > 0 ? compliantVehicles : allVehicles.filter((v: any) => v.isDemo && availableIds.includes(v._id.toString()));

    // 6. Pricing Calculation
    const pickupCoords = pLat && pLng ? { lat: pLat, lng: pLng } : pickupHub?.location || null;

    const resultsWithPricing = results.map((vehicle: any) => {
      const pricing = calculateRentalPrice({
        pricePerDay: vehicle.pricePerDay,
        depositAmount: vehicle.depositAmount || 3000,
        pickupDateTime: start,
        returnDateTime: end,
        city: pickupHub?.city || vehicle.city || 'Delhi NCR',
        pickupMethod: (pickupMethod as 'self_pickup' | 'doorstep_delivery') || 'self_pickup',
        isOneWay,
      });

      const recommendationScore = getRecommendationScore(vehicle, pickupCoords);

      return {
        ...vehicle,
        hubName: pickupHub?.name || vehicle.hubName,
        hubCode: pickupHub?.code || vehicle.hubCode,
        pricing,
        recommendationScore,
      };
    });

    // 7. Sort
    if (sort === 'price_asc') {
      resultsWithPricing.sort((a: any, b: any) => a.pricing.totalPayable - b.pricing.totalPayable);
    } else if (sort === 'rating') {
      resultsWithPricing.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'nearest') {
      resultsWithPricing.sort((a: any, b: any) => {
        if (!pickupCoords) return 0;
        const distA = Math.sqrt(Math.pow(a.location.lat - pickupCoords.lat, 2) + Math.pow(a.location.lng - pickupCoords.lng, 2));
        const distB = Math.sqrt(Math.pow(b.location.lat - pickupCoords.lat, 2) + Math.pow(b.location.lng - pickupCoords.lng, 2));
        return distA - distB;
      });
    } else {
      resultsWithPricing.sort((a: any, b: any) => b.recommendationScore - a.recommendationScore);
    }

    // 8. Optional Trip Destination Road Trip Estimate
    let tripEstimate: any = null;
    if (tripDestination && typeof tripDestination === 'string' && tripDestination.trim()) {
      const destNorm = tripDestination.trim();
      let estDistanceKm = 280;
      if (destNorm.toLowerCase().includes('jaipur')) estDistanceKm = 280;
      else if (destNorm.toLowerCase().includes('agra')) estDistanceKm = 230;
      else if (destNorm.toLowerCase().includes('lucknow')) estDistanceKm = 85;
      else if (destNorm.toLowerCase().includes('manali')) estDistanceKm = 540;
      else if (destNorm.toLowerCase().includes('goa')) estDistanceKm = 590;

      const estLiters = Math.round(estDistanceKm / 14);
      const estFuelCost = Math.round(estLiters * 98);
      tripEstimate = {
        destination: destNorm,
        estimatedDistanceKm: estDistanceKm,
        estimatedFuelCost: estFuelCost,
        estimatedToll: Math.round(estDistanceKm * 1.5),
        recommendedCarCategory: estDistanceKm > 200 ? 'SUV / Sedan' : 'Hatchback / EV',
      };
    }

    res.status(200).json({
      success: true,
      data: {
        vehicles: resultsWithPricing,
        count: resultsWithPricing.length,
        hub: pickupHub
          ? {
              _id: pickupHub._id,
              name: pickupHub.name,
              code: pickupHub.code,
              city: pickupHub.city,
              state: pickupHub.state,
              address: pickupHub.address,
              location: pickupHub.location,
              serviceRadiusKm: pickupHub.serviceRadiusKm,
            }
          : null,
        searchTier,
        hubNotice,
        isNearbyAlternative,
        isOneWay,
        oneWayAvailable,
        oneWayMessage,
        tripEstimate,
        searchParams: {
          pickupLocation,
          returnLocation: isOneWay ? returnLocation : pickupLocation,
          tripDestination: tripDestination || null,
          pickupDateTime,
          returnDateTime,
          durationLabel: resultsWithPricing[0]?.pricing?.durationLabel || '',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 2. CUSTOMER DOCUMENT UPLOAD & DEMO VERIFICATION ─────────────────────────
export const uploadCustomerDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const { documentType, rawIdentifier } = req.body;

    if (!documentType) {
      return next(new AppError('documentType is required.', 400));
    }

    const maskedIdentifier = maskIdentifier(documentType, rawIdentifier);

    let docName = 'Identity Document';
    if (documentType.includes('DRIVING_LICENSE')) docName = 'Driving Licence';
    else if (documentType === 'CUSTOMER_ID') docName = 'Aadhaar / Passport ID';

    const document = await RentalDocument.findOneAndUpdate(
      { ownerType: 'CUSTOMER', ownerId: userId, documentType },
      {
        $set: {
          ownerType: 'CUSTOMER',
          ownerId: userId,
          documentType,
          documentName: docName,
          fileId: `usr_doc_${userId}_${documentType}`,
          fileUrl: `/private/documents/customers/${userId}/${documentType}.enc`,
          status: 'VERIFIED',
          issuedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
          verifiedAt: new Date(),
          verifiedBy: 'VITO Digital ID AI (Simulated)',
          verificationMethod: 'DEMO_AI',
          maskedIdentifier,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );

    // Update user record
    if (documentType.includes('DRIVING_LICENSE')) {
      await User.findByIdAndUpdate(userId, { licenceVerified: true });
    }
    if (documentType === 'CUSTOMER_ID') {
      await User.findByIdAndUpdate(userId, { identityVerified: true });
    }

    res.status(200).json({
      success: true,
      message: `${docName} uploaded and verified successfully.`,
      data: {
        document: {
          _id: document._id,
          documentType: document.documentType,
          documentName: document.documentName,
          status: document.status,
          maskedIdentifier: document.maskedIdentifier,
          verifiedAt: document.verifiedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 3. GET CUSTOMER DOCUMENTS ───────────────────────────────────────────────
export const getMyDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const documents = await RentalDocument.find({ ownerType: 'CUSTOMER', ownerId: userId })
      .select('documentType documentName status maskedIdentifier verifiedAt expiresAt isDemo')
      .lean();

    res.status(200).json({ success: true, data: { documents } });
  } catch (error) {
    next(error);
  }
};

// ─── 4. GET VEHICLE DOCUMENTS (Compliance check) ─────────────────────────────
export const getVehicleDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId } = req.params;
    const compliance = await checkVehicleDocumentCompliance(vehicleId);

    res.status(200).json({
      success: true,
      data: {
        rentalStatus: compliance.rentalStatus,
        compliant: compliance.compliant,
        expiredDocs: compliance.expiredDocs,
        missingDocs: compliance.missingDocs,
        documents: compliance.documents.map((d: any) => ({
          _id: d._id,
          documentType: d.documentType,
          documentName: d.documentName,
          status: d.status,
          maskedIdentifier: d.maskedIdentifier,
          expiresAt: d.expiresAt,
          verifiedBy: d.verifiedBy,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 5. CREATE BOOKING ───────────────────────────────────────────────────────
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const {
      vehicleId,
      pickupLocation, pickupLat, pickupLng,
      returnLocation, returnLat, returnLng,
      tripDestination,
      pickupDateTime, returnDateTime,
      pickupMethod, deliveryAddress,
      isOneWay,
      couponCode,
      agreementAccepted,
    } = req.body;

    if (!vehicleId || !pickupDateTime || !returnDateTime) {
      return next(new AppError('vehicleId, pickupDateTime, and returnDateTime are required.', 400));
    }
    if (!agreementAccepted) {
      return next(new AppError('You must accept the rental agreement to proceed.', 400));
    }

    const start = new Date(pickupDateTime);
    const end = new Date(returnDateTime);
    if (end <= start) return next(new AppError('Return date must be after pickup date.', 400));

    // Centralized Vehicle Eligibility Service check
    const eligibility = await VehicleEligibilityService.isVehicleBookable(vehicleId, start, end);
    if (!eligibility.isBookable) {
      return next(new AppError(`Vehicle is not eligible for booking: ${eligibility.reasons.join('; ')}`, 403));
    }
    const vehicle = eligibility.vehicle!;

    // Availability Check
    const availability = await checkVehicleAvailability(vehicleId, start, end);
    if (!availability.isAvailable) {
      return next(new AppError('This vehicle is already booked for the selected dates.', 409));
    }

    const pLat = parseFloat(pickupLat) || 0;
    const pLng = parseFloat(pickupLng) || 0;
    const resolvedPickup = await resolveLocationToHub({
      locationName: pickupLocation,
      lat: pLat || undefined,
      lng: pLng || undefined,
    });

    const pricing = calculateRentalPrice({
      pricePerDay: vehicle.pricePerDay,
      depositAmount: vehicle.depositAmount || 3000,
      pickupDateTime: start,
      returnDateTime: end,
      city: vehicle.city || 'Delhi NCR',
      pickupMethod: pickupMethod || 'self_pickup',
      isOneWay: isOneWay || false,
      couponCode,
    });

    const user = await User.findById(userId).lean();
    const licenceVerifiedAtBooking = (user as any)?.licenceVerified || false;
    const identityVerifiedAtBooking = (user as any)?.identityVerified || false;

    const booking = new RentalBooking({
      userId,
      vehicleId,
      pickupLocation: pickupLocation || '',
      pickupCoords: { lat: pLat, lng: pLng },
      pickupHubId: resolvedPickup?.hub?._id || vehicle.hubId,
      returnLocation: returnLocation || pickupLocation || '',
      returnCoords: { lat: parseFloat(returnLat) || pLat, lng: parseFloat(returnLng) || pLng },
      tripDestination: tripDestination || '',
      isOneWay: isOneWay || false,
      searchTier: resolvedPickup?.searchTier || 'exact',
      isDemo: true,
      pickupMethod: pickupMethod || 'self_pickup',
      deliveryAddress: deliveryAddress || '',
      pickupDateTime: start,
      returnDateTime: end,
      currentReturnDateTime: end,
      pricing,
      status: 'PAYMENT_PENDING',
      licenceVerifiedAtBooking,
      identityVerifiedAtBooking,
      agreementAcceptedAt: new Date(),
    });

    addTimelineEvent(booking, 'Booking Created', 'Draft reservation created with itemized pricing', 'Customer');
    await booking.save();

    const populated = await RentalBooking.findById(booking._id)
      .populate('vehicleId', 'name make vehicleModel year category images pricePerDay depositAmount city hostName hostRating hubName')
      .lean();

    res.status(201).json({ success: true, data: { booking: populated } });
  } catch (error) {
    next(error);
  }
};

// ─── 6. PROCESS PAYMENT (mock) ───────────────────────────────────────────────
export const processPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));
    if (booking.status !== 'PAYMENT_PENDING') {
      return next(new AppError('Booking is not in PAYMENT_PENDING state.', 400));
    }

    const bookingId = generateBookingId();
    booking.bookingId = bookingId;
    booking.status = 'CONFIRMED';

    addTimelineEvent(
      booking,
      'Payment Confirmed',
      `Payment of ₹${booking.pricing.totalWithDeposit} processed (Rental: ₹${booking.pricing.totalPayable} + Refundable Deposit: ₹${booking.pricing.securityDeposit})`,
      'Payment Gateway'
    );

    await booking.save();

    const populated = await RentalBooking.findById(booking._id)
      .populate('vehicleId', 'name make vehicleModel year category images pricePerDay depositAmount city hostName hostRating location deliveryAvailable hubName')
      .lean();

    res.status(200).json({
      success: true,
      message: `Booking confirmed! Booking ID: ${bookingId}`,
      data: { booking: populated },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 7. PRE-HANDOVER VEHICLE INSPECTION ───────────────────────────────────────
export const submitPreHandoverInspection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;
    const { checklist, odometerKm, fuelLevelPercent, cleanliness, photos = [], damages = [] } = req.body;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));

    // Save existing damages
    const damageIds: any[] = [];
    for (const d of damages) {
      const damageDoc = await VehicleDamage.create({
        bookingId: booking._id,
        vehicleId: booking.vehicleId,
        location: d.location || 'General',
        damageType: d.damageType || 'SCRATCH',
        severity: d.severity || 'MINOR',
        description: d.description || '',
        photoUrl: d.photoUrl || '',
        status: 'EXISTING',
        detectedStage: 'PRE_HANDOVER',
        isPreExisting: true,
      });
      damageIds.push(damageDoc._id);
    }

    // Create Pre-Handover Inspection Document
    const inspection = await VehicleInspection.create({
      bookingId: booking._id,
      vehicleId: booking.vehicleId,
      type: 'PRE_HANDOVER',
      performedBy: userId,
      performedByName: req.user!.name || 'Fleet Operator',
      odometerKm: odometerKm || 12500,
      fuelLevelPercent: fuelLevelPercent || 100,
      cleanliness: cleanliness || 'Clean',
      checklist: checklist || {},
      photos: photos || [],
      damageIds,
      status: 'SUBMITTED',
    });

    booking.preInspectionId = inspection._id;
    booking.preRentalInspection = {
      completedAt: new Date(),
      odometerKm: odometerKm || 12500,
      fuelLevelPercent: fuelLevelPercent || 100,
      exteriorFront: { condition: 'good', notes: '' },
      exteriorRear: { condition: 'good', notes: '' },
      exteriorLeft: { condition: 'good', notes: '' },
      exteriorRight: { condition: 'good', notes: '' },
      exteriorRoof: { condition: 'good', notes: '' },
      exteriorWheels: { condition: 'good', notes: '' },
      interiorDashboard: { condition: 'good', notes: '' },
      interiorSeats: { condition: 'good', notes: '' },
      interiorAC: { condition: 'good', notes: '' },
      interiorInfotainment: { condition: 'good', notes: '' },
      existingDamageNotes: damages.map((d: any) => `${d.location}: ${d.description}`).join('; '),
      newDamageDetected: false,
    };

    booking.status = 'HANDOVER_PENDING';
    addTimelineEvent(booking, 'Pre-Handover Inspection', `10-point inspection completed. Odometer: ${odometerKm} km, Fuel: ${fuelLevelPercent}%, Pre-existing damages: ${damageIds.length}`, 'Fleet Inspector');
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Pre-handover inspection recorded. Awaiting customer digital acknowledgement.',
      data: { inspectionId: inspection._id, status: booking.status },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 8. CUSTOMER DIGITAL ACKNOWLEDGEMENT (before rental becomes ACTIVE) ───────
export const customerAcknowledgeHandover = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;
    const { reviewedCondition, acknowledgedDamage, agreedTerms } = req.body;

    if (!reviewedCondition || !acknowledgedDamage || !agreedTerms) {
      return next(new AppError('All 3 acknowledgement checkboxes must be confirmed.', 400));
    }

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));

    const ackTime = new Date();
    booking.customerAcknowledgement = {
      reviewedCondition: true,
      acknowledgedDamage: true,
      agreedTerms: true,
      acceptedAt: ackTime,
    };
    booking.handoverAcceptedAt = ackTime;
    booking.status = 'ACTIVE';

    if (booking.preInspectionId) {
      await VehicleInspection.findByIdAndUpdate(booking.preInspectionId, {
        customerAcknowledged: true,
        customerAcknowledgedAt: ackTime,
        status: 'ACKNOWLEDGED',
      });
    }

    addTimelineEvent(booking, 'Handover Accepted & Rental Active', 'Customer digitally acknowledged vehicle condition and accepted keys', 'Customer');
    await booking.save();

    const populated = await RentalBooking.findById(booking._id)
      .populate('vehicleId', 'name make vehicleModel year category images pricePerDay depositAmount city hostName hostRating location hubName')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Digital acknowledgement recorded. Rental is now ACTIVE.',
      data: { booking: populated },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 9. GET DIGITAL HANDOVER REPORT ──────────────────────────────────────────
export const getHandoverReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId })
      .populate('vehicleId', 'name make vehicleModel year category registrationNumber hostName')
      .lean();
    if (!booking) return next(new AppError('Booking not found.', 404));

    const inspection = await VehicleInspection.findOne({ bookingId: booking._id, type: 'PRE_HANDOVER' }).lean();
    const existingDamages = await VehicleDamage.find({ bookingId: booking._id, isPreExisting: true }).lean();

    res.status(200).json({
      success: true,
      data: {
        report: {
          bookingId: booking.bookingId,
          vehicle: booking.vehicleId,
          pickupLocation: booking.pickupLocation,
          pickupDateTime: booking.pickupDateTime,
          odometerKm: inspection?.odometerKm || booking.preRentalInspection?.odometerKm || 0,
          fuelLevelPercent: inspection?.fuelLevelPercent || booking.preRentalInspection?.fuelLevelPercent || 100,
          cleanliness: inspection?.cleanliness || 'Clean',
          checklist: inspection?.checklist || {},
          photosCount: inspection?.photos?.length || 0,
          existingDamages: existingDamages.map((d: any) => ({
            location: d.location,
            damageType: d.damageType,
            severity: d.severity,
            description: d.description,
          })),
          customerAcknowledged: booking.customerAcknowledgement?.acceptedAt ? true : false,
          acknowledgedAt: booking.customerAcknowledgement?.acceptedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 10. POST-RETURN INSPECTION & DIFFERENCE FLAGGING ────────────────────────
export const submitReturnInspection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;
    const { checklist, odometerKm, fuelLevelPercent, cleanliness, photos = [], newDamages = [] } = req.body;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));

    const preInspection = await VehicleInspection.findOne({ bookingId: booking._id, type: 'PRE_HANDOVER' }).lean();

    // Create Reported Damages (marked UNDER_REVIEW — SAFETY RULE: never auto-charged)
    const newDamageDocs: any[] = [];
    for (const d of newDamages) {
      const damageDoc = await VehicleDamage.create({
        bookingId: booking._id,
        vehicleId: booking.vehicleId,
        location: d.location || 'General',
        damageType: d.damageType || 'SCRATCH',
        severity: d.severity || 'MINOR',
        description: d.description || '',
        estimatedCost: d.estimatedCost || 0,
        confirmedCost: 0, // 0 until confirmed by operator
        status: 'UNDER_REVIEW',
        detectedStage: 'RETURN',
        isPreExisting: false,
      });
      newDamageDocs.push(damageDoc);
    }

    const postInspection = await VehicleInspection.create({
      bookingId: booking._id,
      vehicleId: booking.vehicleId,
      type: 'RETURN',
      performedBy: userId,
      performedByName: req.user!.name || 'Fleet Operator',
      odometerKm: odometerKm || 12800,
      fuelLevelPercent: fuelLevelPercent || 95,
      cleanliness: cleanliness || 'Clean',
      checklist: checklist || {},
      photos: photos || [],
      damageIds: newDamageDocs.map((d) => d._id),
      status: 'SUBMITTED',
    });

    booking.postInspectionId = postInspection._id;

    // Fuel reconciliation
    const preFuel = preInspection?.fuelLevelPercent || 100;
    let fuelAdjustmentCharge = 0;
    if (fuelLevelPercent < preFuel) {
      fuelAdjustmentCharge = Math.round((preFuel - fuelLevelPercent) * 20);
    }

    // Late fee
    let lateFeeCharge = 0;
    const now = new Date();
    if (now > booking.currentReturnDateTime) {
      const lateHours = Math.ceil((now.getTime() - booking.currentReturnDateTime.getTime()) / (1000 * 60 * 60));
      lateFeeCharge = lateHours * 150;
    }

    booking.fuelAdjustmentCharge = fuelAdjustmentCharge;
    booking.lateFeeCharge = lateFeeCharge;

    // Status: if new damages exist -> DAMAGE_REVIEW_PENDING (requires operator confirmation); else FINAL_BILL_PENDING
    booking.status = newDamageDocs.length > 0 ? 'DAMAGE_REVIEW_PENDING' : 'FINAL_BILL_PENDING';

    addTimelineEvent(
      booking,
      'Return Inspection Completed',
      `Vehicle returned at ${odometerKm} km. Fuel: ${fuelLevelPercent}%. Flagged new damages: ${newDamageDocs.length} (pending review)`,
      'Fleet Inspector'
    );

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Post-return inspection completed.',
      data: {
        inspectionId: postInspection._id,
        fuelAdjustmentCharge,
        lateFeeCharge,
        flaggedDamagesCount: newDamageDocs.length,
        status: booking.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 11. OPERATOR DAMAGE REVIEW (Enforces Safety Rule: human review required) ─
export const reviewDamage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { damageId } = req.params;
    const { action, confirmedCost = 0, reviewNotes = '' } = req.body; // action: 'CONFIRM' | 'REJECT'

    const damage = await VehicleDamage.findById(damageId);
    if (!damage) return next(new AppError('Damage record not found.', 404));

    damage.status = action === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED';
    damage.confirmedCost = action === 'CONFIRM' ? confirmedCost : 0;
    damage.reviewedBy = req.user!._id;
    damage.reviewedAt = new Date();
    damage.reviewNotes = reviewNotes;
    await damage.save();

    // Recalculate confirmed damage charge on booking
    const booking = await RentalBooking.findById(damage.bookingId);
    if (booking) {
      const allConfirmed = await VehicleDamage.find({ bookingId: booking._id, status: 'CONFIRMED' });
      const totalConfirmedDamage = allConfirmed.reduce((sum, d) => sum + (d.confirmedCost || 0), 0);
      booking.confirmedDamageCharge = totalConfirmedDamage;
      booking.damageCharge = totalConfirmedDamage;

      // Check if all reported damages are reviewed
      const pendingReviews = await VehicleDamage.countDocuments({ bookingId: booking._id, status: 'UNDER_REVIEW' });
      if (pendingReviews === 0 && booking.status === 'DAMAGE_REVIEW_PENDING') {
        booking.status = 'FINAL_BILL_PENDING';
      }

      addTimelineEvent(
        booking,
        `Damage ${action === 'CONFIRM' ? 'Confirmed' : 'Rejected'}`,
        `${damage.location}: ${damage.damageType} ${action === 'CONFIRM' ? 'confirmed at ₹' + confirmedCost : 'rejected'}. Notes: ${reviewNotes}`,
        'Fleet Reviewer'
      );

      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: `Damage record ${action === 'CONFIRM' ? 'confirmed' : 'rejected'}.`,
      data: { damage },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 12. FINAL BILL SETTLEMENT (Deposit always separate) ──────────────────────
export const settleFinalBill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));

    const extensionTotal = (booking.extensionHistory || []).reduce(
      (sum: number, ext: any) => sum + (ext.priceDelta || 0), 0
    );

    // ONLY confirmed damage charges are included
    const damageCharge = booking.confirmedDamageCharge || 0;
    const totalDeductions = damageCharge;
    const depositRefundAmount = Math.max(0, booking.pricing.securityDeposit - totalDeductions);
    const depositRefundStatus = totalDeductions > 0 ? 'PARTIALLY_REFUNDED' : 'REFUNDED';

    const subtotal =
      booking.pricing.totalPayable +
      extensionTotal +
      (booking.lateFeeCharge || 0) +
      (booking.fuelAdjustmentCharge || 0) +
      damageCharge;

    const finalBill = {
      baseRental: booking.pricing.baseRental,
      durationAdjustment: booking.pricing.durationAdjustment,
      extensionCharges: extensionTotal,
      deliveryFee: booking.pricing.deliveryFee,
      protectionFee: booking.pricing.protectionFee,
      platformFee: booking.pricing.platformFee,
      tax: booking.pricing.tax,
      lateFeeCharge: booking.lateFeeCharge || 0,
      fuelAdjustmentCharge: booking.fuelAdjustmentCharge || 0,
      damageCharge,
      discount: booking.pricing.discount,
      subtotal,
      securityDeposit: booking.pricing.securityDeposit,
      depositRefundAmount,
      depositRefundStatus,
    };

    booking.depositRefundStatus = depositRefundStatus as any;
    booking.depositRefundAmount = depositRefundAmount;
    booking.status = 'FINAL_BILL_PENDING';

    addTimelineEvent(booking, 'Final Bill Generated', `Itemized final bill: ₹${subtotal}, Refundable deposit: ₹${depositRefundAmount}`, 'Billing Engine');
    await booking.save();

    res.status(200).json({
      success: true,
      data: { finalBill, bookingId: booking.bookingId },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 13. SUBMIT FINAL PAYMENT ────────────────────────────────────────────────
export const submitFinalPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));

    booking.status = 'PAYMENT_COMPLETED';
    addTimelineEvent(booking, 'Final Settlement Paid', 'All final charges settled. Deposit refund initiated to original payment method.', 'Payment Gateway');
    await booking.save();

    res.status(200).json({ success: true, message: 'Final payment settled. Please rate your experience.', data: { status: booking.status } });
  } catch (error) {
    next(error);
  }
};

// ─── 14. SUBMIT RATING ───────────────────────────────────────────────────────
export const submitRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const { vehicleCondition, vehicleQuality, pickupExperience, returnExperience, hostService, overall, comment } = req.body;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));

    booking.rating = {
      vehicleCondition: vehicleCondition || 5,
      vehicleQuality: vehicleQuality || 5,
      pickupExperience: pickupExperience || 5,
      returnExperience: returnExperience || 5,
      hostService: hostService || 5,
      overall: overall || 5,
      comment: comment || '',
      submittedAt: new Date(),
    };
    booking.status = 'RATED';
    addTimelineEvent(booking, 'Customer Rating Submitted', `Overall rating: ${overall || 5} stars`, 'Customer');
    await booking.save();

    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (vehicle) {
      const currentTotal = (vehicle.rating || 4.5) * (vehicle.totalRatings || 1);
      vehicle.totalRatings = (vehicle.totalRatings || 0) + 1;
      vehicle.totalRentals = (vehicle.totalRentals || 0) + 1;
      vehicle.rating = Math.round(((currentTotal + (overall || 5)) / vehicle.totalRatings) * 100) / 100;
      await vehicle.save();
    }

    res.status(200).json({ success: true, message: 'Rating submitted. Thank you!', data: { rating: booking.rating } });
  } catch (error) {
    next(error);
  }
};

// ─── 15. RENTAL DETAILS PAGE DATA (13 structured sections) ───────────────────
export const getRentalBookingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId })
      .populate('vehicleId', 'name make vehicleModel year category registrationNumber images pricePerDay depositAmount city hostName hostRating hostCompletedRentals hubName')
      .lean();

    if (!booking) return next(new AppError('Booking not found.', 404));

    const vehicleId = (booking.vehicleId as any)?._id;

    // Fetch inspection records
    const preInspection = await VehicleInspection.findOne({ bookingId: booking._id, type: 'PRE_HANDOVER' }).lean();
    const postInspection = await VehicleInspection.findOne({ bookingId: booking._id, type: 'RETURN' }).lean();

    // Fetch damages
    const allDamages = await VehicleDamage.find({ bookingId: booking._id }).lean();

    // Fetch Customer & Vehicle Documents
    const customerDocs = await RentalDocument.find({ ownerType: 'CUSTOMER', ownerId: userId })
      .select('documentType documentName status maskedIdentifier verifiedAt expiresAt')
      .lean();

    const vehicleDocs = vehicleId
      ? await RentalDocument.find({ ownerType: 'VEHICLE', ownerId: vehicleId })
          .select('documentType documentName status maskedIdentifier verifiedAt expiresAt')
          .lean()
      : [];

    const rentalDocs = [
      { documentType: 'RENTAL_AGREEMENT', documentName: 'Digital Rental Agreement', status: booking.agreementAcceptedAt ? 'VERIFIED' : 'PENDING', verifiedAt: booking.agreementAcceptedAt },
      { documentType: 'PAYMENT_RECEIPT', documentName: 'Booking Payment Receipt', status: booking.status !== 'PAYMENT_PENDING' ? 'VERIFIED' : 'PENDING', verifiedAt: booking.createdAt },
      { documentType: 'HANDOVER_REPORT', documentName: 'Digital Handover Report', status: preInspection ? 'VERIFIED' : 'PENDING', verifiedAt: preInspection?.performedAt },
      { documentType: 'RETURN_REPORT', documentName: 'Post-Return Inspection Report', status: postInspection ? 'VERIFIED' : 'PENDING', verifiedAt: postInspection?.performedAt },
      { documentType: 'FINAL_INVOICE', documentName: 'Final Tax Invoice', status: ['PAYMENT_COMPLETED', 'COMPLETED', 'RATED'].includes(booking.status) ? 'VERIFIED' : 'PENDING' },
    ];

    res.status(200).json({
      success: true,
      data: {
        bookingOverview: {
          bookingId: booking.bookingId,
          status: booking.status,
          createdAt: booking.createdAt,
        },
        vehicle: booking.vehicleId,
        pickupAndReturn: {
          pickupLocation: booking.pickupLocation,
          pickupDateTime: booking.pickupDateTime,
          returnLocation: booking.returnLocation,
          returnDateTime: booking.returnDateTime,
          currentReturnDateTime: booking.currentReturnDateTime,
          isOneWay: booking.isOneWay,
          pickupMethod: booking.pickupMethod,
          deliveryAddress: booking.deliveryAddress,
        },
        payment: {
          pricing: booking.pricing,
          status: booking.status !== 'PAYMENT_PENDING' ? 'PAID' : 'PENDING',
        },
        customerVerification: {
          licenceVerified: booking.licenceVerifiedAtBooking,
          identityVerified: booking.identityVerifiedAtBooking,
          agreementAcceptedAt: booking.agreementAcceptedAt,
        },
        documents: {
          customerDocuments: customerDocs,
          vehicleDocuments: vehicleDocs,
          rentalDocuments: rentalDocs,
        },
        vehicleCondition: {
          preRental: preInspection,
          postRental: postInspection,
          damages: allDamages,
        },
        handover: {
          acceptedAt: booking.handoverAcceptedAt,
          acknowledgement: booking.customerAcknowledgement,
        },
        activeRental: {
          isActive: ['ACTIVE', 'EXTENDED'].includes(booking.status),
          currentReturnDateTime: booking.currentReturnDateTime,
          extensionHistory: booking.extensionHistory,
        },
        finalSettlement: {
          lateFeeCharge: booking.lateFeeCharge,
          fuelAdjustmentCharge: booking.fuelAdjustmentCharge,
          damageCharge: booking.damageCharge,
          confirmedDamageCharge: booking.confirmedDamageCharge,
          depositRefundStatus: booking.depositRefundStatus,
          depositRefundAmount: booking.depositRefundAmount,
        },
        timeline: booking.timeline || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 16. ADMIN COMPLIANCE CENTER ─────────────────────────────────────────────
export const getAdminComplianceCenter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { statusFilter } = req.query; // 'ALL', 'ELIGIBLE', 'NOT_ELIGIBLE', 'EXPIRING_SOON'

    const vehicles = await Vehicle.find({ isDemo: true })
      .populate('hubId', 'name city')
      .lean();

    const complianceCards: any[] = [];

    for (const v of vehicles) {
      const comp = await checkVehicleDocumentCompliance(v._id);
      let matchesFilter = true;

      if (statusFilter === 'ELIGIBLE') matchesFilter = comp.compliant;
      else if (statusFilter === 'NOT_ELIGIBLE') matchesFilter = !comp.compliant;

      if (matchesFilter) {
        complianceCards.push({
          vehicleId: v._id,
          name: v.name,
          registrationNumber: v.registrationNumber || 'MH-XX-XXXX',
          city: v.city,
          hubName: (v as any).hubId?.name || v.hubName,
          rentalStatus: comp.rentalStatus,
          compliant: comp.compliant,
          expiredDocs: comp.expiredDocs,
          missingDocs: comp.missingDocs,
          documents: comp.documents.map((d: any) => ({
            documentType: d.documentType,
            documentName: d.documentName,
            status: d.status,
            maskedIdentifier: d.maskedIdentifier,
            expiresAt: d.expiresAt,
          })),
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        vehicles: complianceCards,
        totalCount: complianceCards.length,
        eligibleCount: complianceCards.filter((c) => c.compliant).length,
        ineligibleCount: complianceCards.filter((c) => !c.compliant).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 16b. ADMIN UPDATE DOCUMENT STATUS (for compliance testing/management) ────
export const updateDocumentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId, vehicleId, documentType, status, expiresAt } = req.body;
    let query: any = {};
    if (documentId) query._id = documentId;
    else if (vehicleId && documentType) {
      const vObjId = typeof vehicleId === 'string' ? new Types.ObjectId(vehicleId) : vehicleId;
      query = { ownerType: 'VEHICLE', ownerId: vObjId, documentType };
    }
    else return next(new AppError('documentId or vehicleId + documentType is required.', 400));

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (expiresAt) updateFields.expiresAt = new Date(expiresAt);

    const doc = await RentalDocument.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    res.status(200).json({ success: true, data: { document: doc } });
  } catch (error) {
    next(error);
  }
};

// ─── 16c. GET PENDING DAMAGES ────────────────────────────────────────────────
export const getPendingDamages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.query;
    const query: any = { status: 'UNDER_REVIEW' };
    if (bookingId) query.bookingId = bookingId;

    const damages = await VehicleDamage.find(query).lean();
    res.status(200).json({ success: true, data: { damages, count: damages.length } });
  } catch (error) {
    next(error);
  }
};

// ─── 17. AI ASSISTANT STATUS CHECK (Privacy-Safe, Never exposes doc contents) ─
export const getAIStatusCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const { queryType, vehicleId } = req.body;

    const user = await User.findById(userId).lean();

    let responseText = '';

    if (queryType === 'LICENCE_STATUS') {
      const isVerified = (user as any)?.licenceVerified || false;
      responseText = isVerified
        ? 'Your driving licence is verified (✓). You are ready to book and drive any VITO vehicle.'
        : 'Your driving licence is not yet verified. Please upload your licence in the Verify & Book section.';
    } else if (queryType === 'REQUIRED_DOCUMENTS') {
      responseText = 'To rent a self-drive vehicle with VITO, you need: 1) A valid government ID (Aadhaar/Passport), 2) A valid Driving Licence (Front & Back), and 3) A payment method for the refundable security deposit.';
    } else if (queryType === 'PICKUP_READINESS') {
      const activeBooking = await RentalBooking.findOne({
        userId,
        status: { $in: ['CONFIRMED', 'READY_FOR_PICKUP', 'HANDOVER_PENDING'] },
      }).lean();

      if (!activeBooking) {
        responseText = 'You have no pending pickups. Browse available cars and reserve your ride.';
      } else if (!activeBooking.licenceVerifiedAtBooking) {
        responseText = 'Your pickup is pending licence verification. Please complete verification on your booking screen.';
      } else {
        responseText = `Your vehicle (${(activeBooking.vehicleId as any)?.name || 'car'}) is confirmed for pickup at ${activeBooking.pickupLocation}. Please arrive at the scheduled pickup time with your original driving licence.`;
      }
    } else if (queryType === 'ADMIN_EXPIRY_REPORT' && req.user!.role === 'admin') {
      const vehicles = await Vehicle.find({ isDemo: true }).lean();
      const ineligibles: string[] = [];
      for (const v of vehicles) {
        const c = await checkVehicleDocumentCompliance(v._id);
        if (!c.compliant) ineligibles.push(`${v.name} (${c.expiredDocs.join(', ')})`);
      }
      responseText = ineligibles.length > 0
        ? `Attention: ${ineligibles.length} vehicles have expired/missing documents and are excluded from search: ${ineligibles.join('; ')}`
        : 'All active fleet vehicles have verified and compliant insurance, PUC, RC, and fitness certificates.';
    } else {
      responseText = 'VITO AI is ready to assist with your rentals, route estimates, and document status inquiries.';
    }

    res.status(200).json({
      success: true,
      data: {
        queryType,
        answer: responseText,
        userVerified: (user as any)?.licenceVerified || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 18. GET MY RENTALS ──────────────────────────────────────────────────────
export const getMyRentals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const { tab = 'all' } = req.query;

    let statusFilter: any = {};
    if (tab === 'upcoming') statusFilter = { status: { $in: ['CONFIRMED', 'READY_FOR_PICKUP', 'CUSTOMER_ARRIVING'] } };
    else if (tab === 'active') statusFilter = { status: { $in: ['HANDOVER_PENDING', 'HANDOVER_ACCEPTED', 'ACTIVE', 'EXTENSION_REQUESTED', 'EXTENDED'] } };
    else if (tab === 'completed') statusFilter = { status: { $in: ['COMPLETED', 'RATED', 'PAYMENT_COMPLETED'] } };
    else if (tab === 'cancelled') statusFilter = { status: { $in: ['CANCELLED', 'DISPUTED'] } };

    const rentals = await RentalBooking.find({ userId, ...statusFilter })
      .populate('vehicleId', 'name make vehicleModel year category images pricePerDay depositAmount city hostName hostRating hubName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: { rentals, count: rentals.length } });
  } catch (error) {
    next(error);
  }
};

// ─── 19. EXTEND RENTAL ───────────────────────────────────────────────────────
export const extendRental = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const { additionalHours } = req.body;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId }).populate('vehicleId');
    if (!booking) return next(new AppError('Booking not found.', 404));

    if (!['ACTIVE', 'EXTENDED'].includes(booking.status)) {
      return next(new AppError('Rental is not active.', 400));
    }

    const currentEnd = booking.currentReturnDateTime;
    const newEnd = new Date(currentEnd.getTime() + additionalHours * 60 * 60 * 1000);

    const availability = await checkVehicleAvailability(booking.vehicleId.toString(), currentEnd, newEnd, bookingMongoId);
    if (!availability.isAvailable) {
      return next(new AppError('This vehicle is already reserved after your current return time.', 409));
    }

    const vehicle = booking.vehicleId as any;
    const extensionPricing = calculateRentalPrice({
      pricePerDay: vehicle.pricePerDay,
      depositAmount: 0,
      pickupDateTime: currentEnd,
      returnDateTime: newEnd,
      city: vehicle.city || 'Delhi NCR',
      pickupMethod: 'self_pickup',
      isOneWay: false,
    });

    res.status(200).json({
      success: true,
      data: {
        extensionPricing: {
          additionalHours,
          previousReturnDateTime: currentEnd,
          newReturnDateTime: newEnd,
          additionalCharge: extensionPricing.totalPayable,
          breakdown: extensionPricing,
        },
        requiresConfirmation: true,
        message: 'Review extension price and confirm to proceed.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 20. CONFIRM EXTENSION ───────────────────────────────────────────────────
export const confirmExtension = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const { additionalHours, additionalCharge } = req.body;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));

    const currentEnd = booking.currentReturnDateTime;
    const newEnd = new Date(currentEnd.getTime() + additionalHours * 60 * 60 * 1000);

    const availability = await checkVehicleAvailability(booking.vehicleId.toString(), currentEnd, newEnd, bookingMongoId);
    if (!availability.isAvailable) {
      return next(new AppError('This vehicle is no longer available for this extension window.', 409));
    }

    const extensionRecord = {
      requestedAt: new Date(),
      confirmedAt: new Date(),
      previousEndDate: currentEnd,
      newEndDate: newEnd,
      additionalHours,
      priceDelta: additionalCharge,
    };

    booking.extensionHistory.push(extensionRecord as any);
    booking.currentReturnDateTime = newEnd;
    booking.pricing.totalPayable += additionalCharge;
    booking.pricing.totalWithDeposit += additionalCharge;
    booking.status = 'EXTENDED';

    addTimelineEvent(booking, 'Rental Extended', `Extended by ${additionalHours}h for ₹${additionalCharge}. New return: ${newEnd.toISOString()}`, 'Customer');
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Rental extended by ${additionalHours} hour(s). New return: ${newEnd.toISOString()}`,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 21. CANCEL BOOKING ─────────────────────────────────────────────────────
export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const { reason } = req.body;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId });
    if (!booking) return next(new AppError('Booking not found.', 404));

    const hoursUntilPickup = (booking.pickupDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    let cancellationFee = 0;
    if (hoursUntilPickup >= 24) cancellationFee = 0;
    else if (hoursUntilPickup >= 6) cancellationFee = Math.round(booking.pricing.totalPayable * 0.25);
    else cancellationFee = Math.round(booking.pricing.totalPayable * 0.50);

    booking.status = 'CANCELLED';
    booking.cancellationReason = reason || '';
    booking.cancellationFeeApplied = cancellationFee;

    addTimelineEvent(booking, 'Booking Cancelled', `Cancellation fee applied: ₹${cancellationFee}`, 'Customer');
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled.',
      data: { cancellationFee },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 22. GET BOOKING STATUS ──────────────────────────────────────────────────
export const getBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingMongoId } = req.params;
    const userId = req.user!._id;

    const booking = await RentalBooking.findOne({ _id: bookingMongoId, userId })
      .populate('vehicleId', 'name make vehicleModel year category images pricePerDay depositAmount city hostName hostRating location hubName')
      .lean();

    if (!booking) return next(new AppError('Booking not found.', 404));

    res.status(200).json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

// ─── 23. GET VEHICLE DETAIL ───────────────────────────────────────────────────
export const getVehicleDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, status: 'VERIFIED' })
      .populate('hubId', 'name code city address location operatingHours contactPhone')
      .lean();
    if (!vehicle) return next(new AppError('Vehicle not found or not available.', 404));

    res.status(200).json({ success: true, data: { vehicle } });
  } catch (error) {
    next(error);
  }
};

// ─── 24. GET ALL HUBS ────────────────────────────────────────────────────────
export const getRentalHubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let hubs = await RentalHub.find({ status: 'ACTIVE' }).lean();
    if (hubs.length === 0) {
      await autoSeedRentals();
      hubs = await RentalHub.find({ status: 'ACTIVE' }).lean();
    }
    res.status(200).json({ success: true, data: { hubs, count: hubs.length } });
  } catch (error) {
    next(error);
  }
};

// ─── 25. CALCULATE PRICE ──────────────────────────────────────────────────────
export const calculatePrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, pickupDateTime, returnDateTime, pickupMethod, isOneWay, deliveryDistanceKm, couponCode } = req.body;

    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) return next(new AppError('Vehicle not found.', 404));

    const start = new Date(pickupDateTime);
    const end = new Date(returnDateTime);

    const pricing = calculateRentalPrice({
      pricePerDay: vehicle.pricePerDay,
      depositAmount: vehicle.depositAmount || 3000,
      pickupDateTime: start,
      returnDateTime: end,
      city: vehicle.city || 'Delhi NCR',
      pickupMethod: pickupMethod || 'self_pickup',
      deliveryDistanceKm: deliveryDistanceKm || 10,
      isOneWay: isOneWay || false,
      couponCode,
    });

    res.status(200).json({ success: true, data: { pricing } });
  } catch (error) {
    next(error);
  }
};

// ─── 26. DEMO VERIFICATION ───────────────────────────────────────────────────
export const demoVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    await User.findByIdAndUpdate(userId, { licenceVerified: true, identityVerified: true });
    res.status(200).json({ success: true, message: 'Verification completed.' });
  } catch (error) {
    next(error);
  }
};
