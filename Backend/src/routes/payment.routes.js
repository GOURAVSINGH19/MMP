import express from 'express';
import {
  initiatePayment,
  handlePaytmCallback,
  paymentGatewayWebhook,
  requestRefund,
  processRefund,
  getPaymentDashboard,
  getWhatsappGroups,
  upsertWhatsappGroup,
  getPaymentAuditLogs,
  getPaymentById
} from '../controllers/payment.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/webhook', paymentGatewayWebhook);
router.post('/', authenticateJWT, initiatePayment);
router.get('/:paymentId', authenticateJWT, getPaymentById);
router.post('/:paymentId/mock-callback', authenticateJWT, handlePaytmCallback);
router.post('/refund', authenticateJWT, requestRefund);
router.patch('/refund/:id', authenticateJWT, requireRole('ORGANIZER'), processRefund);
router.get('/dashboard/:eventId', authenticateJWT, requireRole('ORGANIZER'), getPaymentDashboard);
router.get('/whatsapp-groups/:eventId', authenticateJWT, getWhatsappGroups);
router.post('/whatsapp-groups/:eventId', authenticateJWT, requireRole('ORGANIZER'), upsertWhatsappGroup);
router.get('/audit-logs/:eventId', authenticateJWT, requireRole('ORGANIZER'), getPaymentAuditLogs);

export default router;
