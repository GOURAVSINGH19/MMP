import express from 'express';
import {
  getParticipantStatus,
  getParticipantCertificate
} from '../controllers/participant-antigravity.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/me', authenticateJWT, getParticipantStatus);
router.get('/me/certificate', authenticateJWT, getParticipantCertificate);

export default router;
