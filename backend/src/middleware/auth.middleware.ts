import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';
import { AppError } from './error.middleware';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'vito_development_jwt_secret_key_12345';

// ─── Protect — Verify JWT from httpOnly cookie ───────────────────────────────
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.vito_token;

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    // Attach user to request (exclude passwordHash)
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

// ─── Authorize — Restrict to specific roles ──────────────────────────────────
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
};

// ─── Authorize Partner Type — Restrict to specific partner types ─────────────
export const authorizePartnerType = (...types: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      return next();
    }

    const effectivePartnerType = req.user.partnerType || (req.user.role === 'driver' ? 'driver' : null);
    if (!effectivePartnerType || !types.includes(effectivePartnerType)) {
      return next(
        new AppError(
          `Partner type '${effectivePartnerType || req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
};

