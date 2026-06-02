import express from 'express';
import {
  assignVolunteerRole,
  removeVolunteer,
  scanBib,
  manualBibEntry,
  getScanHistory
} from '../controllers/volunteers-events.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/me/scans', authenticateJWT, getScanHistory);
router.post('/scan', authenticateJWT, scanBib);
router.post('/scan/manual', authenticateJWT, manualBibEntry);
router.patch('/:id/role', authenticateJWT, assignVolunteerRole);
router.delete('/:id', authenticateJWT, removeVolunteer);

export default router;
