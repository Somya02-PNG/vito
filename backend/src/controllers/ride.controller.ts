import { Request, Response, NextFunction } from 'express';
import Ride from '../models/Ride.model';
import Driver from '../models/Driver.model';
import { AppError } from '../middleware/error.middleware';

// ─── Helper: Generate 4-digit OTP ──────────────────────────────────────────
const generate4DigitOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// ─── Get Nearby Drivers (5km radius via $nearSphere with optional category) ──
export const getNearbyDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const latStr = req.query.lat as string;
    const lngStr = req.query.lng as string;
    const category = req.query.category as string; // Mini, Sedan, SUV, Premium

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return next(new AppError('Valid lat and lng query parameters are required.', 400));
    }

    const radiusInMeters = 5000; // 5 km radius

    let drivers: any[] = [];
    try {
      drivers = await Driver.find({
        availability: true,
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
        .populate('userId', 'name phone profileImage')
        .lean();
    } catch (geoErr) {
      drivers = [];
    }

    // Fallback: If no drivers are within 5km of coordinates, return available drivers in DB
    if (drivers.length === 0) {
      drivers = await Driver.find({ availability: true })
        .populate('userId', 'name phone profileImage')
        .limit(10)
        .lean();
    }

    const vehicleModels: Record<string, string[]> = {
      Mini: ['Maruti WagonR', 'Tata Tiago', 'Hyundai Santro'],
      Sedan: ['Maruti Swift Dzire', 'Hyundai Aura', 'Honda Amaze'],
      SUV: ['Toyota Innova Crysta', 'Mahindra XUV700', 'Tata Harrier'],
      Premium: ['Mercedes C-Class', 'BMW 3 Series', 'Audi A4'],
    };

    const categories = ['Mini', 'Sedan', 'SUV', 'Premium'];

    let formattedDrivers = drivers.map((d: any, idx: number) => {
      const dLat = d.location?.lat ?? (lat + (idx % 2 === 0 ? 0.003 * (idx + 1) : -0.003 * (idx + 1)));
      const dLng = d.location?.lng ?? (lng + (idx % 2 === 0 ? 0.004 * (idx + 1) : -0.004 * (idx + 1)));
      const name = d.userId?.name || `Driver ${d.licenseNumber || idx + 1}`;
      const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const cat = category && categories.includes(category) ? category : categories[idx % categories.length];
      const modelList = vehicleModels[cat] || vehicleModels['Sedan'];
      const vehicleModel = modelList[idx % modelList.length];

      const fare = d.hourlyRate ? Math.round(d.hourlyRate * 1.4) : (idx === 0 ? 180 : 250 + idx * 45);

      return {
        id: d._id.toString(),
        _id: d._id.toString(),
        name,
        vehicleModel,
        vehicleNo: d.licenseNumber || `DL 0${idx + 1} AB ${1000 + idx * 234}`,
        category: cat,
        rating: d.rating || parseFloat((4.6 + (idx % 4) * 0.1).toFixed(1)),
        eta: `${2 + idx} mins`,
        fare,
        lat: dLat,
        lng: dLng,
        phone: d.userId?.phone || `+91 98765 ${43210 + idx}`,
        avatar: d.profileImage || initials || 'DR',
      };
    });

    if (category && category !== 'all') {
      formattedDrivers = formattedDrivers.filter((d) => d.category === category);
    }

    res.status(200).json({
      success: true,
      data: {
        drivers: formattedDrivers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Create Ride Request ───────────────────────────────────────────────────
export const createRide = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const riderId = req.user!._id;
    const { pickup, drop, stops, vehicleType, fare, fareBreakdown, driverId, status } = req.body;

    if (!pickup || !drop || fare === undefined) {
      return next(new AppError('Pickup location, drop location, and fare are required.', 400));
    }

    if (!pickup.address || pickup.lat === undefined || pickup.lng === undefined) {
      return next(new AppError('Valid pickup address, lat, and lng are required.', 400));
    }

    if (!drop.address || drop.lat === undefined || drop.lng === undefined) {
      return next(new AppError('Valid drop address, lat, and lng are required.', 400));
    }

    const otp = generate4DigitOTP();

    const rideStatus = status || (driverId ? 'driver_assigned' : 'searching_driver');

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
      stops: stops || [],
      vehicleType: vehicleType || 'Sedan',
      driverId: driverId || null,
      fare,
      fareBreakdown: fareBreakdown || null,
      otp,
      status: rideStatus,
    });

    res.status(201).json({
      success: true,
      data: {
        ride,
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

// ─── Update Ride Status (Supports all state machine steps) ────────────────
export const updateRideStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, cancellationFee, updatedDrop, updatedFare } = req.body;

    const validStates = [
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_arriving',
      'driver_arrived',
      'in_progress',
      'completed',
      'cancelled',
      'no_driver_available',
    ];

    if (!status || !validStates.includes(status)) {
      return next(new AppError(`Invalid status '${status}'. Must be one of ${validStates.join(', ')}`, 400));
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return next(new AppError('Ride not found.', 404));
    }

    ride.status = status;

    if (status === 'cancelled' && cancellationFee) {
      ride.cancellationFee = cancellationFee;
    }

    if (updatedDrop) {
      ride.drop = updatedDrop;
    }

    if (updatedFare !== undefined) {
      ride.fare = updatedFare;
    }

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

// ─── Rate Driver & Submit Review/Tip ──────────────────────────────────────
export const rateRide = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { rating, comment, tip } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return next(new AppError('Rating must be between 1 and 5 stars.', 400));
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return next(new AppError('Ride not found.', 404));
    }

    ride.rating = rating;
    if (comment) ride.comment = comment;
    if (tip !== undefined) ride.tip = tip;

    await ride.save();

    // Recalculate average rating for the driver if driverId is set
    if (ride.driverId) {
      const driver = await Driver.findById(ride.driverId);
      if (driver) {
        const completedRides = await Ride.find({ driverId: driver._id, rating: { $ne: null } });
        const totalRatingSum = completedRides.reduce((sum, r) => sum + (r.rating || 5), 0);
        const newAvg = completedRides.length > 0 ? parseFloat((totalRatingSum / completedRides.length).toFixed(1)) : rating;
        driver.rating = newAvg;
        await driver.save();
      }
    }

    res.status(200).json({
      success: true,
      data: { ride },
      message: 'Rating and review submitted successfully!',
    });
  } catch (error) {
    next(error);
  }
};

