import express from 'express';
import { scanQrCode, getScanLogs } from '../controllers/volunteer.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Both VOLUNTEER and ORGANIZER roles can access scanning features
router.use(authenticateJWT, requireRole('VOLUNTEER', 'ORGANIZER'));

router.post('/scan', scanQrCode);
router.get('/scan-logs', getScanLogs);

export default router;
