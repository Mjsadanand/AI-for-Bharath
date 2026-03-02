import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { googleAuth, selectRole, completeProfile } from '../controllers/googleAuthController.js';
import { protect } from '../middleware/auth.js';
import {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  googleAuthSchema,
  selectRoleSchema,
  completeProfileSchema,
} from '../middleware/validation.js';

const router = Router();

// ── Local auth ──────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);

// ── Google OAuth ────────────────────────────────────────────────────────────
router.post('/google', validate(googleAuthSchema), googleAuth);
router.post('/google/select-role', protect, validate(selectRoleSchema), selectRole);
router.post('/google/complete-profile', protect, validate(completeProfileSchema), completeProfile);

export default router;
