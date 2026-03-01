// ─── Agent Routes ────────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, authorize, requireCompleteProfile } from '../middleware/auth.js';
import { agentLimiter, validateObjectIdParam } from '../middleware/security.js';
import { validate } from '../middleware/validation.js';
import { pipelineRunSchema, singleAgentSchema } from '../middleware/validation.js';
import {
  runAgentPipeline,
  runSingleAgent,
  getPipelineStatus,
  listPipelines,
  getAgentInfo,
} from '../controllers/agentController.js';

const router = Router();

// Public info endpoint
router.get('/info', getAgentInfo);

// Protected endpoints — require authentication + completed profile
router.use(protect);
router.use(requireCompleteProfile);

// Agent endpoints are expensive — apply strict rate limit
router.use(agentLimiter);

// Run the full 5-agent pipeline
router.post('/pipeline/run', authorize('doctor', 'admin'), validate(pipelineRunSchema), runAgentPipeline);

// Check pipeline status
router.get('/pipeline/status/:pipelineId', getPipelineStatus);

// List all pipeline runs
router.get('/pipelines', authorize('doctor', 'admin'), listPipelines);

// Run a single agent independently
router.post('/run/:agentName', authorize('doctor', 'admin'), validate(singleAgentSchema), runSingleAgent);

export default router;
