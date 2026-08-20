import { Router } from 'express';
import {
  createRide,
  verifyOTP,
  updateRideStatus,
  estimateFare,
  getAvailableDrivers,
  getMyRides,
  getRideById,
  rateRide,
  cancelRide,
  getNearbyDrivers,
} from '../controllers/ride.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Pricing & Available Drivers
router.post('/rides/estimate', estimateFare);
router.post('/routes/estimate', estimateFare);
router.get('/rides/available-drivers', getAvailableDrivers);

// Protected routes
router.get('/rides/my', protect, getMyRides);
router.get('/rides/nearby-drivers', protect, getNearbyDrivers);
router.post('/rides', protect, createRide);
router.get('/rides/:id', protect, getRideById);
router.post('/rides/:id/verify-otp', protect, verifyOTP);
router.patch('/rides/:id/status', protect, updateRideStatus);
router.post('/rides/:id/rate', protect, rateRide);
router.post('/rides/:id/cancel', protect, cancelRide);

export default router;

