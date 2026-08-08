import { Request, Response, NextFunction } from 'express';
import DriverHire from '../models/DriverHire.model';
import { AppError } from '../middleware/error.middleware';

// Mock verified driver profiles pool
const MOCK_DRIVER_PROFILES = [
  {
    id: 'drv_1',
    name: 'Ramesh Chandra',
    phone: '+91 98765 12345',
    experience: 9, // years
    rating: 4.9,
    hourlyRate: 180, // ₹/hr
    verificationStatus: 'verified',
    avatar: 'RC',
    specialization: 'Luxury Sedans & Outstation',
    latOffset: 0.004,
    lngOffset: 0.005,
  },
  {
    id: 'drv_2',
    name: 'Sunita Malhotra',
    phone: '+91 98123 67890',
    experience: 7,
    rating: 4.8,
    hourlyRate: 160,
    verificationStatus: 'verified',
    avatar: 'SM',
    specialization: 'Automatic Cars & Night Shifts',
    latOffset: -0.003,
    lngOffset: 0.006,
  },
  {
    id: 'drv_3',
    name: 'Gurpreet Singh',
    phone: '+91 97111 54321',
    experience: 12,
    rating: 4.95,
    hourlyRate: 220,
    verificationStatus: 'verified',
    avatar: 'GS',
    specialization: 'SUVs & Outstation Long Hauls',
    latOffset: 0.006,
    lngOffset: -0.004,
  },
  {
    id: 'drv_4',
    name: 'Amit Joshi',
    phone: '+91 99999 44444',
    experience: 5,
    rating: 4.7,
    hourlyRate: 150,
    verificationStatus: 'verified',
    avatar: 'AJ',
    specialization: 'City Commutes & Hatchbacks',
    latOffset: -0.005,
    lngOffset: -0.006,
  },
  {
    id: 'drv_5',
    name: 'Sanjay Kumar',
    phone: '+91 98888 33333',
    experience: 10,
    rating: 4.85,
    hourlyRate: 200,
    verificationStatus: 'verified',
    avatar: 'SK',
    specialization: 'EVs & VIP Escort',
    latOffset: 0.003,
    lngOffset: -0.002,
  },
];

// Helper: Calculate fare breakdown
export const calculateDriverFare = (
  hourlyRate: number,
  hours: number,
  startTime: string,
  isOutstation: boolean
) => {
  const baseFare = hours * hourlyRate;

  // Extract start hour (format: "HH:mm" or "HH:MM AM/PM")
  let startHour = 10;
  if (startTime) {
    const parts = startTime.split(':');
    if (parts.length >= 1) {
      startHour = parseInt(parts[0], 10) || 10;
    }
  }

  const endHour = (startHour + hours) % 24;

  // Check if trip covers night hours (22:00 to 06:00)
  const isNightTrip =
    startHour >= 22 || startHour < 6 || endHour >= 22 || endHour < 6 || hours >= 12;

  const nightCharge = isNightTrip ? Math.round(baseFare * 0.2) : 0;
  const outstationAllowance = isOutstation ? 300 : 0;
  const totalFare = baseFare + nightCharge + outstationAllowance;

  return {
    baseFare,
    nightCharge,
    outstationAllowance,
    totalFare,
    isNightTrip,
  };
};

// ─── Get Available Verified Drivers ───────────────────────────────────────
export const getAvailableDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        drivers: MOCK_DRIVER_PROFILES,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Calculate Fare API Endpoint ──────────────────────────────────────────
export const calculateFareEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { hourlyRate, hours, startTime, isOutstation } = req.body;

    if (!hourlyRate || !hours) {
      return next(new AppError('hourlyRate and hours are required.', 400));
    }

    const fareInfo = calculateDriverFare(
      Number(hourlyRate),
      Number(hours),
      startTime || '10:00',
      Boolean(isOutstation)
    );

    res.status(200).json({
      success: true,
      data: fareInfo,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Create Driver Hire Booking ────────────────────────────────────────────
export const createDriverHire = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const {
      driverName,
      driverPhone,
      hourlyRate,
      pickupLocation,
      bookingDate,
      startTime,
      hours,
      isOutstation,
    } = req.body;

    if (!driverName || !pickupLocation || !bookingDate || !startTime || !hours || !hourlyRate) {
      return next(new AppError('Please fill all required driver booking fields.', 400));
    }

    const fareInfo = calculateDriverFare(
      Number(hourlyRate),
      Number(hours),
      startTime,
      Boolean(isOutstation)
    );

    const booking = await DriverHire.create({
      userId,
      driverName,
      driverPhone: driverPhone || '+91 98765 43210',
      hourlyRate: Number(hourlyRate),
      pickupLocation,
      bookingDate: new Date(bookingDate),
      startTime,
      hours: Number(hours),
      isOutstation: Boolean(isOutstation),
      baseFare: fareInfo.baseFare,
      nightCharge: fareInfo.nightCharge,
      outstationAllowance: fareInfo.outstationAllowance,
      totalFare: fareInfo.totalFare,
      status: 'confirmed',
    });

    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Driver hired successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Hire Status ───────────────────────────────────────────────────
export const updateHireStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['in_progress', 'completed', 'cancelled'].includes(status)) {
      return next(new AppError('Valid status is required.', 400));
    }

    const booking = await DriverHire.findById(id);
    if (!booking) {
      return next(new AppError('Booking not found.', 404));
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      data: { booking },
      message: `Booking status updated to ${status}.`,
    });
  } catch (error) {
    next(error);
  }
};
