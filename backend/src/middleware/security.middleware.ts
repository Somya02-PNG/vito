import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ SECURITY WALL 1: Anti-Brute Force & Rate Limiting System (In-Memory)
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH EXPLANATION:
 * Ye security wall brute-force aur credential stuffing attacks ko rokne ke liye
 * lagaya gaya hai. Agar koi hacker script laga kar baar-baar password guess karne
 * ki koshish karega, toh ye uske IP address ko temporarily block (rate-limit) kar dega.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export const authRateLimiter = (maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Client ka real IP nikaalna (Proxy headers ko bhi support karta hai)
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown_ip';

    const key = `auth_limit_${clientIp}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxAttempts) {
      const remainingMinutes = Math.ceil((record.resetTime - now) / 60000);
      // # HINGLISH: 10 se zyada baar galat try karne par block response bhejo
      return next(
        new AppError(
          `Security Alert: Bahut zyada login attempts detect hue hain. Kripya ${remainingMinutes} minute baad dobara koshish karein.`,
          429
        )
      );
    }

    record.count += 1;
    next();
  };
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ SECURITY WALL 2: NoSQL Injection Sanitizer
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH EXPLANATION:
 * MongoDB me hackers '$gt', '$ne', '$where' jaise operators JSON body me bhej kar
 * authentication bypass kar sakte hain (jaise password: { "$gt": "" }).
 * Ye sanitizer har incoming request se '$' aur '.' waale keys ko sanitize/delete
 * kar deta hai taaki NoSQL Injection attack poori tarah se fail ho jaye.
 */
export const sanitizeNoSql = (obj: any): any => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeNoSql(obj[key]);
      }
    }
  }
  return obj;
};

export const noSqlSanitizerMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.query) sanitizeNoSql(req.query);
  if (req.params) sanitizeNoSql(req.params);
  next();
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ SECURITY WALL 3: OWASP Hardened Security Headers
 * ═══════════════════════════════════════════════════════════════════════════
 * # HINGLISH EXPLANATION:
 * Ye middleware browser ko strict security rules deta hai:
 * 1. X-Frame-Options: DENY -> Koi bhi iframe me hamari site embed karke Clickjacking nahi kar sakta.
 * 2. X-Content-Type-Options: nosniff -> MIME-type sniffing ko rokta hai (malicious file upload execution prevention).
 * 3. X-XSS-Protection -> Cross-site scripting (XSS) filter active rakhta hai.
 * 4. Strict-Transport-Security -> HSTS enforce karta hai taaki connections secure HTTPS par hi chalein.
 */
export const securityHeadersMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};
