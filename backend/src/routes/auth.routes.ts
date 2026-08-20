import { Router } from 'express';
import {
  signup,
  login,
  demoLogin,
  getMe,
  logout,
  updateProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/security.middleware';

const router = Router();

// ─── Public routes with Anti-Brute-Force Rate Limiting Wall ──────────────────
// # HINGLISH: Login aur Signup endpoints par 15 minute ke window me max 15 attempts allowed hain
router.post('/auth/signup', authRateLimiter(15, 15 * 60 * 1000), signup);
router.post('/auth/login', authRateLimiter(10, 15 * 60 * 1000), login);
router.post('/auth/demo-login', demoLogin);
router.post('/auth/forgot-password', authRateLimiter(5, 15 * 60 * 1000), forgotPassword);
router.post('/auth/reset-password', authRateLimiter(5, 15 * 60 * 1000), resetPassword);

// ─── Protected routes (Requires valid JWT session) ───────────────────────────
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);
router.post('/auth/logout', protect, logout);

export default router;
