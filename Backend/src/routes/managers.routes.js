import express from 'express';
import {
  listManagers,
  createManager,
  updateManager,
  removeManager,
  assignEventToManager
} from '../controllers/managers.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateJWT, requireRole('SUPER_ADMIN'));

router.get('/', listManagers);
router.post('/', createManager);
router.patch('/:id', updateManager);
router.delete('/:id', removeManager);
router.post('/:managerId/assign', assignEventToManager);

export default router;
