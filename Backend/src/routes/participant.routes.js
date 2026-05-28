import express from 'express';
import { registerParticipant, getParticipantStatus, confirmParticipation } from '../controllers/participant.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public registration endpoint
router.post('/register', registerParticipant);

// Authenticated status and confirmation endpoints
router.get('/status/:id', authenticateJWT, getParticipantStatus);
router.post('/confirm', authenticateJWT, confirmParticipation);

export default router;
