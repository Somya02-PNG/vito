import { Request, Response, NextFunction } from 'express';
import Driver from '../models/Driver.model';
import { AppError } from '../middleware/error.middleware';

// Mock incoming ride/hire requests feed
const MOCK_INCOMING_REQUESTS = [
  {
    id: 'req_101',
    type: 'cab',
    riderName: 'Priya Sharma',
    riderPhone: '+91 98765 11111',
    pickup: 'Connaught Place, New Delhi',
    drop: 'Indira Gandhi Airport T3',
    distanceKm: 14.2,
    estMins: 28,
    fare: 420,
    timeAgo: '1 min ago',
  },
  {
    id: 'req_102',
    type: 'driver_hire',
    riderName: 'Alex Mercer',
    riderPhone: '+91 98123 22222',
    pickup: 'Cyber City, Gurugram',
    drop: 'Outstation Day Trip',
    hours: 6,
    fare: 1080,
    timeAgo: '3 mins ago',
  },
  {
    id: 'req_103',
    type: 'cab',
    riderName: 'Rahul Verma',
    riderPhone: '+91 97111 33333',
    pickup: 'Select CITYWALK, Saket',
    drop: 'Hauz Khas Village',
    distanceKm: 5.8,
    estMins: 14,
    fare: 180,
    timeAgo: '5 mins ago',
  },
];

// Mock payout history logs
const MOCK_PAYOUTS_LOG = [
  {
    id: 'tx_991',
    date: 'Yesterday, 06:30 PM',
    bankAccount: 'HDFC Bank **** 4892',
    amount: 3500,
    status: 'completed',
  },
  {
    id: 'tx_990',
    date: '04 Aug 2026',
    bankAccount: 'UPI / ramesh@okaxis',
    amount: 5000,
    status: 'completed',
  },
];

// ─── Get Driver Dashboard Data ──────────────────────────────────────────────
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;

    let driver = await Driver.findOne({ userId }).lean();

    // Auto-create a mock driver profile if not found
    if (!driver) {
      const created = await Driver.create({
        userId,
        licenseNumber: 'DL-04-2022-771891',
        experience: 8,
        verificationStatus: 'verified',
        rating: 4.9,
        hourlyRate: 180,
        availability: true,
        walletBalance: 12480,
      });
      driver = created.toObject();
    }

    res.status(200).json({
      success: true,
      data: {
        driver,
        stats: {
          todayEarnings: 2450,
          weeklyEarnings: 14800,
          tripsCompleted: 18,
          onlineHours: 6.5,
        },
        requests: MOCK_INCOMING_REQUESTS,
        payouts: MOCK_PAYOUTS_LOG,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Accept Incoming Request ────────────────────────────────────────────────
export const acceptRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const reqItem = MOCK_INCOMING_REQUESTS.find((r) => r.id === id) || MOCK_INCOMING_REQUESTS[0];

    res.status(200).json({
      success: true,
      data: {
        activeTrip: {
          ...reqItem,
          status: 'accepted',
          otp: '4829', // Mock OTP for driver to verify
        },
      },
      message: 'Request accepted! Proceed to pickup location.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reject Incoming Request ────────────────────────────────────────────────
export const rejectRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      message: `Request ${id} declined.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Withdraw Wallet Payout ─────────────────────────────────────────────────
export const withdrawWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const { amount, bankAccount } = req.body;

    const withdrawAmt = Number(amount);
    if (!withdrawAmt || withdrawAmt <= 0) {
      return next(new AppError('Please provide a valid withdrawal amount.', 400));
    }

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return next(new AppError('Driver record not found.', 404));
    }

    if (driver.walletBalance < withdrawAmt) {
      return next(new AppError('Insufficient wallet balance.', 400));
    }

    driver.walletBalance -= withdrawAmt;
    await driver.save();

    const newPayoutLog = {
      id: `tx_${Date.now()}`,
      date: 'Just now',
      bankAccount: bankAccount || 'HDFC Bank **** 4892',
      amount: withdrawAmt,
      status: 'completed',
    };

    res.status(200).json({
      success: true,
      data: {
        walletBalance: driver.walletBalance,
        payout: newPayoutLog,
      },
      message: `₹${withdrawAmt.toLocaleString('en-IN')} successfully transferred to ${bankAccount || 'your bank account'}.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Toggle Online / Offline Availability ────────────────────────────────────
export const toggleAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!._id;
    const driver = await Driver.findOne({ userId });

    if (!driver) {
      return next(new AppError('Driver profile not found.', 404));
    }

    driver.availability = !driver.availability;
    await driver.save();

    res.status(200).json({
      success: true,
      data: { availability: driver.availability },
      message: `Driver status is now ${driver.availability ? 'ONLINE' : 'OFFLINE'}.`,
    });
  } catch (error) {
    next(error);
  }
};
