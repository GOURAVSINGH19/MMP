import express from 'express';
import {
  getRegistration,
  approveRegistration,
  rejectRegistration,
  assignBib,
  enterFinishTime,
  bulkApproveRegistrations,
  bulkAssignBibs,
  bulkAssignVolunteers,
  bulkSendNotifications,
  bulkRegenerateCertificates
} from '../controllers/registrations.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Registration endpoints
router.get('/:id', authenticateJWT, getRegistration);
router.patch('/:id/approve', authenticateJWT, approveRegistration);
router.patch('/:id/reject', authenticateJWT, rejectRegistration);
router.patch('/:id/bib', authenticateJWT, assignBib);
router.patch('/:id/finish-time', authenticateJWT, enterFinishTime);

// Bulk operations (Managers/Admin only)
router.post('/bulk-approve', authenticateJWT, bulkApproveRegistrations);
router.post('/bulk-assign-bibs', authenticateJWT, bulkAssignBibs);
router.post('/bulk-assign-volunteers', authenticateJWT, bulkAssignVolunteers);
router.post('/bulk-notify', authenticateJWT, bulkSendNotifications);
router.post('/bulk-regenerate-certs', authenticateJWT, bulkRegenerateCertificates);

export default router;
