// ─── Centralized Error Handler ───────────────────────────────────────────────
//
// Maps internal errors to safe, user-facing messages. Prevents leaking
// schema details, collection names, and stack traces to clients.

import { Request, Response, NextFunction } from 'express';

// ── Error types ─────────────────────────────────────────────────────────────

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

// ── Safe error message mapper ───────────────────────────────────────────────

function getSafeErrorMessage(error: any): { statusCode: number; message: string } {
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return { statusCode: 409, message: `A record with this ${field} already exists` };
  }

  // Mongoose validation error
  if (error.name === 'ValidationError' && error.errors) {
    const messages = Object.values(error.errors)
      .map((e: any) => e.message)
      .join(', ');
    return { statusCode: 400, message: `Validation failed: ${messages}` };
  }

  // Mongoose CastError (bad ObjectId, etc.)
  if (error.name === 'CastError') {
    return { statusCode: 400, message: `Invalid ${error.path || 'parameter'} format` };
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token' };
  }
  if (error.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Token has expired' };
  }

  // AWS Bedrock errors
  if (error.name === 'ThrottlingException' || error.code === 'ThrottlingException') {
    return { statusCode: 429, message: 'AI service rate limit reached. Please try again shortly.' };
  }
  if (error.name === 'ServiceUnavailableException') {
    return { statusCode: 503, message: 'AI service temporarily unavailable. Please try again.' };
  }
  if (error.name === 'AccessDeniedException') {
    return { statusCode: 503, message: 'AI service configuration error. Contact support.' };
  }

  // Operational errors we've defined
  if (error instanceof AppError) {
    return { statusCode: error.statusCode, message: error.message };
  }

  // Default: never leak internal details
  return { statusCode: 500, message: 'An internal error occurred. Please try again later.' };
}

// ── Global Express Error Handler ────────────────────────────────────────────

export const globalErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  // Log full error internally (never to client)
  console.error(`[ERROR] ${req.method} ${req.path}:`, {
    message: err.message,
    name: err.name,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  const { statusCode, message } = getSafeErrorMessage(err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        originalMessage: err.message,
        name: err.name,
      },
    }),
  });
};

// ── Async handler wrapper ───────────────────────────────────────────────────

/**
 * Wraps async route handlers to catch rejected promises and pass to error handler.
 * Eliminates the need for try/catch in every controller function.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ── Controller-level safe error response (for use inside catch blocks) ──────

/**
 * Returns a safe error response without leaking internal details.
 * Use this when you need to catch errors within a controller.
 */
export function handleControllerError(res: Response, error: any, fallbackMessage = 'Operation failed') {
  const { statusCode, message } = getSafeErrorMessage(error);
  console.error(`[Controller Error]:`, error.message || error);
  res.status(statusCode).json({ success: false, message: message || fallbackMessage });
}
