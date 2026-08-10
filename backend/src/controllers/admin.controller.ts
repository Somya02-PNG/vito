import { Request, Response, NextFunction } from 'express';
import User from '../models/User.model';
import Driver from '../models/Driver.model';
import RentalPartner from '../models/RentalPartner.model';
import Vehicle from '../models/Vehicle.model';
import Rental from '../models/Rental.model';
import Ride from '../models/Ride.model';
import DriverHire from '../models/DriverHire.model';
import Payment from '../models/Payment.model';
import EmergencyContact from '../models/EmergencyContact.model';
import { AppError } from '../middleware/error.middleware';

// ─── 1. Get Admin Stats & Real MongoDB Aggregations ────────────────────────
export const getAdminStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      // Users breakdown
      totalUsers,
      totalCustomers,
      totalDriversCount,
      totalPartnersCount,
      totalAdminsCount,
      activeUsersCount,
      suspendedUsersCount,
      blockedUsersCount,
      pendingUsersCount,

      // Driver profiles breakdown
      totalDriverProfiles,
      verifiedDriversCount,
      pendingDriversCount,
      rejectedDriversCount,
      onlineDriversCount,

      // Rental partner profiles breakdown
      totalPartnerProfiles,
      verifiedPartnersCount,
      pendingPartnersCount,

      // Vehicles breakdown
      totalVehicles,
      availableVehiclesCount,
      currentlyRentedVehiclesCount,

      // Rides breakdown
      activeRidesCount,
      requestedRidesCount,
      completedRidesCount,
      cancelledRidesCount,

      // Rentals breakdown
      activeRentalsCount,
      pendingRentalsCount,
      confirmedRentalsCount,
      completedRentalsCount,
      cancelledRentalsCount,

      // Driver hires breakdown
      pendingHiresCount,
      confirmedHiresCount,
      inProgressHiresCount,
      completedHiresCount,
      cancelledHiresCount,

      // Safety
      totalEmergencyContacts,

      // Financial Aggregation
      financialAgg,
    ] = await Promise.all([
      // Users
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ $or: [{ role: 'driver' }, { role: 'partner', partnerType: 'driver' }] }),
      User.countDocuments({ role: 'partner', partnerType: 'rental_partner' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'blocked' }),
      User.countDocuments({ status: 'pending' }),

      // Driver profiles
      Driver.countDocuments(),
      Driver.countDocuments({ verificationStatus: 'verified' }),
      Driver.countDocuments({ verificationStatus: 'pending' }),
      Driver.countDocuments({ verificationStatus: 'rejected' }),
      Driver.countDocuments({ availability: true }),

      // Rental partner profiles
      RentalPartner.countDocuments(),
      RentalPartner.countDocuments({ verificationStatus: 'verified' }),
      RentalPartner.countDocuments({ verificationStatus: 'pending' }),

      // Vehicles
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ deliveryAvailable: true }),
      Rental.countDocuments({ status: { $in: ['active', 'confirmed'] } }),

      // Rides
      Ride.countDocuments({ status: { $in: ['accepted', 'arriving', 'in_progress'] } }),
      Ride.countDocuments({ status: 'requested' }),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'cancelled' }),

      // Rentals
      Rental.countDocuments({ status: 'active' }),
      Rental.countDocuments({ status: 'pending' }),
      Rental.countDocuments({ status: 'confirmed' }),
      Rental.countDocuments({ status: 'completed' }),
      Rental.countDocuments({ status: 'cancelled' }),

      // Driver Hires
      DriverHire.countDocuments({ status: 'pending' }),
      DriverHire.countDocuments({ status: 'confirmed' }),
      DriverHire.countDocuments({ status: 'in_progress' }),
      DriverHire.countDocuments({ status: 'completed' }),
      DriverHire.countDocuments({ status: 'cancelled' }),

      // Safety
      EmergencyContact.countDocuments(),

      // Financial aggregation on completed payments
      Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: null,
            totalCompletedTxns: { $sum: 1 },
            totalGrossRevenue: { $sum: '$totalFare' },
            totalPlatformCommission: { $sum: '$platformCommission' },
            totalDriverPayouts: { $sum: '$driverPayout' },
          },
        },
      ]),
    ]);

    const fin = financialAgg[0] || {
      totalCompletedTxns: 0,
      totalGrossRevenue: 0,
      totalPlatformCommission: 0,
      totalDriverPayouts: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        users: {
          totalUsers,
          totalCustomers,
          totalDrivers: totalDriversCount,
          totalRentalPartners: totalPartnersCount,
          totalAdmins: totalAdminsCount,
          activeUsers: activeUsersCount,
          suspendedUsers: suspendedUsersCount,
          blockedUsers: blockedUsersCount,
          pendingUsers: pendingUsersCount,
        },
        drivers: {
          totalDrivers: totalDriverProfiles,
          verifiedDrivers: verifiedDriversCount,
          pendingVerification: pendingDriversCount,
          rejectedDrivers: rejectedDriversCount,
          onlineDrivers: onlineDriversCount,
        },
        partners: {
          totalPartners: totalPartnerProfiles,
          verifiedPartners: verifiedPartnersCount,
          pendingPartners: pendingPartnersCount,
        },
        vehicles: {
          totalVehicles,
          availableVehicles: availableVehiclesCount,
          currentlyRented: currentlyRentedVehiclesCount,
          limitationNote: 'Vehicle schema uses deliveryAvailable for availability; verificationStatus is not present on Vehicle schema.',
        },
        operations: {
          rides: {
            active: activeRidesCount,
            requested: requestedRidesCount,
            completed: completedRidesCount,
            cancelled: cancelledRidesCount,
          },
          rentals: {
            active: activeRentalsCount,
            pending: pendingRentalsCount,
            confirmed: confirmedRentalsCount,
            completed: completedRentalsCount,
            cancelled: cancelledRentalsCount,
          },
          driverHires: {
            pending: pendingHiresCount,
            confirmed: confirmedHiresCount,
            inProgress: inProgressHiresCount,
            completed: completedHiresCount,
            cancelled: cancelledHiresCount,
          },
        },
        financial: {
          totalCompletedTxns: fin.totalCompletedTxns,
          totalGrossRevenue: fin.totalGrossRevenue,
          platformCommission: fin.totalPlatformCommission,
          driverPayouts: fin.totalDriverPayouts,
        },
        safety: {
          activeSOSAlerts: 0,
          sosPersistedNote: 'Active SOS triggers execute in-memory alerts to emergency contacts; historical SOS records are not stored in a separate collection.',
          totalEmergencyContacts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 2. Get Recent Activity Feed ────────────────────────────────────────────
export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = 20;

    const [
      recentUsers,
      recentDrivers,
      recentPartners,
      recentVehicles,
      recentRides,
      recentRentals,
      recentHires,
      recentPayments,
    ] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role status createdAt').lean(),
      Driver.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email').lean(),
      RentalPartner.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email').lean(),
      Vehicle.find().sort({ createdAt: -1 }).limit(5).select('category pricePerDay createdAt').lean(),
      Ride.find().sort({ createdAt: -1 }).limit(5).populate('riderId', 'name').select('status fare createdAt').lean(),
      Rental.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name').select('status depositAmount createdAt').lean(),
      DriverHire.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name').select('driverName totalFare status createdAt').lean(),
      Payment.find().sort({ createdAt: -1 }).limit(5).populate('payerId', 'name').select('transactionRef bookingType totalFare paymentStatus createdAt').lean(),
    ]);

    const activityItems: any[] = [];

    recentUsers.forEach((u: any) => {
      activityItems.push({
        id: `usr_${u._id}`,
        eventType: u.role === 'customer' ? 'Customer Registration' : `${u.role.toUpperCase()} User Registration`,
        entity: 'User',
        userName: u.name,
        userEmail: u.email,
        recordId: u._id.toString(),
        status: u.status,
        timestamp: u.createdAt,
        badgeColor: 'blue',
      });
    });

    recentDrivers.forEach((d: any) => {
      activityItems.push({
        id: `drv_${d._id}`,
        eventType: 'Driver Partner Application',
        entity: 'Driver',
        userName: d.userId?.name || 'Driver Partner',
        userEmail: d.userId?.email || '',
        recordId: d._id.toString(),
        status: d.verificationStatus,
        timestamp: d.createdAt,
        badgeColor: 'cyan',
      });
    });

    recentPartners.forEach((p: any) => {
      activityItems.push({
        id: `prt_${p._id}`,
        eventType: 'Rental Partner Application',
        entity: 'RentalPartner',
        userName: p.userId?.name || 'Rental Partner',
        userEmail: p.userId?.email || '',
        recordId: p._id.toString(),
        status: p.verificationStatus,
        timestamp: p.createdAt,
        badgeColor: 'teal',
      });
    });

    recentVehicles.forEach((v: any) => {
      activityItems.push({
        id: `veh_${v._id}`,
        eventType: 'New Vehicle Listed',
        entity: 'Vehicle',
        userName: `${v.category.toUpperCase()} (₹${v.pricePerDay}/day)`,
        userEmail: '',
        recordId: v._id.toString(),
        status: 'Available',
        timestamp: v.createdAt,
        badgeColor: 'emerald',
      });
    });

    recentRides.forEach((r: any) => {
      activityItems.push({
        id: `rde_${r._id}`,
        eventType: 'Cab Ride Booking',
        entity: 'Ride',
        userName: r.riderId?.name || 'Rider',
        userEmail: `₹${r.fare}`,
        recordId: r._id.toString(),
        status: r.status,
        timestamp: r.createdAt,
        badgeColor: 'indigo',
      });
    });

    recentRentals.forEach((r: any) => {
      activityItems.push({
        id: `rnt_${r._id}`,
        eventType: 'Self-Drive Rental',
        entity: 'Rental',
        userName: r.userId?.name || 'Customer',
        userEmail: `Deposit: ₹${r.depositAmount}`,
        recordId: r._id.toString(),
        status: r.status,
        timestamp: r.createdAt,
        badgeColor: 'amber',
      });
    });

    recentHires.forEach((h: any) => {
      activityItems.push({
        id: `hir_${h._id}`,
        eventType: 'Driver Hire Booking',
        entity: 'DriverHire',
        userName: `${h.userId?.name || 'Customer'} hired ${h.driverName}`,
        userEmail: `Fare: ₹${h.totalFare}`,
        recordId: h._id.toString(),
        status: h.status,
        timestamp: h.createdAt,
        badgeColor: 'violet',
      });
    });

    recentPayments.forEach((p: any) => {
      activityItems.push({
        id: `pay_${p._id}`,
        eventType: `Payment (${p.transactionRef})`,
        entity: 'Payment',
        userName: p.payerId?.name || 'Payer',
        userEmail: `₹${p.totalFare} (${p.bookingType})`,
        recordId: p._id.toString(),
        status: p.paymentStatus,
        timestamp: p.createdAt,
        badgeColor: 'green',
      });
    });

    // Sort descending by timestamp
    activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json({
      success: true,
      data: {
        activity: activityItems.slice(0, limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 3. Get Admin Users Directory ───────────────────────────────────────────
export const getAdminUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role, status, search } = req.query;

    const filter: Record<string, any> = {};

    if (role && role !== 'all') {
      filter.role = role;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 4. Update User Status (Activate / Suspend / Block) ────────────────────
export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'pending', 'suspended', 'blocked'];
    if (!status || !validStatuses.includes(status)) {
      return next(new AppError(`Valid status required: ${validStatuses.join(', ')}.`, 400));
    }

    // Prevent admin from suspending/blocking themselves
    if (req.user && req.user._id.toString() === id) {
      return next(new AppError('You cannot change your own administrator account status.', 400));
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    // Also update associated Driver or RentalPartner verification status if appropriate
    if (status === 'suspended' || status === 'blocked') {
      await Driver.findOneAndUpdate({ userId: id }, { verificationStatus: 'suspended' }).catch(() => {});
      await RentalPartner.findOneAndUpdate({ userId: id }, { verificationStatus: 'suspended' }).catch(() => {});
    } else if (status === 'active') {
      await Driver.findOneAndUpdate({ userId: id, verificationStatus: 'suspended' }, { verificationStatus: 'verified' }).catch(() => {});
      await RentalPartner.findOneAndUpdate({ userId: id, verificationStatus: 'suspended' }, { verificationStatus: 'verified' }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: `User ${user.name} status updated to ${status.toUpperCase()}.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── 5. Get Admin Drivers List ──────────────────────────────────────────────
export const getAdminDrivers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, search } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== 'all') {
      filter.verificationStatus = status;
    }

    let drivers = await Driver.find(filter)
      .populate('userId', 'name email phone status role')
      .sort({ createdAt: -1 })
      .lean();

    // Client/Server search filter over populated fields
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      drivers = drivers.filter((d: any) => {
        const name = d.userId?.name?.toLowerCase() || '';
        const email = d.userId?.email?.toLowerCase() || '';
        const phone = d.userId?.phone?.toLowerCase() || '';
        const license = d.licenseNumber?.toLowerCase() || '';
        const city = d.city?.toLowerCase() || '';
        return name.includes(q) || email.includes(q) || phone.includes(q) || license.includes(q) || city.includes(q);
      });
    }

    const formatted = drivers.map((d: any) => ({
      _id: d._id,
      userId: d.userId?._id,
      name: d.userId?.name || 'Driver Partner',
      email: d.userId?.email || '',
      phone: d.userId?.phone || '',
      userStatus: d.userId?.status || 'active',
      licenseNumber: d.licenseNumber,
      experience: d.experience,
      hourlyRate: d.hourlyRate,
      city: d.city || '',
      profileImage: d.profileImage || '',
      verificationStatus: d.verificationStatus,
      rating: d.rating || 0,
      availability: d.availability ?? true,
      walletBalance: d.walletBalance || 0,
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

// ─── 6. Approve / Reject / Suspend Driver Verification ──────────────────────
export const verifyDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['verified', 'rejected', 'suspended', 'pending'].includes(status)) {
      return next(new AppError('Valid status ("verified", "rejected", "suspended", "pending") is required.', 400));
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return next(new AppError('Driver record not found.', 404));
    }

    driver.verificationStatus = status;
    await driver.save();

    // Sync user status
    if (status === 'verified') {
      await User.findByIdAndUpdate(driver.userId, { status: 'active' });
    } else if (status === 'suspended') {
      await User.findByIdAndUpdate(driver.userId, { status: 'suspended' });
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

// ─── 7. Get Admin Rental Partners List ──────────────────────────────────────
export const getAdminPartners = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, search } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== 'all') {
      filter.verificationStatus = status;
    }

    let partners = await RentalPartner.find(filter)
      .populate('userId', 'name email phone status')
      .sort({ createdAt: -1 })
      .lean();

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      partners = partners.filter((p: any) => {
        const name = p.userId?.name?.toLowerCase() || '';
        const business = p.businessName?.toLowerCase() || '';
        const email = p.userId?.email?.toLowerCase() || '';
        const phone = p.userId?.phone?.toLowerCase() || '';
        const city = p.city?.toLowerCase() || '';
        return name.includes(q) || business.includes(q) || email.includes(q) || phone.includes(q) || city.includes(q);
      });
    }

    const formatted = partners.map((p: any) => ({
      _id: p._id,
      userId: p.userId?._id,
      name: p.userId?.name || 'Rental Partner',
      businessName: p.businessName || 'Business Host',
      email: p.userId?.email || '',
      phone: p.userId?.phone || '',
      userStatus: p.userId?.status || 'active',
      city: p.city || '',
      fleetCount: p.fleetCount || 0,
      profileImage: p.profileImage || '',
      verificationStatus: p.verificationStatus,
      walletBalance: p.walletBalance || 0,
      createdAt: p.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { partners: formatted },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 8. Verify / Reject / Suspend Rental Partner ───────────────────────────
export const verifyRentalPartner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['verified', 'rejected', 'suspended', 'pending'].includes(status)) {
      return next(new AppError('Valid status ("verified", "rejected", "suspended", "pending") is required.', 400));
    }

    const partner = await RentalPartner.findById(id);
    if (!partner) {
      return next(new AppError('Rental partner record not found.', 404));
    }

    partner.verificationStatus = status;
    await partner.save();

    if (status === 'verified') {
      await User.findByIdAndUpdate(partner.userId, { status: 'active' });
    } else if (status === 'suspended') {
      await User.findByIdAndUpdate(partner.userId, { status: 'suspended' });
    }

    res.status(200).json({
      success: true,
      data: { id, status },
      message: `Rental partner verification status updated to ${status.toUpperCase()}.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── 9. Get Admin Vehicles Fleet ───────────────────────────────────────────
export const getAdminVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, fuelType, transmission, search } = req.query;
    const filter: Record<string, any> = {};

    if (category && category !== 'all') filter.category = category;
    if (fuelType && fuelType !== 'all') filter.fuelType = fuelType;
    if (transmission && transmission !== 'all') filter.transmission = transmission;

    let vehicles = await Vehicle.find(filter)
      .populate('ownerId', 'name email phone role')
      .sort({ createdAt: -1 })
      .lean();

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      vehicles = vehicles.filter((v: any) => {
        const cat = v.category?.toLowerCase() || '';
        const fuel = v.fuelType?.toLowerCase() || '';
        const owner = v.ownerId?.name?.toLowerCase() || '';
        return cat.includes(q) || fuel.includes(q) || owner.includes(q);
      });
    }

    res.status(200).json({
      success: true,
      data: { vehicles },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 10. Get Admin Operations (Rides, Rentals, Driver Hires) ───────────────
export const getAdminOperations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type = 'all', status = 'all' } = req.query;

    const rideFilter: Record<string, any> = {};
    const rentalFilter: Record<string, any> = {};
    const hireFilter: Record<string, any> = {};

    if (status && status !== 'all') {
      rideFilter.status = status;
      rentalFilter.status = status;
      hireFilter.status = status;
    }

    let rides: any[] = [];
    let rentals: any[] = [];
    let hires: any[] = [];

    if (type === 'all' || type === 'rides') {
      rides = await Ride.find(rideFilter)
        .populate('riderId', 'name email phone')
        .populate('driverId')
        .sort({ createdAt: -1 })
        .lean();
    }

    if (type === 'all' || type === 'rentals') {
      rentals = await Rental.find(rentalFilter)
        .populate('userId', 'name email phone')
        .populate('vehicleId', 'category pricePerDay fuelType')
        .sort({ createdAt: -1 })
        .lean();
    }

    if (type === 'all' || type === 'hires') {
      hires = await DriverHire.find(hireFilter)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        rides,
        rentals,
        hires,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 11. Get Admin Payments Ledger ─────────────────────────────────────────
export const getAdminPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookingType, paymentMethod, paymentStatus, search } = req.query;
    const filter: Record<string, any> = {};

    if (bookingType && bookingType !== 'all') filter.bookingType = bookingType;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    let payments = await Payment.find(filter)
      .populate('payerId', 'name email phone')
      .populate('driverId')
      .sort({ createdAt: -1 })
      .lean();

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      payments = payments.filter((p: any) => {
        const ref = p.transactionRef?.toLowerCase() || '';
        const bookingId = p.bookingId?.toLowerCase() || '';
        const payer = p.payerId?.name?.toLowerCase() || '';
        return ref.includes(q) || bookingId.includes(q) || payer.includes(q);
      });
    }

    res.status(200).json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 12. Get Admin Safety & Contacts Summary ────────────────────────────────
export const getAdminSafety = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contacts = await EmergencyContact.find()
      .populate('userId', 'name email phone status')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        contacts,
        sosNote: 'Active SOS triggers dispatch in-memory emergency alerts to contacts and control room. Dedicated historical SOS log collection is not implemented in current schema.',
      },
    });
  } catch (error) {
    next(error);
  }
};
