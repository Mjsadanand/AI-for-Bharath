import express from 'express';
import { runPipeline, getPipelineStatus } from '../controllers/pipelineController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectIdParam } from '../middleware/security.js';

const router = express.Router();

// Run the full 6-step CARENET pipeline for a patient
router.post('/run/:patientId', protect, authorize('doctor', 'admin'), validateObjectIdParam('patientId'), runPipeline);

// Get pipeline status for a patient
router.get('/status/:patientId', protect, authorize('doctor', 'admin', 'researcher'), validateObjectIdParam('patientId'), getPipelineStatus);

export default router;
