import express from 'express';
import {
  registerParticipant,
  getParticipantStatus,
  confirmParticipation,
  getPublicEvents,
  getPublicEventById,
  getMyParticipantEvents,
} from '../controllers/participant.controller.js';
import { getParticipantStatus as getParticipantStatusAG, getParticipantCertificate } from '../controllers/participant-antigravity.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public registration endpoint
router.get('/events', getPublicEvents);
router.get('/events/:id', getPublicEventById);
router.post('/register', registerParticipant);

// Authenticated status and confirmation endpoints
router.get('/my-events', authenticateJWT, getMyParticipantEvents);
router.get('/status/:id', authenticateJWT, getParticipantStatus);
router.post('/confirm', authenticateJWT, confirmParticipation);

// Antigravity endpoints
router.get('/me', authenticateJWT, getParticipantStatusAG);
router.get('/me/certificate', authenticateJWT, getParticipantCertificate);

export default router;
