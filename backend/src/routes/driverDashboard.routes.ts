import { Router } from 'express';
import {
  getDashboardStats,
  acceptRequest,
  rejectRequest,
  withdrawWallet,
  toggleAvailability,
  updateLocation,
} from '../controllers/driverDashboard.controller';
import { protect, authorize, authorizePartnerType } from '../middleware/auth.middleware';

const router = Router();

// ─── All driver dashboard routes require: authenticated + driver partnerType ───────
router.get('/driver/dashboard', protect, authorize('partner', 'driver'), authorizePartnerType('driver'), getDashboardStats);
router.post('/driver/requests/:id/accept', protect, authorize('partner', 'driver'), authorizePartnerType('driver'), acceptRequest);
router.post('/driver/requests/:id/reject', protect, authorize('partner', 'driver'), authorizePartnerType('driver'), rejectRequest);
router.post('/driver/wallet/withdraw', protect, authorize('partner', 'driver'), authorizePartnerType('driver'), withdrawWallet);
router.patch('/driver/toggle-availability', protect, authorize('partner', 'driver'), authorizePartnerType('driver'), toggleAvailability);
router.patch('/driver/location', protect, updateLocation);

export default router;
