import { Request, Response, NextFunction } from 'express';
import Payment from '../models/Payment.model';
import Driver from '../models/Driver.model';
import Ride from '../models/Ride.model';
import Rental from '../models/Rental.model';
import DriverHire from '../models/DriverHire.model';
import { AppError } from '../middleware/error.middleware';

// ─── Process Payment & Commission Split ─────────────────────────────────────
export const processPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payerId = req.user!._id;
    const {
      bookingId,
      bookingType,
      totalFare,
      paymentMethod,
      commissionPct = 18,
      driverId,
    } = req.body;

    const fare = Number(totalFare);
    if (!bookingId || !bookingType || !fare || fare <= 0) {
      return next(new AppError('bookingId, bookingType, and valid totalFare are required.', 400));
    }

    // Commission Engine
    const pctRate = Number(commissionPct) / 100;
    const platformCommission = Math.round(fare * pctRate);
    const driverPayout = fare - platformCommission;

    const transactionRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Payment Record
    const payment = await Payment.create({
      bookingId,
      bookingType,
      payerId,
      driverId: driverId || null,
      totalFare: fare,
      commissionRate: pctRate,
      platformCommission,
      driverPayout,
      paymentMethod: paymentMethod || 'upi',
      paymentStatus: 'completed',
      transactionRef,
    });

    // Credit remaining 82% payout to driver's in-app wallet
    let driverWalletBalance = null;
    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (driver) {
        driver.walletBalance = (driver.walletBalance || 0) + driverPayout;
        await driver.save();
        driverWalletBalance = driver.walletBalance;
      }
    } else {
      // Credit first available active driver or user's driver profile
      const driver = await Driver.findOne({ userId: payerId });
      if (driver) {
        driver.walletBalance = (driver.walletBalance || 0) + driverPayout;
        await driver.save();
        driverWalletBalance = driver.walletBalance;
      }
    }

    // Update status in corresponding booking model
    if (bookingType === 'cab') {
      await Ride.findByIdAndUpdate(bookingId, { status: 'completed' }).catch(() => {});
    } else if (bookingType === 'rental') {
      await Rental.findByIdAndUpdate(bookingId, { status: 'completed', depositStatus: 'paid' }).catch(() => {});
    } else if (bookingType === 'driver_hire') {
      await DriverHire.findByIdAndUpdate(bookingId, { status: 'completed' }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      data: {
        payment,
        receipt: {
          transactionRef,
          totalFare: fare,
          commissionPct: `${commissionPct}%`,
          platformCommission,
          driverPayout,
          paymentMethod: paymentMethod || 'upi',
          paymentStatus: 'completed',
          updatedWalletBalance: driverWalletBalance,
        },
      },
      message: 'Payment processed successfully! Commission deducted & driver credited.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Payment Receipt ───────────────────────────────────────────────────
export const getPaymentReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).lean();

    if (!payment) {
      return next(new AppError('Payment transaction not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};
