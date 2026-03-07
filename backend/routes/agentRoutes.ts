// ─── Agent Routes ────────────────────────────────────────────────────────────
//
// CHANGES (hackathon improvements):
//   + POST /pipeline/stream  — SSE endpoint; streams PipelineStreamEvents in real-time so the
//                              frontend can render per-step progress without polling.
//                              Uses POST so the full transcript can be sent in the request body.
//
//   + GET  /telemetry        — Exposes per-agent run statistics and estimated AWS Bedrock cost.
//                              Available to doctors, admins, and researchers so the team can
//                              monitor token spend and model fallback frequency during the demo.

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
  streamAgentPipeline,         // NEW — SSE streaming pipeline endpoint
  getAgentTelemetryEndpoint,   // NEW — per-agent cost & usage statistics
} from '../controllers/agentController.js';

const router = Router();

// Public info endpoint
router.get('/info', getAgentInfo);

// Protected endpoints — require authentication + completed profile
router.use(protect);
router.use(requireCompleteProfile);

// Agent endpoints are expensive — apply strict rate limit
router.use(agentLimiter);

// Run the full 5-agent pipeline (blocking — returns when all phases complete)
router.post('/pipeline/run', authorize('doctor', 'admin'), validate(pipelineRunSchema), runAgentPipeline);

// Run the full pipeline with real-time SSE progress events
// POST so that the transcript body can be included; respond with text/event-stream
router.post('/pipeline/stream', authorize('doctor', 'admin'), validate(pipelineRunSchema), streamAgentPipeline);

// Check pipeline status
router.get('/pipeline/status/:pipelineId', getPipelineStatus);

// List all pipeline runs
router.get('/pipelines', authorize('doctor', 'admin'), listPipelines);

// Run a single agent independently
router.post('/run/:agentName', authorize('doctor', 'admin'), validate(singleAgentSchema), runSingleAgent);

// Per-agent telemetry: run counts, token totals, estimated AWS Bedrock cost
// Readable by doctors and admins for cost monitoring; also researchers for analysis
router.get('/telemetry', authorize('doctor', 'admin', 'researcher'), getAgentTelemetryEndpoint);

export default router;
