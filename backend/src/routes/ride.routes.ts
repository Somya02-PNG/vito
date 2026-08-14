import { Router } from 'express';
import { createRide, verifyOTP, updateRideStatus, getNearbyDrivers, rateRide } from '../controllers/ride.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.get('/rides/nearby-drivers', protect, getNearbyDrivers);
router.post('/rides', protect, createRide);
router.post('/rides/:id/verify-otp', protect, verifyOTP);
router.patch('/rides/:id/status', protect, updateRideStatus);
router.post('/rides/:id/rate', protect, rateRide);

export default router;

