import { Request, Response, NextFunction } from 'express';
import Vehicle from '../models/Vehicle.model';
import { AppError } from '../middleware/error.middleware';

// ─── Get Vehicles (with query filters & pagination) ─────────────────────────
export const getVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      category,
      fuelType,
      transmission,
      seats,
      minPrice,
      maxPrice,
      deliveryAvailable,
      sort,
      page = '1',
      limit = '12',
    } = req.query;

    // Build filter object
    const filter: Record<string, any> = {};

    // Category — supports comma-separated values
    if (category && typeof category === 'string') {
      const categories = category.split(',').map((c) => c.trim().toLowerCase());
      filter.category = { $in: categories };
    }

    // Fuel type — supports comma-separated values
    if (fuelType && typeof fuelType === 'string') {
      const fuels = fuelType.split(',').map((f) => f.trim().toLowerCase());
      filter.fuelType = { $in: fuels };
    }

    // Transmission
    if (transmission && typeof transmission === 'string') {
      filter.transmission = transmission.toLowerCase();
    }

    // Minimum seats
    if (seats && typeof seats === 'string') {
      const seatNum = parseInt(seats, 10);
      if (!isNaN(seatNum)) {
        filter.seats = { $gte: seatNum };
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice && typeof minPrice === 'string') {
        const min = parseFloat(minPrice);
        if (!isNaN(min)) filter.pricePerDay.$gte = min;
      }
      if (maxPrice && typeof maxPrice === 'string') {
        const max = parseFloat(maxPrice);
        if (!isNaN(max)) filter.pricePerDay.$lte = max;
      }
      // Remove empty pricePerDay if no valid values
      if (Object.keys(filter.pricePerDay).length === 0) {
        delete filter.pricePerDay;
      }
    }

    // Home delivery filter
    if (deliveryAvailable === 'true') {
      filter.deliveryAvailable = true;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 }; // default: newest
    if (sort && typeof sort === 'string') {
      switch (sort) {
        case 'price_asc':
          sortOption = { pricePerDay: 1 };
          break;
        case 'price_desc':
          sortOption = { pricePerDay: -1 };
          break;
        case 'rating':
          sortOption = { rating: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    // Execute query
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Vehicle.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        total,
        page: pageNum,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Vehicle by ID ────────────────────────────────────────────────
export const getVehicleById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id)
      .populate('ownerId', 'name email phone createdAt')
      .lean();

    if (!vehicle) {
      return next(new AppError('Vehicle not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};
