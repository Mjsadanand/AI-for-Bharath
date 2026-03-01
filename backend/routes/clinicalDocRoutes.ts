import { Router } from 'express';
import multer from 'multer';
import {
  createClinicalNote, getClinicalNotes, getClinicalNote,
  verifyClinicalNote, processTranscript, getPatientNotes,
} from '../controllers/clinicalDocController.js';
import { transcribeAudio } from '../controllers/transcriptionController.js';
import { protect, authorize, requireCompleteProfile } from '../middleware/auth.js';
import { validateObjectIdParam } from '../middleware/security.js';
import { validate, createClinicalNoteSchema, verifyNoteSchema } from '../middleware/validation.js';

// Multer config for audio uploads (memory storage, 25 MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

const router = Router();

router.use(protect);
router.use(requireCompleteProfile);
router.post('/', authorize('doctor'), validate(createClinicalNoteSchema), createClinicalNote);
router.get('/', getClinicalNotes);
router.post('/transcribe', authorize('doctor'), upload.single('audio'), transcribeAudio);
router.post('/process-transcript', authorize('doctor'), processTranscript);
router.get('/patient/:patientId', validateObjectIdParam('patientId'), getPatientNotes);
router.get('/:id', validateObjectIdParam(), getClinicalNote);
router.put('/:id/verify', authorize('doctor'), validateObjectIdParam(), validate(verifyNoteSchema), verifyClinicalNote);

export default router;
