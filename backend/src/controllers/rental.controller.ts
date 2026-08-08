import { Request, Response, NextFunction } from 'express';
import Rental from '../models/Rental.model';
import Vehicle from '../models/Vehicle.model';
import { AppError } from '../middleware/error.middleware';

// ─── Create Rental ──────────────────────────────────────────────────────────
export const createRental = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const {
      vehicleId,
      startDate,
      endDate,
      deliveryRequired,
      deliveryAddress,
      deliveryCharge,
      addOns,
      couponCode,
      depositAmount,
    } = req.body;

    // Validate required fields
    if (!vehicleId || !startDate || !endDate) {
      return next(
        new AppError('vehicleId, startDate, and endDate are required.', 400)
      );
    }

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return next(new AppError('Vehicle not found.', 404));
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format.', 400));
    }

    if (start < now) {
      return next(new AppError('Start date cannot be in the past.', 400));
    }

    if (end <= start) {
      return next(new AppError('End date must be after start date.', 400));
    }

    // Validate delivery
    if (deliveryRequired && !deliveryAddress) {
      return next(
        new AppError('Delivery address is required when delivery is requested.', 400)
      );
    }

    // Validate add-ons
    const validAddOns = ['child_seat', 'gps', 'extra_driver', 'insurance_upgrade'];
    if (addOns && Array.isArray(addOns)) {
      const invalid = addOns.filter((a: string) => !validAddOns.includes(a));
      if (invalid.length > 0) {
        return next(
          new AppError(`Invalid add-on(s): ${invalid.join(', ')}`, 400)
        );
      }
    }

    // Check for overlapping rentals on this vehicle
    const overlap = await Rental.findOne({
      vehicleId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } },
      ],
    });

    if (overlap) {
      return next(
        new AppError('Vehicle is already booked for the selected dates.', 409)
      );
    }

    // Create rental
    const rental = await Rental.create({
      vehicleId,
      userId,
      startDate: start,
      endDate: end,
      deliveryRequired: deliveryRequired || false,
      deliveryAddress: deliveryAddress || '',
      deliveryCharge: deliveryCharge || 0,
      depositAmount: depositAmount || 0,
      depositStatus: 'pending',
      addOns: addOns || [],
      couponCode: couponCode || '',
      status: 'pending',
    });

    // Populate vehicle info for the response
    const populated = await Rental.findById(rental._id)
      .populate('vehicleId', 'category fuelType transmission seats pricePerDay images')
      .lean();

    res.status(201).json({
      success: true,
      data: { rental: populated },
    });
  } catch (error) {
    next(error);
  }
};
