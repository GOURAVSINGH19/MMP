import express from 'express';
import { getStats, getParticipants, approveParticipant, assignBib, enterFinishTime } from '../controllers/admin.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply Authentication and Organizer Role requirement to all admin routes
router.use(authenticateJWT, requireRole('ORGANIZER'));

router.get('/stats', getStats);
router.get('/participants', getParticipants);
router.post('/approve', approveParticipant);
router.post('/assign-bib', assignBib);
router.post('/finish-time', enterFinishTime);

export default router;
