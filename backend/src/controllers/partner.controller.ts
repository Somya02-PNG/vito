import { Request, Response, NextFunction } from 'express';
import Driver from '../models/Driver.model';
import RentalPartner from '../models/RentalPartner.model';
import Vehicle from '../models/Vehicle.model';
import Rental from '../models/Rental.model';
import { AppError } from '../middleware/error.middleware';

// ─── Get Partner Profile ─────────────────────────────────────────────────────
export const getPartnerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const effectivePartnerType = user.partnerType || (user.role === 'driver' ? 'driver' : null);

    if (effectivePartnerType === 'driver' || user.role === 'driver') {
      const driverProfile = await Driver.findOne({ userId: user._id }).lean();
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            partnerType: effectivePartnerType,
            status: user.status || 'active',
            createdAt: user.createdAt,
          },
          partnerProfile: driverProfile,
        },
      });
    }

    if (effectivePartnerType === 'rental_partner') {
      const rentalProfile = await RentalPartner.findOne({ userId: user._id }).lean();
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            partnerType: effectivePartnerType,
            status: user.status || 'active',
            createdAt: user.createdAt,
          },
          partnerProfile: rentalProfile,
        },
      });
    }

    return next(new AppError('Partner profile not found.', 404));
  } catch (error) {
    next(error);
  }
};

// ─── Update Partner Profile ──────────────────────────────────────────────────
export const updatePartnerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { city, profileImage, businessName, fleetCount } = req.body;
    const effectivePartnerType = user.partnerType || (user.role === 'driver' ? 'driver' : null);

    if (effectivePartnerType === 'driver' || user.role === 'driver') {
      const updates: Record<string, any> = {};
      if (city !== undefined) updates.city = city;
      if (profileImage !== undefined) updates.profileImage = profileImage;

      const driverProfile = await Driver.findOneAndUpdate(
        { userId: user._id },
        updates,
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        data: { partnerProfile: driverProfile },
        message: 'Driver profile updated.',
      });
    }

    if (effectivePartnerType === 'rental_partner') {
      const updates: Record<string, any> = {};
      if (city !== undefined) updates.city = city;
      if (profileImage !== undefined) updates.profileImage = profileImage;
      if (businessName !== undefined) updates.businessName = businessName;
      if (fleetCount !== undefined) updates.fleetCount = fleetCount;

      const rentalProfile = await RentalPartner.findOneAndUpdate(
        { userId: user._id },
        updates,
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        data: { partnerProfile: rentalProfile },
        message: 'Rental partner profile updated.',
      });
    }

    return next(new AppError('Partner profile not found.', 404));
  } catch (error) {
    next(error);
  }
};

// ─── Get Fleet Partner Dashboard Overview Metrics ─────────────────────────────
export const getPartnerDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    let rentalProfile = await RentalPartner.findOne({ userId: user._id }).lean();

    if (!rentalProfile) {
      const created = await RentalPartner.create({
        userId: user._id,
        businessName: `${user.name} Fleet Mobility`,
        city: 'New Delhi',
        fleetCount: 0,
        verificationStatus: 'verified',
        walletBalance: 0,
      });
      rentalProfile = created.toObject() as any;
    }

    // Vehicles owned by this partner
    const vehicles = await Vehicle.find({ ownerId: user._id }).lean();
    const vehicleIds = vehicles.map((v) => v._id);

    // Rentals for these vehicles
    const rentals = await Rental.find({ vehicleId: { $in: vehicleIds } })
      .populate('userId', 'name phone email')
      .populate('vehicleId', 'category pricePerDay')
      .sort({ createdAt: -1 })
      .lean();

    const activeCount = rentals.filter((r) => r.status === 'active').length;
    const pendingCount = rentals.filter((r) => r.status === 'pending').length;
    const totalVehicles = vehicles.length;
    const availableVehicles = Math.max(0, totalVehicles - activeCount);

    const upcomingBookings = rentals.filter((r) => r.status === 'confirmed' || r.status === 'pending');

    res.status(200).json({
      success: true,
      data: {
        partnerProfile: rentalProfile,
        stats: {
          totalVehicles,
          availableVehicles,
          currentlyRented: activeCount,
          pendingRequests: pendingCount,
          todayEarnings: rentalProfile?.walletBalance || 0,
        },
        vehicles,
        upcomingBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};
