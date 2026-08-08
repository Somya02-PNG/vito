import { Router } from 'express';
import { createRide, verifyOTP, updateRideStatus } from '../controllers/ride.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post('/rides', protect, createRide);
router.post('/rides/:id/verify-otp', protect, verifyOTP);
router.patch('/rides/:id/status', protect, updateRideStatus);

export default router;
