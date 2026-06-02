import express from 'express';
import {
  downloadSampleCSV,
  importCSV,
  exportData,
  getImportJobLogs,
  getImportExportJobsList
} from '../controllers/csv.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/sample/:type', authenticateJWT, downloadSampleCSV);
router.post('/import/:eventId', authenticateJWT, requireRole('ORGANIZER'), importCSV);
router.get('/export/:eventId', authenticateJWT, requireRole('ORGANIZER'), exportData);
router.get('/import-job/:jobId', authenticateJWT, requireRole('ORGANIZER'), getImportJobLogs);
router.get('/import-jobs/:eventId', authenticateJWT, requireRole('ORGANIZER'), getImportExportJobsList);

export default router;
