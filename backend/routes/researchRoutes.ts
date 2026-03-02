import { Router } from 'express';
import {
  searchPapers, getPaper, savePaper, getTrends, compareEvidence,
} from '../controllers/researchController.js';
import { protect, requireCompleteProfile } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(requireCompleteProfile);
router.get('/search', searchPapers);
router.get('/trends', getTrends);
router.post('/compare', compareEvidence);
router.get('/paper/:id', getPaper);
router.post('/paper/:id/save', savePaper);

export default router;
