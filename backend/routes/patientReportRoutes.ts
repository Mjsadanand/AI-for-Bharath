import { Router } from 'express';
import { analyzeReport, getReportHistory } from '../controllers/patientReportController.js';
import { protect, authorize, requireCompleteProfile } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(requireCompleteProfile);

// Patient-only endpoints
router.post('/analyze', authorize('patient'), analyzeReport);
router.get('/history', authorize('patient'), getReportHistory);

export default router;
