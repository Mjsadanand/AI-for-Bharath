// ─── Security Middleware ──────────────────────────────────────────────────────
//
// Centralized security: rate limiting, input sanitization, request validation.

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ── Rate Limiters ───────────────────────────────────────────────────────────

/** Global rate limit: 100 requests per 15 minutes per IP */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

/** Auth endpoints: 10 attempts per 15 minutes */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Agent pipeline: 5 requests per 15 minutes (expensive Bedrock calls) */
export const agentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Pipeline rate limit reached. Please wait before running another pipeline.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── NoSQL Injection Prevention ──────────────────────────────────────────────

/**
 * Recursively strip MongoDB operators ($gt, $ne, etc.) from objects.
 * Prevents NoSQL injection through query parameters and request bodies.
 */
function sanitizeValue(value: any): any {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      // Strip keys starting with $ (MongoDB operators)
      if (key.startsWith('$')) continue;
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
}

/** Middleware: sanitize req.body against NoSQL injection */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // req.query and req.params are read-only in Express 5.
  // Query params are always strings so they're inherently safe from NoSQL injection.
  // Sanitize req.body where objects/arrays with $ operators could be injected.
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};

// ── Regex Escape Utility ────────────────────────────────────────────────────

/** Escape special regex characters to prevent ReDoS (Regular Expression DoS) */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Request Size Validator ──────────────────────────────────────────────────

/**
 * Validate that string inputs don't exceed reasonable lengths.
 * Prevents resource exhaustion from oversized payloads.
 */
export const validateContentLength = (maxTranscriptLength = 50000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body?.transcript && req.body.transcript.length > maxTranscriptLength) {
      res.status(400).json({
        success: false,
        message: `Transcript exceeds maximum length of ${maxTranscriptLength} characters`,
      });
      return;
    }
    next();
  };
};

// ── Mongoose ObjectId Validator ─────────────────────────────────────────────

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

/** Validate that a string is a valid MongoDB ObjectId */
export function isValidObjectId(id: any): boolean {
  return typeof id === 'string' && objectIdRegex.test(id);
}

/** Middleware: validate :id param is a valid ObjectId */
export const validateObjectIdParam = (paramName = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    if (id && !isValidObjectId(id)) {
      res.status(400).json({ success: false, message: `Invalid ${paramName} format` });
      return;
    }
    next();
  };
};
