import { Router } from 'express';
import {
  assessRisk, getPatientAssessments, getLatestAssessment,
  acknowledgeAlert, getActiveAlerts, getAllAssessments,
} from '../controllers/predictiveController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/assessments', authorize('doctor', 'admin'), getAllAssessments);
router.post('/assess/:patientId', authorize('doctor', 'admin'), assessRisk);
router.get('/alerts', authorize('doctor', 'admin'), getActiveAlerts);
router.get('/patient/:patientId', getPatientAssessments);
router.get('/latest/:patientId', getLatestAssessment);
router.put('/:assessmentId/alerts/:alertIndex/acknowledge', authorize('doctor', 'admin'), acknowledgeAlert);

export default router;
