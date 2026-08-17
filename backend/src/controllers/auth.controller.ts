import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model';
import Driver from '../models/Driver.model';
import RentalPartner from '../models/RentalPartner.model';
import { AppError } from '../middleware/error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'vito_development_jwt_secret_key_12345';
const JWT_EXPIRES_IN = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// In-memory store for password reset tokens (dev only — use Redis in production)
const resetTokenStore = new Map<string, { userId: string; expiresAt: number }>();

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

// ─── Helper: Build safe user response ────────────────────────────────────────
const buildUserResponse = (user: any) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
  partnerType: user.partnerType ?? null,
  status: user.status ?? 'active',
  createdAt: user.createdAt,
});

// ─── Signup ──────────────────────────────────────────────────────────────────
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, email, password, role, partnerType, licenseNumber, experience, city, businessName, fleetCount, hourlyRate } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !password) {
      return next(new AppError('Please provide name, phone, email, and password.', 400));
    }

    // Only allow customer or partner signup (admin is seeded separately)
    const allowedRoles = ['customer', 'partner', 'driver'];
    if (role && !allowedRoles.includes(role)) {
      return next(new AppError('Invalid role. Use "customer" or "partner".', 400));
    }

    // Validate partner type for partner registrations
    const effectiveRole = role || 'customer';
    if (effectiveRole === 'partner') {
      if (!partnerType || !['driver', 'rental_partner'].includes(partnerType)) {
        return next(new AppError('Partner type must be "driver" or "rental_partner".', 400));
      }
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Determine status: partners start as pending, customers start as active
    const status = effectiveRole === 'partner' ? 'pending' : 'active';

    // Create user
    const user = await User.create({
      name,
      phone,
      email: email.toLowerCase(),
      role: effectiveRole,
      partnerType: effectiveRole === 'partner' ? partnerType : null,
      status,
      passwordHash,
    });

    // If partner with partnerType=driver, create Driver profile
    if (effectiveRole === 'partner' && partnerType === 'driver') {
      await Driver.create({
        userId: user._id,
        licenseNumber: licenseNumber || `TEMP-${user._id}`,
        experience: experience || 0,
        city: city || '',
        hourlyRate: hourlyRate || 100,
        verificationStatus: 'pending',
        availability: false, // Not available until verified
      });
    }

    // If partner with partnerType=rental_partner, create RentalPartner profile
    if (effectiveRole === 'partner' && partnerType === 'rental_partner') {
      await RentalPartner.create({
        userId: user._id,
        businessName: businessName || name,
        city: city || '',
        fleetCount: fleetCount || 0,
        verificationStatus: 'pending',
      });
    }

    // Sign JWT & set cookie
    signTokenAndSetCookie(user._id.toString(), user.role, res);

    // Return user (without passwordHash)
    res.status(201).json({
      success: true,
      data: {
        user: buildUserResponse(user),
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
    const { email, password, requiredRole } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    // Find user with passwordHash included
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );

    const genericErrorMsg = requiredRole === 'admin'
      ? 'Invalid administrator credentials.'
      : 'Invalid email or password.';

    if (!user) {
      return next(new AppError(genericErrorMsg, 401));
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return next(new AppError(genericErrorMsg, 401));
    }

    // Enforce server-side role check if requiredRole is specified (e.g. 'admin' from /admin/login)
    if (requiredRole && user.role !== requiredRole) {
      return next(new AppError(genericErrorMsg, 401));
    }

    // Check account status
    if (user.status === 'suspended') {
      return next(new AppError('Your account has been suspended. Please contact support.', 403));
    }
    if (user.status === 'blocked') {
      return next(new AppError('Your account has been blocked. Please contact support.', 403));
    }
    if (user.status === 'pending') {
      return next(new AppError('Your account application is currently pending approval.', 403));
    }

    // Sign JWT & set cookie
    signTokenAndSetCookie(user._id.toString(), user.role, res);

    res.status(200).json({
      success: true,
      data: {
        user: buildUserResponse(user),
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
  const user = req.user!;

  res.status(200).json({
    success: true,
    data: {
      user: buildUserResponse(user),
    },
  });
};

// ─── Update Profile ─────────────────────────────────────────────────────────
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { name, phone } = req.body;

    if (!name && !phone) {
      return next(new AppError('Please provide at least one field to update (name or phone).', 400));
    }

    const updates: Record<string, any> = {};
    if (name && name.trim().length >= 2) updates.name = name.trim();
    if (phone) updates.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { user: buildUserResponse(updatedUser) },
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ─────────────────────────────────────────────────────────
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide your email address.', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate reset token (32 random bytes → hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store token (in production: store hashed token in DB + send email)
    resetTokenStore.set(resetToken, { userId: user._id.toString(), expiresAt });

    // In development: return token directly in response
    const responseData: Record<string, any> = {
      message: 'If an account with that email exists, a reset link has been sent.',
    };

    if (process.env.NODE_ENV !== 'production') {
      responseData.devResetToken = resetToken;
      responseData.devNote = 'This token is returned in development only. Wire to email service in production.';
    }

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ──────────────────────────────────────────────────────────
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return next(new AppError('Reset token and new password are required.', 400));
    }

    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match.', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters.', 400));
    }

    // Lookup token
    const tokenEntry = resetTokenStore.get(token);
    if (!tokenEntry) {
      return next(new AppError('Invalid or expired reset token. Please request a new one.', 400));
    }

    if (Date.now() > tokenEntry.expiresAt) {
      resetTokenStore.delete(token);
      return next(new AppError('Reset token has expired. Please request a new one.', 400));
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(tokenEntry.userId, { passwordHash });

    // Invalidate token
    resetTokenStore.delete(token);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
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

// ─── Demo Login ─────────────────────────────────────────────────────────────
export const demoLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.body;
    const targetRole = role || 'customer';

    let email = 'customer@vito.com';
    let name = 'Demo Customer';
    let userRole = 'customer';
    let partnerType: 'driver' | 'rental_partner' | null = null;

    if (targetRole === 'driver') {
      email = 'driver@vito.com';
      name = 'Demo Driver Partner';
      userRole = 'partner';
      partnerType = 'driver';
    } else if (targetRole === 'partner' || targetRole === 'rental_partner') {
      email = 'partner@vito.com';
      name = 'Demo Rental Partner';
      userRole = 'partner';
      partnerType = 'rental_partner';
    } else if (targetRole === 'admin') {
      email = 'admin@vito.com';
      name = 'VITO Platform Admin';
      userRole = 'admin';
    }

    let user = await User.findOne({ email });

    if (!user) {
      const passwordHash = await bcrypt.hash('vito@2026', 10);
      user = await User.create({
        name,
        email,
        phone: '+919876543210',
        passwordHash,
        role: userRole,
        partnerType,
        status: 'active',
      });
    } else {
      let updated = false;
      if (user.status !== 'active') {
        user.status = 'active';
        updated = true;
      }
      if (user.role !== userRole) {
        user.role = userRole as any;
        updated = true;
      }
      if (partnerType && user.partnerType !== partnerType) {
        user.partnerType = partnerType;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    // Ensure driver profile exists if driver
    if (userRole === 'partner' && partnerType === 'driver') {
      const existingDriver = await Driver.findOne({ userId: user._id });
      if (!existingDriver) {
        await Driver.create({
          userId: user._id,
          licenseNumber: 'DL-00-2026-DEMO',
          experience: 8,
          city: 'New Delhi',
          hourlyRate: 200,
          verificationStatus: 'verified',
          availability: true,
          rating: 4.9,
          walletBalance: 15400,
        });
      }
    }

    // Ensure rental partner profile exists if rental partner
    if (userRole === 'partner' && partnerType === 'rental_partner') {
      const existingRentalPartner = await RentalPartner.findOne({ userId: user._id });
      if (!existingRentalPartner) {
        await RentalPartner.create({
          userId: user._id,
          businessName: 'VITO Fleet Services',
          city: 'New Delhi',
          fleetCount: 15,
          verificationStatus: 'verified',
        });
      }
    }

    // Sign JWT & set cookie
    signTokenAndSetCookie(user._id.toString(), user.role, res);

    res.status(200).json({
      success: true,
      data: {
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

