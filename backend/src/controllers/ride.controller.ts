import { Request, Response, NextFunction } from 'express';
import Ride from '../models/Ride.model';
import { AppError } from '../middleware/error.middleware';

// ─── Helper: Generate 4-digit OTP ──────────────────────────────────────────
const generate4DigitOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// ─── Create Ride Request ───────────────────────────────────────────────────
export const createRide = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const riderId = req.user!._id;
    const { pickup, drop, fare, driverInfo } = req.body;

    if (!pickup || !drop || !fare) {
      return next(new AppError('Pickup location, drop location, and fare are required.', 400));
    }

    if (!pickup.address || pickup.lat === undefined || pickup.lng === undefined) {
      return next(new AppError('Valid pickup address, lat, and lng are required.', 400));
    }

    if (!drop.address || drop.lat === undefined || drop.lng === undefined) {
      return next(new AppError('Valid drop address, lat, and lng are required.', 400));
    }

    const otp = generate4DigitOTP();

    const ride = await Ride.create({
      riderId,
      pickup: {
        address: pickup.address,
        lat: pickup.lat,
        lng: pickup.lng,
      },
      drop: {
        address: drop.address,
        lat: drop.lat,
        lng: drop.lng,
      },
      fare,
      otp,
      status: 'accepted', // Driver auto-accepts in simulated flow
    });

    res.status(201).json({
      success: true,
      data: {
        ride,
        driverInfo: driverInfo || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify OTP to Start Trip ──────────────────────────────────────────────
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return next(new AppError('Please provide the 4-digit OTP.', 400));
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return next(new AppError('Ride not found.', 404));
    }

    if (ride.otp !== otp.trim()) {
      return next(new AppError('Incorrect OTP. Please enter the valid 4-digit code.', 400));
    }

    ride.status = 'in_progress';
    await ride.save();

    res.status(200).json({
      success: true,
      data: { ride },
      message: 'OTP verified! Trip started successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Ride Status (Complete / Cancel) ────────────────────────────────
export const updateRideStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['completed', 'cancelled'].includes(status)) {
      return next(new AppError('Valid status ("completed" or "cancelled") is required.', 400));
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return next(new AppError('Ride not found.', 404));
    }

    ride.status = status;
    await ride.save();

    res.status(200).json({
      success: true,
      data: { ride },
      message: `Ride status updated to ${status}.`,
    });
  } catch (error) {
    next(error);
  }
};
