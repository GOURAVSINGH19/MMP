import express from 'express';
import {
  applyForVolunteer,
  approveVolunteerApplication,
  getEventVolunteerApplications,
  getMyVolunteerApplications,
  rejectVolunteerApplication
} from '../controllers/volunteerApplication.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateJWT, applyForVolunteer);
router.get('/my', authenticateJWT, getMyVolunteerApplications);
router.get('/event/:eventId', authenticateJWT, getEventVolunteerApplications);
router.patch('/:id/approve', authenticateJWT, approveVolunteerApplication);
router.patch('/:id/reject', authenticateJWT, rejectVolunteerApplication);

export default router;
