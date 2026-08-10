import { Router } from 'express';
import {
  getDashboardStats,
  acceptRequest,
  rejectRequest,
  withdrawWallet,
  toggleAvailability,
} from '../controllers/driverDashboard.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// ─── All driver dashboard routes require: authenticated + partner OR driver role ─
// NOTE: 'driver' role included for backward compatibility with existing seeded users
router.get('/driver/dashboard', protect, authorize('partner', 'driver'), getDashboardStats);
router.post('/driver/requests/:id/accept', protect, authorize('partner', 'driver'), acceptRequest);
router.post('/driver/requests/:id/reject', protect, authorize('partner', 'driver'), rejectRequest);
router.post('/driver/wallet/withdraw', protect, authorize('partner', 'driver'), withdrawWallet);
router.patch('/driver/toggle-availability', protect, authorize('partner', 'driver'), toggleAvailability);

export default router;
