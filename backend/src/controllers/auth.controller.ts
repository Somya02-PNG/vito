import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { AppError } from '../middleware/error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'vito_development_jwt_secret_key_12345';
const JWT_EXPIRES_IN = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ─── Helper: Sign JWT & set httpOnly cookie ──────────────────────────────────
const signTokenAndSetCookie = (
  userId: string,
  role: string,
  res: Response
): string => {
  const token = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.cookie('vito_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return token;
};

// ─── Signup ──────────────────────────────────────────────────────────────────
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, email, password, role } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !password) {
      return next(new AppError('Please provide name, phone, email, and password.', 400));
    }

    // Only allow customer or driver signup (admin is created separately)
    if (role && !['customer', 'driver'].includes(role)) {
      return next(new AppError('Role must be either "customer" or "driver".', 400));
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      phone,
      email: email.toLowerCase(),
      role: role || 'customer',
      passwordHash,
    });

    // Sign JWT & set cookie
    signTokenAndSetCookie(user._id.toString(), user.role, res);

    // Return user (without passwordHash)
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    // Find user with passwordHash included
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );

    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Sign JWT & set cookie
    signTokenAndSetCookie(user._id.toString(), user.role, res);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current User (Me) ──────────────────────────────────────────────────
export const getMe = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // req.user is set by the protect middleware
  const user = req.user!;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
  });
};

// ─── Logout ─────────────────────────────────────────────────────────────────
export const logout = (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.cookie('vito_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
