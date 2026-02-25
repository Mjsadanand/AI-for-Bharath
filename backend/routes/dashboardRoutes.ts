import { Router } from 'express';
import {
  getDoctorDashboard, getPatientDashboard,
  getAdminDashboard, getResearcherDashboard,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/doctor', authorize('doctor'), getDoctorDashboard);
router.get('/patient', authorize('patient'), getPatientDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/researcher', authorize('researcher'), getResearcherDashboard);

export default router;
