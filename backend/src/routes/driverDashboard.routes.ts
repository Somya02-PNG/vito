import { Router } from 'express';
import {
  getDashboardStats,
  acceptRequest,
  rejectRequest,
  withdrawWallet,
  toggleAvailability,
} from '../controllers/driverDashboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected Driver Dashboard routes
router.get('/driver/dashboard', protect, getDashboardStats);
router.post('/driver/requests/:id/accept', protect, acceptRequest);
router.post('/driver/requests/:id/reject', protect, rejectRequest);
router.post('/driver/wallet/withdraw', protect, withdrawWallet);
router.patch('/driver/toggle-availability', protect, toggleAvailability);

export default router;
