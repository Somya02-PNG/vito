import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// ─── Custom Application Error ─────────────────────────────────────────────────
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Error Response Shape ─────────────────────────────────────────────────────
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    errors?: Record<string, string>;
    stack?: string;
  };
}

// ─── Format Mongoose Validation Errors ────────────────────────────────────────
const formatValidationErrors = (
  err: mongoose.Error.ValidationError
): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const [field, error] of Object.entries(err.errors)) {
    errors[field] = error.message;
  }
  return errors;
};

// ─── 404 Not Found Handler ────────────────────────────────────────────────────
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let validationErrors: Record<string, string> | undefined;

  // ── Known operational error ──
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // ── Mongoose validation error ──
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    validationErrors = formatValidationErrors(err);
  }

  // ── Mongoose cast error (bad ObjectId, etc.) ──
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}: ${err.value}`;
  }

  // ── MongoDB duplicate key error (code 11000) ──
  if ((err as any).code === 11000) {
    statusCode = 409;
    const keyValue = (err as any).keyValue;
    const fields = Object.keys(keyValue).join(', ');
    message = `Duplicate value for: ${fields}. Please use a unique value.`;
  }

  // ── Build response ──
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      ...(validationErrors && { errors: validationErrors }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  };

  console.error(`❌ [Error ${statusCode}]`, message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json(response);
};
