import { Router } from 'express';
import {
  createClinicalNote, getClinicalNotes, getClinicalNote,
  verifyClinicalNote, processTranscript, getPatientNotes,
} from '../controllers/clinicalDocController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectIdParam } from '../middleware/security.js';
import { validate, createClinicalNoteSchema, verifyNoteSchema } from '../middleware/validation.js';

const router = Router();

router.use(protect);
router.post('/', authorize('doctor'), validate(createClinicalNoteSchema), createClinicalNote);
router.get('/', getClinicalNotes);
router.post('/process-transcript', authorize('doctor'), processTranscript);
router.get('/patient/:patientId', validateObjectIdParam('patientId'), getPatientNotes);
router.get('/:id', validateObjectIdParam(), getClinicalNote);
router.put('/:id/verify', authorize('doctor'), validateObjectIdParam(), validate(verifyNoteSchema), verifyClinicalNote);

export default router;
