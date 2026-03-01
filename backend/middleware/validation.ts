// ─── Validation Schemas ──────────────────────────────────────────────────────
//
// Zod schemas for input validation across all endpoints.
// Prevents injection, XSS, type confusion, and ensures data integrity.

import { z } from 'zod';

// ── Common validators ───────────────────────────────────────────────────────

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');

const email = z
  .string()
  .email('Invalid email format')
  .max(255)
  .transform((v) => v.toLowerCase().trim());

const safeName = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100)
  .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters')
  .transform((v) => v.trim());

const safeString = z
  .string()
  .max(5000)
  .transform((v) => v.replace(/<[^>]*>/g, '').trim()); // Strip HTML tags

const phoneNumber = z
  .string()
  .regex(/^[+]?[\d\s\-().]{7,20}$/, 'Invalid phone number')
  .optional();

// ── Auth Schemas ────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    email,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    name: safeName.optional(),
    role: z.enum(['doctor', 'patient', 'researcher'], {
      error: 'Role must be doctor, patient, or researcher',
    }).optional(), // Optional — defaults handled by controller
    specialization: z.string().max(100).optional(),
    licenseNumber: z.string().max(50).optional(),
    phone: phoneNumber,
    dateOfBirth: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    gender: z.enum(['male', 'female', 'other']).optional(),
    bloodGroup: z.string().max(10).optional(),
    emergencyContact: z
      .object({
        name: z.string().max(100),
        phone: z.string().max(20),
        relation: z.string().max(50),
      })
      .optional(),
  })
  .strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});

export const updateProfileSchema = z.object({
  name: safeName.optional(),
  phone: phoneNumber,
  specialization: z.string().max(100).optional(),
});

// ── Google OAuth Schemas ────────────────────────────────────────────────────

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required').max(5000),
});

export const selectRoleSchema = z.object({
  role: z.enum(['doctor', 'patient', 'researcher'], {
    error: 'Role must be doctor, patient, or researcher',
  }),
});

export const completeProfileSchema = z
  .object({
    name: safeName.optional(),
    phone: phoneNumber,
    specialization: z.string().max(100).optional(),
    licenseNumber: z.string().max(50).optional(),
    dateOfBirth: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    gender: z.enum(['male', 'female', 'other']).optional(),
    bloodGroup: z.string().max(10).optional(),
    emergencyContact: z
      .object({
        name: z.string().max(100),
        phone: z.string().max(20),
        relation: z.string().max(50),
      })
      .optional(),
  })
  .strict();

// ── Patient Schemas ─────────────────────────────────────────────────────────

export const updatePatientSchema = z.object({
  allergies: z.array(z.string().max(100)).max(50).optional(),
  chronicConditions: z.array(z.string().max(100)).max(50).optional(),
  emergencyContact: z
    .object({
      name: z.string().max(100),
      phone: z.string().max(20),
      relation: z.string().max(50),
    })
    .optional(),
  insurance: z
    .object({
      provider: z.string().max(100).optional(),
      policyNumber: z.string().max(50).optional(),
      groupNumber: z.string().max(50).optional(),
    })
    .optional(),
  bloodGroup: z.string().max(10).optional(),
});

export const vitalSignsSchema = z.object({
  bloodPressure: z
    .object({
      systolic: z.number().min(40).max(300),
      diastolic: z.number().min(20).max(200),
    })
    .optional(),
  heartRate: z.number().min(20).max(300).optional(),
  temperature: z.number().min(90).max(115).optional(), // Fahrenheit
  respiratoryRate: z.number().min(4).max(60).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  weight: z.number().min(0.5).max(700).optional(), // kg
  height: z.number().min(20).max(300).optional(), // cm
});

// ── Clinical Doc Schemas ────────────────────────────────────────────────────

export const createClinicalNoteSchema = z.object({
  patientId: objectId,
  noteType: z.enum([
    'consultation', 'follow-up', 'emergency', 'procedure', 'discharge',
    'progress_note', 'initial_consultation', 'follow_up', 'discharge_summary', 'procedure_note', 'progress',
  ]),
  chiefComplaint: safeString,
  historyOfPresentIllness: z.string().max(10000).optional(),
  physicalExam: z.record(z.string(), z.string().max(2000)).optional(),
  assessment: z.array(z.any()).optional(),
  plan: z.array(z.any()).optional(),
  transcript: z.string().max(50000).optional(),
  prescriptions: z.array(z.any()).max(20).optional(),
});

export const verifyNoteSchema = z.object({
  action: z.enum(['verify', 'reject', 'amend']),
  amendments: z
    .object({
      assessment: z.array(z.any()).optional(),
      plan: z.array(z.any()).optional(),
      historyOfPresentIllness: z.string().max(10000).optional(),
    })
    .optional(),
});

// ── Agent Pipeline Schema ───────────────────────────────────────────────────

export const pipelineRunSchema = z.object({
  patientId: objectId,
  transcript: z
    .string()
    .min(10, 'Transcript must be at least 10 characters')
    .max(50000, 'Transcript exceeds maximum length'),
  steps: z
    .array(
      z.enum([
        'clinical-documentation',
        'medical-translator',
        'predictive-analytics',
        'research-synthesis',
        'workflow-automation',
      ])
    )
    .optional(),
});

export const singleAgentSchema = z.object({
  patientId: objectId,
  transcript: z.string().max(50000).optional(),
  context: z.record(z.string(), z.any()).optional(),
});

// ── Workflow Schemas ────────────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  patientId: objectId,
  doctorId: objectId.optional(),
  scheduledDate: z.string().datetime(),
  duration: z.number().min(5).max(480).optional(),
  type: z.enum(['consultation', 'follow-up', 'emergency', 'checkup', 'procedure', 'follow_up', 'lab_review']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const createClaimSchema = z.object({
  patientId: objectId,
  clinicalNoteId: objectId.optional(),
  insuranceProvider: z.string().max(200),
  policyNumber: z.string().max(100),
  diagnosisCodes: z.array(z.string().max(20)).max(20).optional(),
  procedureCodes: z.array(z.string().max(20)).max(20).optional(),
  totalAmount: z.number().min(0).max(10000000),
  notes: z.string().max(2000).optional(),
});

// ── Pagination Schema ───────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10), // Max 100 per page
  search: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
  date: z.string().max(30).optional(),
});

// ── Validation Helper ───────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured error messages on failure.
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = (result.error.issues || []).map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }
    req.body = result.data; // Replace with validated & transformed data
    next();
  };
};

/**
 * Validate query parameters against a Zod schema.
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = (result.error.issues || []).map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors,
      });
      return;
    }
    // In Express 5, req.query is read-only. Store validated data on res.locals.
    (res as any).locals.validatedQuery = result.data;
    next();
  };
};
