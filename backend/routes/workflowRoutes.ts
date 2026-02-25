import { Router } from 'express';
import {
  createAppointment, getAppointments, updateAppointment,
  createClaim, getClaims, updateClaim,
  createLabResult, getLabResults, updateLabResult,
} from '../controllers/workflowController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Appointments
router.post('/appointments', createAppointment);
router.get('/appointments', getAppointments);
router.put('/appointments/:id', updateAppointment);

// Insurance Claims
router.post('/claims', authorize('doctor', 'admin'), createClaim);
router.get('/claims', authorize('doctor', 'admin'), getClaims);
router.put('/claims/:id', authorize('doctor', 'admin'), updateClaim);

// Lab Results
router.post('/labs', authorize('doctor', 'admin'), createLabResult);
router.get('/labs', getLabResults);
router.put('/labs/:id', authorize('doctor', 'admin'), updateLabResult);

export default router;
