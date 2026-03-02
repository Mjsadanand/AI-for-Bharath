import { Router } from 'express';
import {
  assessRisk, getPatientAssessments, getLatestAssessment,
  acknowledgeAlert, getActiveAlerts, getAllAssessments,
} from '../controllers/predictiveController.js';
import { protect, authorize, requireCompleteProfile } from '../middleware/auth.js';
import { validateObjectIdParam } from '../middleware/security.js';

const router = Router();

router.use(protect);
router.use(requireCompleteProfile);
router.get('/assessments', authorize('doctor', 'admin'), getAllAssessments);
router.post('/assess/:patientId', authorize('doctor', 'admin'), validateObjectIdParam('patientId'), assessRisk);
router.get('/alerts', authorize('doctor', 'admin'), getActiveAlerts);
router.get('/patient/:patientId', validateObjectIdParam('patientId'), getPatientAssessments);
router.get('/latest/:patientId', validateObjectIdParam('patientId'), getLatestAssessment);
router.put('/:assessmentId/alerts/:alertIndex/acknowledge', authorize('doctor', 'admin'), validateObjectIdParam('assessmentId'), acknowledgeAlert);

export default router;
