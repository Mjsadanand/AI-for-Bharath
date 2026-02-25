import { Router } from 'express';
import {
  createClinicalNote, getClinicalNotes, getClinicalNote,
  verifyClinicalNote, processTranscript, getPatientNotes,
} from '../controllers/clinicalDocController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.post('/', authorize('doctor'), createClinicalNote);
router.get('/', getClinicalNotes);
router.post('/process-transcript', authorize('doctor'), processTranscript);
router.get('/patient/:patientId', getPatientNotes);
router.get('/:id', getClinicalNote);
router.put('/:id/verify', authorize('doctor'), verifyClinicalNote);

export default router;
