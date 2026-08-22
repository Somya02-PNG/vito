import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs';
import User from '../models/User.model';
import RentalPartner, { IRentalPartner, PartnerBusinessModelType } from '../models/RentalPartner.model';
import Vehicle, { IVehicle, VehicleVerificationStatus } from '../models/Vehicle.model';
import VehicleDocument, { IVehicleDocument, VehicleDocType, VehicleDocVerificationStatus } from '../models/VehicleDocument.model';
import RentalBooking from '../models/RentalBooking.model';
import VehicleDamage from '../models/VehicleDamage.model';
import Payment from '../models/Payment.model';
import AuditLog, { logAuditEvent } from '../models/AuditLog.model';
import VehicleEligibilityService from '../services/vehicleEligibility.service';
import { AppError } from '../middleware/error.middleware';
import { BASE_PRIVATE_UPLOAD_DIR, DOCS_DIR, PHOTOS_DIR } from '../config/upload';

// ─── Unique ID Generators ───────────────────────────────────────────────────
function generateVehicleId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'VITO-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generatePartnerId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'PRT-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ─── Helper: Get or Create Partner Profile for Logged In User ───────────────
async function getAuthenticatedPartner(userId: Types.ObjectId | string): Promise<IRentalPartner> {
  let partner = await RentalPartner.findOne({ userId });
  if (!partner) {
    const user = await User.findById(userId);
    partner = await RentalPartner.create({
      partnerId: generatePartnerId(),
      userId,
      partnerType: 'INDIVIDUAL_OWNER',
      fullName: user?.name || 'Rental Partner',
      businessName: `${user?.name || 'Partner'} Mobility`,
      email: user?.email || '',
      phone: user?.phone || '',
      city: 'Delhi NCR',
      state: 'Delhi',
      country: 'India',
      verificationStatus: 'pending',
      walletBalance: 0,
      totalEarnings: 0,
    });
  }
  return partner;
}

// ─── 1. REGISTER RENTAL PARTNER ─────────────────────────────────────────────
export const registerRentalPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const {
      partnerType,
      fullName,
      businessName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      country,
      businessRegistrationNumber,
      panNumber,
      gstNumber,
    } = req.body;

    let partner = await RentalPartner.findOne({ userId: user._id });

    const partnerData = {
      partnerId: partner?.partnerId || generatePartnerId(),
      userId: user._id,
      partnerType: (partnerType as PartnerBusinessModelType) || 'INDIVIDUAL_OWNER',
      fullName: fullName || user.name,
      businessName: businessName || `${fullName || user.name} Rentals`,
      email: email || user.email,
      phone: phone || user.phone,
      address: address || '',
      city: city || 'Delhi NCR',
      state: state || 'Delhi',
      pincode: pincode || '',
      country: country || 'India',
      businessRegistrationNumber: businessRegistrationNumber || '',
      panNumber: panNumber || '',
      gstNumber: gstNumber || '',
      verificationStatus: 'pending' as const,
    };

    if (partner) {
      partner = await RentalPartner.findByIdAndUpdate(partner._id, partnerData, {
        new: true,
        runValidators: true,
      });
    } else {
      partner = await RentalPartner.create(partnerData);
    }

    // Update user role to partner with partnerType rental_partner
    await User.findByIdAndUpdate(user._id, {
      role: 'partner',
      partnerType: 'rental_partner',
    });

    await logAuditEvent({
      actorId: user._id,
      actorRole: 'partner',
      action: 'PARTNER_REGISTERED',
      entityType: 'RentalPartner',
      entityId: partner!._id.toString(),
      metadata: { partnerType: partner!.partnerType, businessName: partner!.businessName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Rental partner registration submitted for verification.',
      data: { partnerProfile: partner },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 2. GET PARTNER DASHBOARD REAL AGGREGATIONS ─────────────────────────────
export const getPartnerDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);

    // Fetch vehicles belonging to this partner
    const vehicles = await Vehicle.find({
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
      status: { $ne: 'ARCHIVED' },
    }).sort({ createdAt: -1 });

    const vehicleIds = vehicles.map((v) => v._id);

    // Aggregate real metrics from database
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(
      (v) => v.status === 'VERIFIED' && v.availabilityStatus === 'AVAILABLE'
    ).length;
    const pendingVerification = vehicles.filter(
      (v) => v.status === 'UNDER_REVIEW' || v.status === 'DOCUMENTS_PENDING' || v.status === 'DRAFT'
    ).length;

    // Real bookings aggregation
    const bookings = await RentalBooking.find({
      vehicleId: { $in: vehicleIds },
    })
      .populate('userId', 'name email phone')
      .populate('vehicleId', 'name vehicleModel make category registrationNumber pricePerDay images photos')
      .sort({ createdAt: -1 });

    const activeRentals = bookings.filter((b) => b.status === 'ACTIVE' || b.status === 'EXTENDED').length;
    const upcomingBookings = bookings.filter(
      (b) => b.status === 'CONFIRMED' || b.status === 'READY_FOR_PICKUP' || b.status === 'HANDOVER_PENDING'
    );
    const pendingReturns = bookings.filter((b) => b.status === 'RETURN_PENDING' || b.status === 'RETURNED').length;

    // Real Damage Cases
    const damageCases = await VehicleDamage.find({
      vehicleId: { $in: vehicleIds },
      status: { $in: ['REPORTED', 'UNDER_REVIEW'] },
    }).countDocuments();

    // Financial calculations
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'PAYMENT_COMPLETED');
    let totalGrossRevenue = 0;
    completedBookings.forEach((b) => {
      const base = b.pricing?.totalPayable || 0;
      totalGrossRevenue += base;
    });

    const platformFee = Math.round(totalGrossRevenue * 0.15); // 15% platform fee
    const taxes = Math.round(totalGrossRevenue * 0.05); // 5% GST
    const netEarnings = Math.max(0, totalGrossRevenue - platformFee - taxes);

    res.status(200).json({
      success: true,
      data: {
        partnerProfile: partner,
        stats: {
          totalVehicles,
          availableVehicles,
          currentlyRented: activeRentals,
          pendingVerification,
          upcomingBookingsCount: upcomingBookings.length,
          activeRentals,
          pendingReturns,
          damageCases,
          totalGrossRevenue,
          platformFee,
          netEarnings,
          todayEarnings: partner.walletBalance || 0,
        },
        vehicles,
        upcomingBookings: upcomingBookings.slice(0, 5),
        recentBookings: bookings.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 3. GET PARTNER VEHICLES LIST (with Filter/Search) ──────────────────────
export const getPartnerVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { status, category, search } = req.query;

    const query: any = {
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
      status: { $ne: 'ARCHIVED' },
    };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { vehicleModel: { $regex: search, $options: 'i' } },
      ];
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 }).lean();

    // Attach document summaries and compliance check for each vehicle
    const enrichedVehicles = await Promise.all(
      vehicles.map(async (v) => {
        const docs = await VehicleDocument.find({ vehicleId: v._id }).lean();
        const eligibility = await VehicleEligibilityService.isVehicleBookable(v._id);
        return {
          ...v,
          documentsCount: docs.length,
          verifiedDocumentsCount: docs.filter((d) => d.verificationStatus === 'VERIFIED').length,
          expiredDocumentsCount: docs.filter((d) => d.verificationStatus === 'EXPIRED').length,
          isBookable: eligibility.isBookable,
          eligibilityReasons: eligibility.reasons,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { vehicles: enrichedVehicles, count: enrichedVehicles.length },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 4. GET SINGLE VEHICLE DETAILS ──────────────────────────────────────────
export const getPartnerVehicleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
      _id: id,
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or you are not authorized to view it.', 404));
    }

    const documents = await VehicleDocument.find({ vehicleId: vehicle._id }).sort({ createdAt: -1 });
    const eligibility = await VehicleEligibilityService.isVehicleBookable(vehicle._id);

    // Expiration warning for documents expiring within 15 days
    const now = new Date();
    const fifteenDaysAhead = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const expiringSoonDocs = documents.filter(
      (d) => d.expiresAt && new Date(d.expiresAt) > now && new Date(d.expiresAt) <= fifteenDaysAhead
    );

    res.status(200).json({
      success: true,
      data: {
        vehicle,
        documents,
        expiringSoonDocs,
        isBookable: eligibility.isBookable,
        eligibilityReasons: eligibility.reasons,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 5. CREATE VEHICLE (Step 1 -> Saved as DRAFT) ───────────────────────────
export const createVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);

    const {
      make,
      vehicleModel,
      variant,
      year,
      registrationNumber,
      category,
      fuelType,
      transmission,
      seats,
      color,
      pricePerDay,
      depositAmount,
      mileagePolicy,
      ownershipType,
      registeredOwnerName,
      city,
      address,
      features,
    } = req.body;

    if (!registrationNumber || !make || !vehicleModel || !category || !pricePerDay) {
      return next(new AppError('Please provide all mandatory vehicle fields (Make, Model, Registration, Category, Price).', 400));
    }

    // Check unique registration number
    const existing = await Vehicle.findOne({
      registrationNumber: registrationNumber.trim().toUpperCase(),
      status: { $ne: 'ARCHIVED' },
    });
    if (existing) {
      return next(new AppError(`Vehicle with registration ${registrationNumber} is already registered on VITO.`, 400));
    }

    const vehicle = await Vehicle.create({
      vehicleId: generateVehicleId(),
      make: make.trim(),
      vehicleModel: vehicleModel.trim(),
      variant: variant?.trim() || '',
      name: `${make.trim()} ${vehicleModel.trim()}`,
      year: Number(year) || 2023,
      registrationNumber: registrationNumber.trim().toUpperCase(),
      category: category.toLowerCase(),
      fuelType: fuelType?.toLowerCase() || 'petrol',
      transmission: transmission?.toLowerCase() || 'manual',
      seats: Number(seats) || 5,
      seatingCapacity: Number(seats) || 5,
      color: color || 'Silver',
      pricePerDay: Number(pricePerDay),
      depositAmount: depositAmount !== undefined ? Number(depositAmount) : 3000,
      mileagePolicy: mileagePolicy || '200 km/day free, ₹10/km beyond',
      ownershipType: ownershipType || 'OWNED_BY_PARTNER',
      registeredOwnerName: registeredOwnerName || partner.fullName || user.name,
      city: city || partner.city || 'Delhi NCR',
      address: address || partner.address || '',
      features: Array.isArray(features) ? features : [],
      ownerId: user._id,
      partnerId: partner._id,
      hostName: partner.businessName || user.name,
      status: 'DRAFT', // Explicitly starts as DRAFT
      availabilityStatus: 'AVAILABLE',
    });

    await logAuditEvent({
      actorId: user._id,
      actorRole: 'partner',
      action: 'VEHICLE_CREATED_DRAFT',
      entityType: 'Vehicle',
      entityId: vehicle._id.toString(),
      metadata: { vehicleId: vehicle.vehicleId, registrationNumber: vehicle.registrationNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle draft created successfully. Please upload photos and mandatory compliance documents.',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 6. UPDATE VEHICLE (Re-verification trigger on critical fields) ──────────
export const updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
      _id: id,
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized.', 404));
    }

    const {
      make,
      vehicleModel,
      variant,
      year,
      registrationNumber,
      category,
      fuelType,
      transmission,
      seats,
      color,
      pricePerDay,
      depositAmount,
      mileagePolicy,
      ownershipType,
      registeredOwnerName,
      city,
      address,
      features,
    } = req.body;

    // Check critical field edits
    let requiresReVerification = false;
    if (
      registrationNumber &&
      registrationNumber.trim().toUpperCase() !== vehicle.registrationNumber
    ) {
      requiresReVerification = true;
    }
    if (ownershipType && ownershipType !== vehicle.ownershipType) {
      requiresReVerification = true;
    }
    if (registeredOwnerName && registeredOwnerName !== vehicle.registeredOwnerName) {
      requiresReVerification = true;
    }

    if (make) vehicle.make = make.trim();
    if (vehicleModel) vehicle.vehicleModel = vehicleModel.trim();
    if (variant !== undefined) vehicle.variant = variant.trim();
    vehicle.name = `${vehicle.make} ${vehicle.vehicleModel}`;
    if (year) vehicle.year = Number(year);
    if (registrationNumber) vehicle.registrationNumber = registrationNumber.trim().toUpperCase();
    if (category) vehicle.category = category.toLowerCase();
    if (fuelType) vehicle.fuelType = fuelType.toLowerCase();
    if (transmission) vehicle.transmission = transmission.toLowerCase();
    if (seats) {
      vehicle.seats = Number(seats);
      vehicle.seatingCapacity = Number(seats);
    }
    if (color) vehicle.color = color;
    if (pricePerDay) vehicle.pricePerDay = Number(pricePerDay);
    if (depositAmount !== undefined) vehicle.depositAmount = Number(depositAmount);
    if (mileagePolicy) vehicle.mileagePolicy = mileagePolicy;
    if (ownershipType) vehicle.ownershipType = ownershipType;
    if (registeredOwnerName) vehicle.registeredOwnerName = registeredOwnerName;
    if (city) vehicle.city = city;
    if (address !== undefined) vehicle.address = address;
    if (Array.isArray(features)) vehicle.features = features;

    // If critical fields modified on a VERIFIED vehicle, reset to UNDER_REVIEW
    if (requiresReVerification && vehicle.status === 'VERIFIED') {
      vehicle.status = 'UNDER_REVIEW';
      vehicle.availabilityStatus = 'VERIFICATION_REQUIRED';
      await logAuditEvent({
        actorId: user._id,
        actorRole: 'partner',
        action: 'VEHICLE_CRITICAL_FIELDS_MODIFIED_REVERIFICATION_TRIGGERED',
        entityType: 'Vehicle',
        entityId: vehicle._id.toString(),
        metadata: { newRegistration: vehicle.registrationNumber, ownershipType: vehicle.ownershipType },
        ipAddress: req.ip,
      });
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: requiresReVerification
        ? 'Vehicle details updated. Re-verification has been triggered for critical identity updates.'
        : 'Vehicle updated successfully.',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 7. REAL FILE UPLOAD: VEHICLE DOCUMENT (RC, Insurance, PUC, Fitness, etc.) 
export const uploadVehicleDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { id } = req.params; // vehicle MongoId
    const { documentType, documentName, expiresAt } = req.body;

    const file = req.file;
    if (!file) {
      return next(new AppError('No file selected. Please select a genuine file via the file picker.', 400));
    }

    const vehicle = await Vehicle.findOne({
      _id: id,
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized.', 404));
    }

    const validDocTypes: VehicleDocType[] = [
      'RC',
      'INSURANCE',
      'PUC',
      'FITNESS',
      'PERMIT',
      'OWNERSHIP_PROOF',
      'AUTHORIZATION_LETTER',
      'OTHER',
    ];

    if (!validDocTypes.includes(documentType)) {
      return next(new AppError(`Invalid document type: ${documentType}`, 400));
    }

    // Relative storage path inside private storage
    const storagePath = path.relative(BASE_PRIVATE_UPLOAD_DIR, file.path).replace(/\\/g, '/');

    // Remove older document of the same type for this vehicle if replacing
    const existingDoc = await VehicleDocument.findOne({
      vehicleId: vehicle._id,
      documentType,
    });

    let doc: IVehicleDocument;
    if (existingDoc) {
      existingDoc.storagePath = storagePath;
      existingDoc.originalFileName = file.originalname;
      existingDoc.mimeType = file.mimetype;
      existingDoc.fileSize = file.size;
      existingDoc.uploadedAt = new Date();
      existingDoc.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
      existingDoc.verificationStatus = 'PENDING'; // Uploaded != Verified. Starts as PENDING
      existingDoc.rejectionReason = '';
      doc = await existingDoc.save();
    } else {
      doc = await VehicleDocument.create({
        vehicleId: vehicle._id,
        partnerId: partner._id,
        documentType,
        documentName: documentName || `${documentType} Document`,
        storagePath,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        verificationStatus: 'PENDING', // Uploaded != Verified
      });
    }

    // Update vehicle status from DRAFT to DOCUMENTS_PENDING if not already
    if (vehicle.status === 'DRAFT') {
      vehicle.status = 'DOCUMENTS_PENDING';
      await vehicle.save();
    }

    await logAuditEvent({
      actorId: user._id,
      actorRole: 'partner',
      action: 'DOCUMENT_UPLOADED',
      entityType: 'VehicleDocument',
      entityId: doc._id.toString(),
      metadata: {
        vehicleId: vehicle._id.toString(),
        documentType: doc.documentType,
        fileName: file.originalname,
        fileSize: file.size,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Document ${documentType} uploaded successfully. Status is PENDING verification.`,
      data: { document: doc },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 8. REAL FILE UPLOAD: VEHICLE PHOTOS (Front, Rear, Sides, Dashboard, etc.) 
export const uploadVehiclePhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { id } = req.params;
    const { category = 'additional' } = req.body;

    const file = req.file;
    if (!file) {
      return next(new AppError('No photo selected. Please choose an image file via native file picker.', 400));
    }

    const vehicle = await Vehicle.findOne({
      _id: id,
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized.', 404));
    }

    const storagePath = path.relative(BASE_PRIVATE_UPLOAD_DIR, file.path).replace(/\\/g, '/');
    const photoUrl = `/api/partner/photos/${path.basename(file.path)}`;

    // Update or add category photo
    const photoItem = {
      category: category as any,
      url: photoUrl,
      storagePath,
      originalFileName: file.originalname,
      uploadedAt: new Date(),
    };

    if (!vehicle.photos) vehicle.photos = [];
    // Replace category if single angle
    if (['front', 'rear', 'left', 'right', 'interior', 'dashboard', 'odometer'].includes(category)) {
      vehicle.photos = vehicle.photos.filter((p) => p.category !== category);
    }
    vehicle.photos.push(photoItem);

    if (!vehicle.images) vehicle.images = [];
    if (!vehicle.images.includes(photoUrl)) {
      vehicle.images.push(photoUrl);
    }

    await vehicle.save();

    await logAuditEvent({
      actorId: user._id,
      actorRole: 'partner',
      action: 'VEHICLE_PHOTO_UPLOADED',
      entityType: 'Vehicle',
      entityId: vehicle._id.toString(),
      metadata: { category, fileName: file.originalname },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Vehicle ${category} photo uploaded successfully.`,
      data: { photo: photoItem, vehicle },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 9. SUBMIT VEHICLE FOR ADMIN VERIFICATION ───────────────────────────────
export const submitVehicleForVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
      _id: id,
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized.', 404));
    }

    // Check mandatory document presence
    const docs = await VehicleDocument.find({ vehicleId: vehicle._id });
    const uploadedTypes = docs.map((d) => d.documentType);
    const missing: string[] = [];

    ['RC', 'INSURANCE', 'PUC', 'FITNESS'].forEach((reqType) => {
      if (!uploadedTypes.includes(reqType as any)) missing.push(reqType);
    });

    if (missing.length > 0) {
      return next(new AppError(`Cannot submit for review. Missing mandatory documents: ${missing.join(', ')}`, 400));
    }

    vehicle.status = 'UNDER_REVIEW';
    await vehicle.save();

    await logAuditEvent({
      actorId: user._id,
      actorRole: 'partner',
      action: 'VEHICLE_SUBMITTED_FOR_VERIFICATION',
      entityType: 'Vehicle',
      entityId: vehicle._id.toString(),
      metadata: { documentsCount: docs.length },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Vehicle submitted for admin verification. Verification will be completed within 24 hours.',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 10. STREAM PRIVATE DOCUMENT (Strict Authentication + Ownership Check) ──
export const streamPrivateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { docId } = req.params;

    const document = await VehicleDocument.findById(docId);
    if (!document) {
      return next(new AppError('Document not found.', 404));
    }

    // Authorization check: User must be Admin OR Partner who owns the vehicle
    const isAdmin = user.role === 'admin';
    const partner = await RentalPartner.findOne({ userId: user._id });
    const isOwner = partner && partner._id.toString() === document.partnerId.toString();

    if (!isAdmin && !isOwner) {
      return next(new AppError('Access denied: You do not have permission to view this confidential partner document.', 403));
    }

    const fullFilePath = path.join(BASE_PRIVATE_UPLOAD_DIR, document.storagePath);
    if (!fs.existsSync(fullFilePath)) {
      return next(new AppError('Document file not found on private storage.', 404));
    }

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalFileName)}"`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const stream = fs.createReadStream(fullFilePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// ─── 11. STREAM PHOTO (Public / Authenticated Photo endpoint) ────────────────
export const streamPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const sanitized = path.basename(filename);
    const fullPath = path.join(PHOTOS_DIR, sanitized);

    if (!fs.existsSync(fullPath)) {
      return next(new AppError('Photo not found.', 404));
    }

    const ext = path.extname(sanitized).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    res.setHeader('Content-Type', mimeMap[ext] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// ─── 12. SET VEHICLE AVAILABILITY & CUSTOM DATE BLOCKS ───────────────────────
export const setVehicleAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { id } = req.params;
    const { availabilityStatus, customBlocks } = req.body;

    const vehicle = await Vehicle.findOne({
      _id: id,
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized.', 404));
    }

    if (availabilityStatus) {
      vehicle.availabilityStatus = availabilityStatus;
    }
    if (Array.isArray(customBlocks)) {
      vehicle.customAvailabilityBlocks = customBlocks;
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle availability updated successfully.',
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 13. ARCHIVE VEHICLE (Non-destructive soft delete) ──────────────────────
export const archiveVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
      _id: id,
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized.', 404));
    }

    // Soft-archive vehicle: NEVER hard delete
    vehicle.status = 'ARCHIVED';
    vehicle.availabilityStatus = 'UNAVAILABLE';
    await vehicle.save();

    await logAuditEvent({
      actorId: user._id,
      actorRole: 'partner',
      action: 'VEHICLE_ARCHIVED',
      entityType: 'Vehicle',
      entityId: vehicle._id.toString(),
      metadata: { registrationNumber: vehicle.registrationNumber },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Vehicle has been archived. Booking history is safely retained.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── 14. GET PARTNER BOOKINGS ───────────────────────────────────────────────
export const getPartnerBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { status, vehicleId } = req.query;

    const vehicles = await Vehicle.find({
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });
    const vehicleIds = vehicles.map((v) => v._id);

    const query: any = { vehicleId: { $in: vehicleIds } };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (vehicleId) {
      query.vehicleId = vehicleId;
    }

    const bookings = await RentalBooking.find(query)
      .populate('userId', 'name email phone')
      .populate('vehicleId', 'name vehicleModel make category registrationNumber pricePerDay images photos')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { bookings, count: bookings.length },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 15. GET PARTNER DAMAGE CASES & INSPECTIONS ─────────────────────────────
export const getPartnerDamages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);

    const vehicles = await Vehicle.find({
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });
    const vehicleIds = vehicles.map((v) => v._id);

    const damages = await VehicleDamage.find({ vehicleId: { $in: vehicleIds } })
      .populate('bookingId')
      .populate('vehicleId', 'name registrationNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { damages, count: damages.length },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 16. REPORT DAMAGE CASE ─────────────────────────────────────────────────
export const reportPartnerDamage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { bookingId, vehicleId, location, damageType, severity, description, estimatedCost } = req.body;

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized.', 404));
    }

    const damage = await VehicleDamage.create({
      bookingId,
      vehicleId,
      location: location || 'Body Panel',
      damageType: damageType || 'SCRATCH',
      severity: severity || 'MINOR',
      description: description || '',
      estimatedCost: Number(estimatedCost) || 0,
      status: 'UNDER_REVIEW', // Requires human admin review, NEVER auto charged
      detectedStage: 'RETURN',
      isPreExisting: false,
    });

    await logAuditEvent({
      actorId: user._id,
      actorRole: 'partner',
      action: 'DAMAGE_REPORTED',
      entityType: 'VehicleDamage',
      entityId: damage._id.toString(),
      metadata: { bookingId, vehicleId, estimatedCost },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Damage case submitted for customer & admin review. Deductions will only occur after admin confirmation.',
      data: { damage },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 17. GET PARTNER EARNINGS & PAYOUT RECORDS ──────────────────────────────
export const getPartnerEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);

    const vehicles = await Vehicle.find({
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
    });
    const vehicleIds = vehicles.map((v) => v._id);

    const completedBookings = await RentalBooking.find({
      vehicleId: { $in: vehicleIds },
      status: { $in: ['COMPLETED', 'PAYMENT_COMPLETED', 'RATED'] },
    }).populate('vehicleId', 'name registrationNumber category');

    let grossVolume = 0;
    const payoutRecords = completedBookings.map((b) => {
      const gross = b.pricing?.totalPayable || 0;
      grossVolume += gross;
      const fee = Math.round(gross * 0.15);
      const tax = Math.round(gross * 0.05);
      const net = Math.max(0, gross - fee - tax);
      return {
        bookingId: b.bookingId || b._id.toString(),
        vehicleName: (b.vehicleId as any)?.name || 'Vehicle',
        registrationNumber: (b.vehicleId as any)?.registrationNumber || '',
        completedAt: b.updatedAt,
        grossAmount: gross,
        platformFee: fee,
        taxes: tax,
        netPayout: net,
        status: 'PAID',
      };
    });

    const totalPlatformFee = Math.round(grossVolume * 0.15);
    const totalTaxes = Math.round(grossVolume * 0.05);
    const netEarnings = Math.max(0, grossVolume - totalPlatformFee - totalTaxes);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          grossVolume,
          platformFee: totalPlatformFee,
          taxes: totalTaxes,
          netEarnings,
          walletBalance: partner.walletBalance || 0,
        },
        payoutRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 18. AI ASSISTANT FLEET DIAGNOSTICS (Context-Aware & Auth Protected) ────
export const partnerAIAssistant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const partner = await getAuthenticatedPartner(user._id);
    const { message, vehicleId } = req.body;

    const vehicles = await Vehicle.find({
      $or: [{ partnerId: partner._id }, { ownerId: user._id }],
      status: { $ne: 'ARCHIVED' },
    });

    const lower = (message || '').toLowerCase();
    let responseText = '';

    if (lower.includes('why') || lower.includes("can't") || lower.includes('book') || vehicleId) {
      // Find matching vehicle
      let target = vehicles.find((v) => v._id.toString() === vehicleId);
      if (!target && lower) {
        target = vehicles.find(
          (v) =>
            lower.includes(v.make.toLowerCase()) ||
            lower.includes(v.vehicleModel.toLowerCase()) ||
            lower.includes(v.registrationNumber.toLowerCase())
        );
      }

      if (target) {
        const eligibility = await VehicleEligibilityService.isVehicleBookable(target._id);
        if (eligibility.isBookable) {
          responseText = `✅ Your ${target.name} (${target.registrationNumber}) is fully verified, document-compliant, and available for customer bookings.`;
        } else {
          responseText = `⚠️ Your ${target.name} (${target.registrationNumber}) cannot be booked right now for the following reason(s):\n• ` +
            eligibility.reasons.join('\n• ');
        }
      } else {
        responseText = `You currently have ${vehicles.length} registered vehicles. Please specify a vehicle name or registration number to diagnose.`;
      }
    } else if (lower.includes('available') || lower.includes('fleet') || lower.includes('status')) {
      const bookables = await VehicleEligibilityService.filterBookableVehicles(vehicles);
      responseText = `You have ${vehicles.length} total vehicles in your fleet. Currently, ${bookables.length} are 100% verified and active for customer reservations: ${bookables.map((v) => v.name).join(', ') || 'None'}.`;
    } else if (lower.includes('document') || lower.includes('requirement')) {
      responseText = 'Mandatory documents required for every rental vehicle in India: 1) Registration Certificate (RC), 2) Commercial Comprehensive Insurance (Zero-Dep), 3) Pollution Under Control (PUC), and 4) Fitness Certificate. If leased, an Authorization Letter is also required.';
    } else if (lower.includes('earning') || lower.includes('payout')) {
      responseText = `Your net earnings are calculated automatically: Gross Booking Value − 15% Platform Fee − 5% GST = Net Payout. Payouts are settled to your registered bank account.`;
    } else {
      responseText = `Hello ${partner.fullName || user.name}! I am your VITO Fleet Intelligence assistant. I can diagnose vehicle bookability, check document expiration dates, summarize available fleet cars, and explain earnings. How can I help you today?`;
    }

    res.status(200).json({
      success: true,
      data: { response: responseText },
    });
  } catch (error) {
    next(error);
  }
};
