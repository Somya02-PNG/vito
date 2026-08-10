import { Router } from 'express';
import {
  getAdminStats,
  getRecentActivity,
  getAdminUsers,
  getAdminDrivers,
  getAdminPartners,
  getAdminVehicles,
  getAdminOperations,
  getAdminPayments,
  getAdminSafety,
  verifyDriver,
  verifyRentalPartner,
  updateUserStatus,
} from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// ─── All admin routes require: authenticated + admin role ─────────────────────
router.get('/admin/stats', protect, authorize('admin'), getAdminStats);
router.get('/admin/activity', protect, authorize('admin'), getRecentActivity);
router.get('/admin/users', protect, authorize('admin'), getAdminUsers);
router.patch('/admin/users/:id/status', protect, authorize('admin'), updateUserStatus);
router.get('/admin/drivers', protect, authorize('admin'), getAdminDrivers);
router.patch('/admin/drivers/:id/verify', protect, authorize('admin'), verifyDriver);
router.get('/admin/partners', protect, authorize('admin'), getAdminPartners);
router.patch('/admin/partners/:id/verify', protect, authorize('admin'), verifyRentalPartner);
router.get('/admin/vehicles', protect, authorize('admin'), getAdminVehicles);
router.get('/admin/operations', protect, authorize('admin'), getAdminOperations);
router.get('/admin/payments', protect, authorize('admin'), getAdminPayments);
router.get('/admin/safety', protect, authorize('admin'), getAdminSafety);

export default router;
