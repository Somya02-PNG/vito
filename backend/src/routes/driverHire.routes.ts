import { Router } from 'express';
import {
  getAvailableDrivers,
  calculateFareEndpoint,
  createDriverHire,
  updateHireStatus,
} from '../controllers/driverHire.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.get('/drivers/hire', protect, getAvailableDrivers);
router.post('/drivers/calculate-fare', protect, calculateFareEndpoint);
router.post('/drivers/hire', protect, createDriverHire);
router.patch('/drivers/hire/:id/status', protect, updateHireStatus);

export default router;
