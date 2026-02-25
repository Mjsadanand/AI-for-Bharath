import { Router } from 'express';
import {
  getPatients, getPatient, getMyProfile,
  updatePatient, addVitalSigns, addMedication,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/me/profile', getMyProfile);
router.get('/', authorize('doctor', 'admin'), getPatients);
router.get('/:id', getPatient);
router.put('/:id', updatePatient);
router.post('/:id/vitals', authorize('doctor', 'admin'), addVitalSigns);
router.post('/:id/medications', authorize('doctor'), addMedication);

export default router;
