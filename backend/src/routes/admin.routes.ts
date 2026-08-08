import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  getAdminDrivers,
  verifyDriver,
  getAdminVehicles,
} from '../controllers/admin.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected admin routes
router.get('/admin/stats', protect, getAdminStats);
router.get('/admin/users', protect, getAdminUsers);
router.get('/admin/drivers', protect, getAdminDrivers);
router.patch('/admin/drivers/:id/verify', protect, verifyDriver);
router.get('/admin/vehicles', protect, getAdminVehicles);

export default router;
