import { Router } from 'express';
import {
  signup,
  login,
  getMe,
  logout,
  updateProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);
router.post('/auth/logout', protect, logout);

export default router;
