import { Router } from 'express';
import {
  createAppointment, getAppointments, updateAppointment,
  createClaim, getClaims, updateClaim,
  createLabResult, getLabResults, updateLabResult,
} from '../controllers/workflowController.js';
import { protect, authorize, requireCompleteProfile } from '../middleware/auth.js';
import { validateObjectIdParam } from '../middleware/security.js';
import { validate, createAppointmentSchema, createClaimSchema } from '../middleware/validation.js';

const router = Router();

router.use(protect);
router.use(requireCompleteProfile);

// Appointments
router.post('/appointments', validate(createAppointmentSchema), createAppointment);
router.get('/appointments', getAppointments);
router.put('/appointments/:id', validateObjectIdParam(), updateAppointment);

// Insurance Claims
router.post('/claims', authorize('doctor', 'admin'), validate(createClaimSchema), createClaim);
router.get('/claims', authorize('doctor', 'admin'), getClaims);
router.put('/claims/:id', authorize('doctor', 'admin'), validateObjectIdParam(), updateClaim);

// Lab Results
router.post('/labs', authorize('doctor', 'admin'), createLabResult);
router.get('/labs', getLabResults);
router.put('/labs/:id', authorize('doctor', 'admin'), validateObjectIdParam(), updateLabResult);

export default router;
