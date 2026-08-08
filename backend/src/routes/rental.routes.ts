import { Router } from 'express';
import { createRental } from '../controllers/rental.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post('/rentals', protect, createRental);

export default router;
