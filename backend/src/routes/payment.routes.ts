import { Router } from 'express';
import { processPayment, getPaymentReceipt } from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected payment routes
router.post('/payments/process', protect, processPayment);
router.get('/payments/:id', protect, getPaymentReceipt);

export default router;
