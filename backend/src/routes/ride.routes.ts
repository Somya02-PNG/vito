import { Router } from 'express';
<<<<<<< HEAD
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
} from '../controllers/ride.controller';
=======
import { createRide, verifyOTP, updateRideStatus, getNearbyDrivers, rateRide } from '../controllers/ride.controller';
>>>>>>> somya
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Pricing & Available Drivers
router.post('/rides/estimate', estimateFare);
router.get('/rides/available-drivers', getAvailableDrivers);

// Protected routes
<<<<<<< HEAD
router.get('/rides/my', protect, getMyRides);
=======
router.get('/rides/nearby-drivers', protect, getNearbyDrivers);
>>>>>>> somya
router.post('/rides', protect, createRide);
router.get('/rides/:id', protect, getRideById);
router.post('/rides/:id/verify-otp', protect, verifyOTP);
router.patch('/rides/:id/status', protect, updateRideStatus);
router.post('/rides/:id/rate', protect, rateRide);
<<<<<<< HEAD
router.post('/rides/:id/cancel', protect, cancelRide);
=======
>>>>>>> somya

export default router;

