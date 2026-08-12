import { Router } from 'express';
import {
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerDashboard,
} from '../controllers/partner.controller';
import { protect, authorize, authorizePartnerType } from '../middleware/auth.middleware';

const router = Router();

// ─── Partner routes require: authenticated + rental_partner partnerType ───────────
router.get('/partner/profile', protect, authorize('partner', 'driver'), getPartnerProfile);
router.put('/partner/profile', protect, authorize('partner', 'driver'), updatePartnerProfile);
router.get('/partner/dashboard', protect, authorize('partner'), authorizePartnerType('rental_partner'), getPartnerDashboard);

export default router;
