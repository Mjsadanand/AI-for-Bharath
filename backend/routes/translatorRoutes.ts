import { Router } from 'express';
import { translateReport, askQuestion, getMedicationInstructions } from '../controllers/translatorController.js';
import { protect, requireCompleteProfile } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(requireCompleteProfile);
router.post('/translate', translateReport);
router.post('/ask', askQuestion);
router.post('/medication-instructions', getMedicationInstructions);

export default router;
