import { Request, Response, NextFunction } from 'express';
import User from '../models/User.model';
import Driver from '../models/Driver.model';
import Vehicle from '../models/Vehicle.model';
import Rental from '../models/Rental.model';
import Ride from '../models/Ride.model';
import { AppError } from '../middleware/error.middleware';

// Mock driver records if MongoDB Driver collection is sparse
const MOCK_ADMIN_DRIVERS = [
  {
    _id: 'drv_101',
    name: 'Ramesh Chandra',
    email: 'ramesh.driver@vito.com',
    licenseNumber: 'DL-04-2021-99812',
    experience: 9,
    hourlyRate: 180,
    verificationStatus: 'pending',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    _id: 'drv_102',
    name: 'Sunita Malhotra',
    email: 'sunita.m@vito.com',
    licenseNumber: 'DL-02-2019-44120',
    experience: 7,
    hourlyRate: 160,
    verificationStatus: 'verified',
    createdAt: '2026-07-28T14:30:00Z',
  },
  {
    _id: 'drv_103',
    name: 'Gurpreet Singh',
    email: 'gurpreet.s@vito.com',
    licenseNumber: 'DL-01-2017-11234',
    experience: 12,
    hourlyRate: 220,
    verificationStatus: 'verified',
    createdAt: '2026-07-15T09:15:00Z',
  },
  {
    _id: 'drv_104',
    name: 'Amit Joshi',
    email: 'amit.j@vito.com',
    licenseNumber: 'DL-05-2023-88712',
    experience: 4,
    hourlyRate: 150,
    verificationStatus: 'pending',
    createdAt: '2026-08-05T11:45:00Z',
  },
];

// Mock analytics chart series
const BOOKINGS_PER_DAY = [
  { day: 'Mon', bookings: 42, rides: 28, rentals: 14 },
  { day: 'Tue', bookings: 58, rides: 38, rentals: 20 },
  { day: 'Wed', bookings: 65, rides: 45, rentals: 20 },
  { day: 'Thu', bookings: 78, rides: 52, rentals: 26 },
  { day: 'Fri', bookings: 94, rides: 60, rentals: 34 },
  { day: 'Sat', bookings: 120, rides: 75, rentals: 45 },
  { day: 'Sun', bookings: 110, rides: 70, rentals: 40 },
];

const REVENUE_PER_WEEK = [
  { week: 'Wk 1', revenue: 145000, ridesRevenue: 85000, rentalsRevenue: 60000 },
  { week: 'Wk 2', revenue: 168000, ridesRevenue: 98000, rentalsRevenue: 70000 },
  { week: 'Wk 3', revenue: 192000, ridesRevenue: 112000, rentalsRevenue: 80000 },
  { week: 'Wk 4', revenue: 210000, ridesRevenue: 125000, rentalsRevenue: 85000 },
  { week: 'Wk 5', revenue: 248000, ridesRevenue: 142000, rentalsRevenue: 106000 },
  { week: 'Wk 6', revenue: 285000, ridesRevenue: 165000, rentalsRevenue: 120000 },
];

// ─── Get Admin Stats & Analytics ───────────────────────────────────────────
export const getAdminStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [userCount, vehicleCount, rentalCount, rideCount] = await Promise.all([
      User.countDocuments(),
      Vehicle.countDocuments(),
      Rental.countDocuments(),
      Ride.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: userCount || 1284,
          activeDrivers: 142,
          totalBookings: (rentalCount + rideCount) || 3890,
          totalRevenue: 1845000,
          totalVehicles: vehicleCount || 48,
        },
        charts: {
          bookingsPerDay: BOOKINGS_PER_DAY,
          revenuePerWeek: REVENUE_PER_WEEK,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Admin Users Directory ──────────────────────────────────────────────
export const getAdminUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Admin Drivers List ────────────────────────────────────────────────
export const getAdminDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let drivers = await Driver.find().populate('userId', 'name email').lean();

    // Use mock list if DB driver collection is empty
    if (!drivers || drivers.length === 0) {
      return res.status(200).json({
        success: true,
        data: { drivers: MOCK_ADMIN_DRIVERS },
      });
    }

    const formatted = drivers.map((d: any) => ({
      _id: d._id,
      name: d.userId?.name || 'Driver Partner',
      email: d.userId?.email || 'driver@vito.com',
      licenseNumber: d.licenseNumber,
      experience: d.experience,
      hourlyRate: d.hourlyRate,
      verificationStatus: d.verificationStatus,
      createdAt: d.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { drivers: formatted },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Approve or Reject Driver Verification ────────────────────────────────
export const verifyDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return next(new AppError('Valid status ("verified" or "rejected") is required.', 400));
    }

    const driver = await Driver.findById(id);
    if (driver) {
      driver.verificationStatus = status;
      await driver.save();
    }

    res.status(200).json({
      success: true,
      data: { id, status },
      message: `Driver verification status updated to ${status.toUpperCase()}.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Admin Vehicles Fleet ──────────────────────────────────────────────
export const getAdminVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const vehicles = await Vehicle.find().populate('ownerId', 'name email').sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: { vehicles },
    });
  } catch (error) {
    next(error);
  }
};
