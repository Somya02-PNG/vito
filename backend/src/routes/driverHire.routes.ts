import { Router } from 'express';
import {
  searchAndMatchDrivers,
  estimateHirePrice,
  requestDriverHire,
  getHireStatusById,
  respondToHireRequest,
  verifyServicePin,
  addExtraHours,
  completeHireService,
  rateDriverHire,
  cancelHireBooking,
  getMyDriverHires,
  getDriverAssignedHires,
  getAvailableDrivers,
  calculateFareEndpoint,
  createDriverHire,
  updateHireStatus,
} from '../controllers/driverHire.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Pricing and Search
router.post('/match-drivers', protect, searchAndMatchDrivers);
router.post('/estimate', protect, estimateHirePrice);

// Bookings & Lifecycle
router.post('/request', protect, requestDriverHire);
router.get('/my-hires', protect, getMyDriverHires);
router.get('/driver-hires', protect, getDriverAssignedHires);
router.get('/:id/status', protect, getHireStatusById);
router.get('/:id', protect, getHireStatusById);
router.post('/:id/respond', protect, respondToHireRequest);
router.post('/:id/verify-pin', protect, verifyServicePin);
router.post('/:id/extra-hours', protect, addExtraHours);
router.post('/:id/complete', protect, completeHireService);
router.post('/:id/rate', protect, rateDriverHire);
router.post('/:id/cancel', protect, cancelHireBooking);

// Legacy backwards compatibility routes
router.get('/drivers/hire', protect, getAvailableDrivers);
router.post('/drivers/calculate-fare', protect, calculateFareEndpoint);
router.post('/drivers/hire', protect, createDriverHire);
router.patch('/drivers/hire/:id/status', protect, updateHireStatus);

export default router;
