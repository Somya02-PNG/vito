import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model';
import Driver from '../models/Driver.model';
import RentalPartner from '../models/RentalPartner.model';
import { AppError } from '../middleware/error.middleware';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔐 AUTHENTICATION & SECURITY CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH: JWT Secret strong hona chahiye aur expiration time limit me hona
 * chahiye taaki agar token intercept ho bhi jaye toh attacker ke paas limited time ho.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'vito_development_jwt_secret_key_12345_secure_entropy';
const JWT_EXPIRES_IN = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// # HINGLISH: Timing Attack Protection ke liye pre-generated constant dummy hash.
// Agar user database me na mile, tab bhi hum ye dummy hash compare karte hain taaki
// response time exact same rahe aur hacker timing analysis se email existence pata na laga sake.
const DUMMY_HASH = '$2a$12$e8kPq6b2YF5lM0n8W9q3Vu8q9a8z7y6x5w4v3u2t1s0r9q8p7o6n5';

// Dev reset token memory store
const resetTokenStore = new Map<string, { userId: string; expiresAt: number }>();

/**
 * ─── Helper: Sign JWT & Set Hardened HttpOnly Cookie ─────────────────────────
 * # HINGLISH EXPLANATION:
 * Token ko response body ke bajaye httpOnly cookie me bhejna industry best-practice hai.
 * 1. httpOnly: true -> JavaScript document.cookie se isse nahi padh sakti (XSS attack se protection).
 * 2. sameSite: 'lax' -> Cross-Site Request Forgery (CSRF) protection.
 * 3. secure: true (production me) -> Cookie sirf encrypted HTTPS connection par hi transfer hogi.
 */
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

/**
 * ─── Helper: Build Safe Sanitized User Response ──────────────────────────────
 * # HINGLISH: Data leakage prevention - passwordHash, internal tokens aur sensitive
 * flags ko kabhi bhi frontend response me return nahi karte.
 */
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

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. SIGNUP (User Registration with Input Validation & Password Hashing)
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH:
 * - Email format ko strict regex se validate karte hain.
 * - Password complexity check karte hain (min 6 characters).
 * - bcrypt cost factor 12 use karte hain jo brute-force cracking ko exponentially slow kar deta hai.
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      role,
      partnerType,
      licenseNumber,
      experience,
      city,
      businessName,
      fleetCount,
      hourlyRate,
    } = req.body;

    // # HINGLISH: Sabhi zaroori inputs ki existence check karna
    if (!name || !phone || !email || !password) {
      return next(new AppError('Kripya name, phone, email aur password provide karein.', 400));
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return next(new AppError('Kripya ek valid email address enter karein.', 400));
    }

    // # HINGLISH: Password complexity check
    if (String(password).length < 6) {
      return next(new AppError('Password kam se kam 6 characters ka hona chahiye.', 400));
    }

    // # HINGLISH: Role boundary validation - koi unauthorized admin role claim na kar sake
    const allowedRoles = ['customer', 'partner', 'driver'];
    const effectiveRole = role || 'customer';
    if (!allowedRoles.includes(effectiveRole)) {
      return next(new AppError('Invalid role. Sirf customer ya partner allow hai.', 400));
    }

    if (effectiveRole === 'partner') {
      if (!partnerType || !['driver', 'rental_partner'].includes(partnerType)) {
        return next(new AppError('Partner type "driver" ya "rental_partner" hona zaroori hai.', 400));
      }
    }

    // # HINGLISH: Duplicate account prevention
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return next(new AppError('Is email ke saath pehle se account bana hua hai.', 409));
    }

    // # HINGLISH: High-security bcrypt hashing with cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);
    const status = effectiveRole === 'partner' ? 'pending' : 'active';

    const user = await User.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: cleanEmail,
      role: effectiveRole,
      partnerType: effectiveRole === 'partner' ? partnerType : null,
      status,
      passwordHash,
    });

    // Profile creation for partners
    if (effectiveRole === 'partner' && partnerType === 'driver') {
      await Driver.create({
        userId: user._id,
        licenseNumber: licenseNumber || `TEMP-${user._id}`,
        experience: Number(experience) || 0,
        city: city || '',
        hourlyRate: Number(hourlyRate) || 100,
        verificationStatus: 'pending',
        availability: false,
      });
    }

    if (effectiveRole === 'partner' && partnerType === 'rental_partner') {
      await RentalPartner.create({
        userId: user._id,
        businessName: businessName || name,
        city: city || '',
        fleetCount: Number(fleetCount) || 0,
        verificationStatus: 'pending',
      });
    }

    // # HINGLISH: Secure JWT generation & cookie injection
    signTokenAndSetCookie(user._id.toString(), user.role, res);

    res.status(201).json({
      success: true,
      data: {
        user: buildUserResponse(user),
      },
      message: 'Account successfully create ho gaya hai.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. LOGIN (Hardened Authentication with Timing Attack & Status Protection)
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH:
 * - Timing attack defense: chahe email exist kare ya na kare, bcrypt.compare execute hota hai.
 * - Uniform error messages: attacker ko ye pata nahi chalta ki email galat hai ya password.
 * - Suspended/Blocked checks: deactivated users ko authenticate hone se block karta hai.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, requiredRole } = req.body;

    if (!email || !password) {
      return next(new AppError('Kripya email aur password dono enter karein.', 400));
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // # HINGLISH: Database se user fetch karna with explicit passwordHash selection
    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    const genericErrorMsg =
      requiredRole === 'admin'
        ? 'Invalid administrator credentials.'
        : 'Invalid email ya password. Kripya sahi credentials enter karein.';

    // # HINGLISH TIMING ATTACK PROTECTION:
    // Agar user nahi mila, tab bhi dummy hash par bcrypt execute karo taaki time delay same rahe
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isPasswordCorrect = await bcrypt.compare(String(password), hashToCompare);

    if (!user || !isPasswordCorrect) {
      return next(new AppError(genericErrorMsg, 401));
    }

    // # HINGLISH: Role-based perimeter access check
    if (requiredRole && user.role !== requiredRole) {
      return next(new AppError(genericErrorMsg, 401));
    }

    // # HINGLISH: Account status verification
    if (user.status === 'suspended') {
      return next(new AppError('Aapka account suspend kar diya gaya hai. Kripya support se sampark karein.', 403));
    }
    if (user.status === 'blocked') {
      return next(new AppError('Aapka account block ho gaya hai.', 403));
    }
    if (user.status === 'pending') {
      return next(new AppError('Aapka partner account approval ke liye pending hai.', 403));
    }

    // # HINGLISH: Secure JWT Cookie set karna
    signTokenAndSetCookie(user._id.toString(), user.role, res);

    res.status(200).json({
      success: true,
      data: {
        user: buildUserResponse(user),
      },
      message: 'Login successful!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. GET ME (Session Verification & Rehydration)
 * ═══════════════════════════════════════════════════════════════════════════
 */
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

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 4. UPDATE PROFILE (Sanitized Input Update)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { name, phone } = req.body;

    if (!name && !phone) {
      return next(new AppError('Update karne ke liye kam se kam ek field (name ya phone) dein.', 400));
    }

    const updates: Record<string, any> = {};
    if (name && String(name).trim().length >= 2) updates.name = String(name).trim();
    if (phone) updates.phone = String(phone).trim();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return next(new AppError('User account nahi mila.', 404));
    }

    res.status(200).json({
      success: true,
      data: { user: buildUserResponse(updatedUser) },
      message: 'Profile successfully update ho gayi.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 5. FORGOT PASSWORD (Cryptographic Token Generation)
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH: Email enumeration prevent karne ke liye user exist na kare tab bhi
 * 200 Success return karte hain.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Kripya apna registered email enter karein.', 400));
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Agar ye email registered hai, toh password reset link bhej diya gaya hai.',
      });
    }

    // # HINGLISH: 32-byte high entropy cryptographically secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes TTL

    resetTokenStore.set(resetToken, { userId: user._id.toString(), expiresAt });

    const responseData: Record<string, any> = {
      message: 'Password reset link bhej diya gaya hai.',
    };

    if (process.env.NODE_ENV !== 'production') {
      responseData.devResetToken = resetToken;
    }

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 6. RESET PASSWORD (Token Verification & Password Overwrite)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return next(new AppError('Reset token aur new password dono required hain.', 400));
    }

    if (password !== confirmPassword) {
      return next(new AppError('Passwords match nahi kar rahe hain.', 400));
    }

    if (String(password).length < 6) {
      return next(new AppError('Password kam se kam 6 characters ka hona chahiye.', 400));
    }

    const tokenEntry = resetTokenStore.get(String(token));
    if (!tokenEntry) {
      return next(new AppError('Invalid ya expired reset token hai.', 400));
    }

    if (Date.now() > tokenEntry.expiresAt) {
      resetTokenStore.delete(String(token));
      return next(new AppError('Reset token expire ho chuka hai. Kripya naya token request karein.', 400));
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(tokenEntry.userId, { passwordHash });

    // Single-use token invalidation
    resetTokenStore.delete(String(token));

    res.status(200).json({
      success: true,
      message: 'Password reset successfully ho gaya. Naye password se login karein.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 7. LOGOUT (Cookie Invalidation)
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH: Cookie ka maxAge 0 karke browser side par JWT invalidate karna.
 */
export const logout = (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.cookie('vito_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 8. DEMO LOGIN (Rapid Hackathon Role Gateway)
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH: Hackathon testing aur evaluators ke demonstration ke liye 1-click
 * secure role switching gateway jo test profiles ko auto-seed karta hai.
 */
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

    // Seed driver profile if driver demo
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

    // Seed rental partner profile if rental partner demo
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
      message: `${targetRole.toUpperCase()} demo mode active!`,
    });
  } catch (error) {
    next(error);
  }
};
