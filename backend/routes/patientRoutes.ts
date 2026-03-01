import { Router } from 'express';
import {
  getPatients, getPatient, getMyProfile,
  updatePatient, addVitalSigns, addMedication,
} from '../controllers/patientController.js';
import { protect, authorize, requireCompleteProfile } from '../middleware/auth.js';
import { validateObjectIdParam } from '../middleware/security.js';
import { validate, updatePatientSchema, vitalSignsSchema } from '../middleware/validation.js';

const router = Router();

router.use(protect);
router.use(requireCompleteProfile);
router.get('/me/profile', getMyProfile);
router.get('/', authorize('doctor', 'admin'), getPatients);
router.get('/:id', authorize('doctor', 'admin'), validateObjectIdParam(), getPatient);
router.put('/:id', authorize('doctor', 'admin'), validateObjectIdParam(), validate(updatePatientSchema), updatePatient);
router.post('/:id/vitals', authorize('doctor', 'admin'), validateObjectIdParam(), validate(vitalSignsSchema), addVitalSigns);
router.post('/:id/medications', authorize('doctor'), validateObjectIdParam(), addMedication);

export default router;
