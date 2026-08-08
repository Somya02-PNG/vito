import { Router } from 'express';
import { signup, login, getMe, logout } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// Protected routes
router.get('/auth/me', protect, getMe);
router.post('/auth/logout', protect, logout);

export default router;
