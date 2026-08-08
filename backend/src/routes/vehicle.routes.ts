import { Router } from 'express';
import { getVehicles, getVehicleById } from '../controllers/vehicle.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.get('/vehicles', protect, getVehicles);
router.get('/vehicles/:id', protect, getVehicleById);

export default router;
