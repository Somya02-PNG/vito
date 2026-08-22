import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';
import { AppError } from './error.middleware';

// Extend Express Request to include authenticated user object
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'vito_development_jwt_secret_key_12345_secure_entropy';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ AUTHENTICATION WALL: Protect (JWT Verification)
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH EXPLANATION:
 * Ye middleware check karta hai ki user ke paas valid cryptographic JWT token hai ya nahi.
 * 1. Sabse pehle httpOnly cookie 'vito_token' check hoti hai (Most Secure).
 * 2. Fallback me 'Authorization: Bearer <token>' header check hota hai (Mobile/API clients ke liye).
 * 3. Token verify hone ke baad user database me exist karta hai ya nahi aur active hai ya nahi ye verify hota hai.
 */
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.vito_token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // # HINGLISH: Agar koi token nahi mila toh 401 Unauthorized return karo
      return next(new AppError('Aap authenticated nahi hain. Kripya login karein.', 401));
    }

    // # HINGLISH: Token ki cryptographic signature verify karna
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    // # HINGLISH: Token ke userId se active user find karna
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('Is token se associated user account ab exist nahi karta.', 401));
    }

    // # HINGLISH: Agar user block ya suspend ho chuka hai toh request reject karo
    if (user.status === 'suspended' || user.status === 'blocked') {
      return next(new AppError('Aapka account deactivate/block kar diya gaya hai.', 403));
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token signature. Kripya dobara login karein.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Aapka session expire ho gaya hai. Kripya dobara login karein.', 401));
    }
    next(error);
  }
};

/**
 * Optional Auth middleware - populates req.user if token is valid, but allows guest access
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.vito_token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    const user = await User.findById(decoded.userId);
    if (user && user.status !== 'suspended' && user.status !== 'blocked') {
      req.user = user;
    }
    next();
  } catch {
    // If token invalid, proceed as guest
    next();
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ AUTHORIZATION WALL: Role Based Access Control (RBAC)
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH EXPLANATION:
 * Ye middleware check karta hai ki logged-in user ke paas requested route ko
 * access karne ka specific role permission (jaise 'admin', 'partner') hai ya nahi.
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access Denied: '${req.user.role}' role ko is resource ko access karne ki permission nahi hai.`,
          403
        )
      );
    }

    next();
  };
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ PARTNER AUTHORIZATION WALL: Sub-Role Verification
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH EXPLANATION:
 * Driver aur Rental Partner ke sub-permissions ko isolate karne ke liye.
 */
export const authorizePartnerType = (...types: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    // Platform admin ko hamesha full bypass permission milti hai
    if (req.user.role === 'admin') {
      return next();
    }

    const effectivePartnerType = req.user.partnerType || (req.user.role === 'driver' ? 'driver' : null);
    if (!effectivePartnerType || !types.includes(effectivePartnerType)) {
      return next(
        new AppError(
          `Access Denied: '${effectivePartnerType || req.user.role}' partner type is resource ke liye authorized nahi hai.`,
          403
        )
      );
    }

    next();
  };
};
