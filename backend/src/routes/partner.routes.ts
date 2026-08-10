import { Router } from 'express';
import { getPartnerProfile, updatePartnerProfile } from '../controllers/partner.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// ─── Partner routes require: authenticated + partner OR driver role ────────────
router.get('/partner/profile', protect, authorize('partner', 'driver'), getPartnerProfile);
router.put('/partner/profile', protect, authorize('partner', 'driver'), updatePartnerProfile);

export default router;
