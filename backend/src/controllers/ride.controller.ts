import { Request, Response, NextFunction } from 'express';
import Ride from '../models/Ride.model';
import Driver from '../models/Driver.model';
import User from '../models/User.model';
import { AppError } from '../middleware/error.middleware';
import { routingService } from '../services/routing.service';
import { pricingService } from '../services/pricing.service';

// ─── Helper: Generate 4-digit OTP ──────────────────────────────────────────
const generate4DigitOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// ─── Pricing Rates Configuration ────────────────────────────────────────────
export interface CategoryPricing {
  id: string;
  name: string;
  categoryName: string;
  vehicleModel: string;
  seats: number;
  baseFare: number;
  perKmRate: number;
  perMinRate: number;
  bookingFee: number;
  description: string;
  icon: string;
}

export const CATEGORY_PRICING: Record<string, CategoryPricing> = {
  mini: {
    id: 'mini',
    name: 'Mini',
    categoryName: 'Compact Hatchback',
    vehicleModel: 'Maruti Alto / WagonR',
    seats: 4,
    baseFare: 40,
    perKmRate: 12,
    perMinRate: 1.2,
    bookingFee: 15,
    description: 'Affordable, compact rides for everyday city travel',
    icon: 'car',
  },
  sedan: {
    id: 'sedan',
    name: 'Sedan',
    categoryName: 'Comfortable Sedan',
    vehicleModel: 'Maruti Dzire / Honda Amaze',
    seats: 4,
    baseFare: 60,
    perKmRate: 15,
    perMinRate: 1.6,
    bookingFee: 20,
    description: 'Comfortable, AC sedans with extra legroom & boot space',
    icon: 'car',
  },
  xcar: {
    id: 'xcar',
    name: 'XCar',
    categoryName: 'Premium Executive',
    vehicleModel: 'Honda City / Hyundai Verna',
    seats: 4,
    baseFare: 90,
    perKmRate: 19,
    perMinRate: 2.2,
    bookingFee: 25,
    description: 'Top-rated drivers & executive premium sedans',
    icon: 'sparkles',
  },
  suv: {
    id: 'suv',
    name: 'SUV',
    categoryName: 'Spacious 6-Seater SUV',
    vehicleModel: 'Toyota Innova / Maruti Ertiga',
    seats: 6,
    baseFare: 130,
    perKmRate: 24,
    perMinRate: 3.0,
    bookingFee: 35,
    description: 'Extra room for groups & family with heavy luggage',
    icon: 'users',
  },
};

// ─── Surge Multiplier Lookup Table (Static time-of-day table) ───────────────
export const getSurgeMultiplier = (date: Date = new Date()): { multiplier: number; label: string } => {
  const hour = date.getHours();
  // Morning peak: 7 AM – 10 AM (1.25x)
  if (hour >= 7 && hour < 10) {
    return { multiplier: 1.25, label: 'Morning Peak Surge (1.25x)' };
  }
  // Evening peak: 6 PM – 9 PM (1.30x)
  if (hour >= 18 && hour < 21) {
    return { multiplier: 1.3, label: 'Evening Peak Surge (1.30x)' };
  }
  // Late night: 11 PM – 5 AM (1.15x)
  if (hour >= 23 || hour < 5) {
    return { multiplier: 1.15, label: 'Late Night Surge (1.15x)' };
  }
  // Standard
  return { multiplier: 1.0, label: 'Standard Rate' };
};

// ─── Calculate Itemized Fare Breakdown ───────────────────────────────────────
export const calculateFareBreakdown = (
  categoryKey: string,
  distanceKm: number,
  durationMin: number,
  scheduledTime?: Date | null
) => {
  const key = categoryKey.toLowerCase();
  // Map aliases like 'go' -> 'sedan', 'comfort' -> 'xcar', 'xl' -> 'suv'
  const aliasMap: Record<string, string> = {
    go: 'mini',
    comfort: 'xcar',
    xl: 'suv',
  };
  const resolvedKey = aliasMap[key] || key;
  const config = CATEGORY_PRICING[resolvedKey] || CATEGORY_PRICING.sedan;
  const surge = getSurgeMultiplier(scheduledTime || new Date());

  const distanceCharge = Math.round(distanceKm * config.perKmRate);
  const timeCharge = Math.round(durationMin * config.perMinRate);
  const subtotalBeforeSurge = config.baseFare + distanceCharge + timeCharge;
  const surgedSubtotal = Math.round(subtotalBeforeSurge * surge.multiplier);
  const surgeDifference = Math.max(0, surgedSubtotal - subtotalBeforeSurge);

  const subtotal = surgedSubtotal + config.bookingFee;
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + taxes;

  const minRange = Math.round(total * 0.95);
  const maxRange = Math.round(total * 1.05);

  return {
    id: config.id,
    category: config.id,
    name: config.name,
    categoryName: config.categoryName,
    vehicleModel: config.vehicleModel,
    seats: config.seats,
    baseFare: config.baseFare,
    distanceCharge,
    timeCharge,
    surgeMultiplier: surge.multiplier,
    surgeLabel: surge.label,
    surgeAmount: surgeDifference,
    bookingFee: config.bookingFee,
    taxes,
    total,
    fareRange: `₹${minRange}–₹${maxRange}`,
    icon: config.icon,
    description: config.description,
  };
};

// ─── 1. Estimate Fare Endpoint ──────────────────────────────────────────────
export const estimateFare = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pickup, drop, distanceKm, durationMin, scheduledTime } = req.body;
    let dist = Number(distanceKm);
    let dur = Number(durationMin);

    // If coordinates are provided, compute authoritative OSRM road distance and duration
    if (
      pickup &&
      typeof pickup.lat === 'number' &&
      typeof pickup.lng === 'number' &&
      drop &&
      typeof drop.lat === 'number' &&
      typeof drop.lng === 'number'
    ) {
      const route = await routingService.getRoute(
        { latitude: pickup.lat, longitude: pickup.lng },
        { latitude: drop.lat, longitude: drop.lng }
      );
      dist = route.distanceKm;
      dur = route.durationMinutes;
    } else if (!dist || isNaN(dist)) {
      dist = 8.5;
      dur = dur || 20;
    } else if (!dur || isNaN(dur)) {
      dur = Math.max(3, Math.ceil((dist / 25) * 60));
    }

    const scheduleDate = scheduledTime ? new Date(scheduledTime) : null;

    const categories = Object.keys(CATEGORY_PRICING).map((key) => {
      return calculateFareBreakdown(key, dist, dur, scheduleDate);
    });

    res.status(200).json({
      success: true,
      data: {
        distanceKm: dist,
        durationMin: dur,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
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

// ─── 2. Get Available Drivers for Matching ──────────────────────────────────
export const getAvailableDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lat, lng, category = 'go' } = req.query;
    const baseLat = Number(lat) || 28.6315;
    const baseLng = Number(lng) || 77.2167;

    // Query DB for verified drivers
    let dbDrivers = await Driver.find({ verificationStatus: 'verified' })
      .populate('userId', 'name phone email')
      .limit(6);

    // Fallback seed list if no DB drivers
    const seedPool = [
      { name: 'Rajesh Kumar', vehicleModel: 'Maruti Dzire', vehicleNo: 'DL 01 AB 4829', rating: 4.9, experience: 8, phone: '+91 98765 43210' },
      { name: 'Suresh Sharma', vehicleModel: 'Honda City', vehicleNo: 'DL 03 EV 9102', rating: 4.85, experience: 6, phone: '+91 98123 45678' },
      { name: 'Vikram Singh', vehicleModel: 'Toyota Innova', vehicleNo: 'DL 04 XY 7741', rating: 4.95, experience: 11, phone: '+91 97111 22334' },
      { name: 'Anita Verma', vehicleModel: 'Hyundai Verna', vehicleNo: 'DL 02 CD 1289', rating: 4.9, experience: 7, phone: '+91 99999 88888' },
      { name: 'Amit Patel', vehicleModel: 'Tata Tigor', vehicleNo: 'DL 01 TR 3311', rating: 4.75, experience: 5, phone: '+91 98888 77777' },
    ];

    const drivers = seedPool.map((driver, index) => {
      const dbMatch = dbDrivers[index];
      const name = (dbMatch?.userId as any)?.name || driver.name;
      const phone = (dbMatch?.userId as any)?.phone || driver.phone;
      const rating = dbMatch?.rating || driver.rating;
      const experience = dbMatch?.experience || driver.experience;

      // Realistic driver coordinates within 1-3km of pickup
      const angle = (index * 72 * Math.PI) / 180;
      const radius = 0.008 + index * 0.003;
      const driverLat = baseLat + Math.cos(angle) * radius;
      const driverLng = baseLng + Math.sin(angle) * radius;
      const etaMinutes = 2 + index * 1.5;

      return {
        id: dbMatch?._id?.toString() || `drv_${index + 1}`,
        name,
        phone,
        rating,
        experience,
        totalTrips: 840 + index * 260,
        vehicleModel: driver.vehicleModel,
        vehicleNo: driver.vehicleNo,
        category: category.toString(),
        lat: driverLat,
        lng: driverLng,
        eta: `${Math.ceil(etaMinutes)} mins`,
        etaMinutes: Math.ceil(etaMinutes),
        avatar: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        badges: ['Identity Verified', 'License Verified', 'Police Background Verified'],
      };
    });

    res.status(200).json({
      success: true,
      data: { drivers },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 3. Create Ride Request ─────────────────────────────────────────────────
export const createRide = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const riderId = req.user!._id;
    const {
      pickup,
      drop,
      stops = [],
      category = 'go',
      vehicleType,
      fare,
      fareBreakdown,
      distance = 0,
      duration = 0,
      scheduledFor = null,
      driverInfo,
      driverId,
      paymentMethod = 'upi',
      status,
    } = req.body;

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
      stops: Array.isArray(stops) ? stops : [],
      category: category || 'go',
      vehicleType: vehicleType || 'Sedan',
      driverId: driverId || null,
      fare,
      fareBreakdown: fareBreakdown || {},
      distance,
      duration,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      otp,
      status: rideStatus,
      driverInfo: driverInfo || null,
      paymentMethod,
      paymentStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      data: {
        ride,
        otp,
        driverInfo: driverInfo || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 4. Verify OTP to Start Trip ────────────────────────────────────────────
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

    if (ride.otp !== otp.toString().trim()) {
      return next(new AppError('Incorrect OTP. Please enter the valid 4-digit code displayed on screen.', 400));
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

// ─── 5. Update Ride Status (Supports all state machine steps) ────────────────
export const updateRideStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, cancellationFee, updatedDrop, updatedFare } = req.body;

    const validStates = [
      'requested',
      'searching',
      'searching_driver',
      'accepted',
      'driver_assigned',
      'driver_arriving',
      'arriving',
      'driver_arrived',
      'arrived',
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

    ride.status = status as any;
    if (paymentStatus) {
      ride.paymentStatus = paymentStatus;
    }

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

// ─── 6. Rate Driver & Submit Review/Tip/Feedback ────────────────────────────
export const rateRide = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { rating, feedbackTags = [], feedbackComment = '', comment, tip } = req.body;

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return next(new AppError('Rating must be a number between 1 and 5.', 400));
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return next(new AppError('Ride not found.', 404));
    }

    ride.rating = numRating;
    ride.feedbackTags = feedbackTags;
    ride.feedbackComment = feedbackComment;
    if (comment) ride.comment = comment;
    if (tip !== undefined) ride.tip = tip;

    await ride.save();

    // Recalculate average rating for the driver if driverId is set
    if (ride.driverId) {
      const driver = await Driver.findById(ride.driverId);
      if (driver) {
        const completedRides = await Ride.find({ driverId: driver._id, rating: { $ne: null } });
        const totalRatingSum = completedRides.reduce((sum, r) => sum + (r.rating || 5), 0);
        const newAvg = completedRides.length > 0 
          ? parseFloat((totalRatingSum / completedRides.length).toFixed(1)) 
          : numRating;
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

// ─── 7. Cancel Ride with Cancellation Fee Logic ─────────────────────────────
export const cancelRide = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer cancelled' } = req.body;

    const ride = await Ride.findById(id);
    if (!ride) {
      return next(new AppError('Ride not found.', 404));
    }

    // Cancellation fee applies only if driver was assigned / en-route / arrived
    let fee = 0;
    if (['driver_assigned', 'arriving', 'arrived'].includes(ride.status)) {
      fee = 50; // Standard cancellation fee of ₹50
    }

    ride.status = 'cancelled';
    ride.cancellationFee = fee;
    await ride.save();

    res.status(200).json({
      success: true,
      data: {
        ride,
        cancellationFee: fee,
        reason,
      },
      message: fee > 0 ? `Ride cancelled. A fee of ₹${fee} was applied.` : 'Ride cancelled with no fee.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── 8. Get Current User's Ride History ─────────────────────────────────────
export const getMyRides = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const riderId = req.user!._id;
    const rides = await Ride.find({ riderId })
      .sort({ createdAt: -1 })
      .populate('driverId', 'rating experience licenseNumber');

    res.status(200).json({
      success: true,
      data: { rides },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 9. Get Single Ride Details ─────────────────────────────────────────────
export const getRideById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id).populate('driverId', 'rating experience licenseNumber');

    if (!ride) {
      return next(new AppError('Ride not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { ride },
    });
  } catch (error) {
    next(error);
  }
};
