import express from 'express';
import {
  updateTask,
  deleteTask,
  getVolunteerTasks
} from '../controllers/tasks-events.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/me/tasks', authenticateJWT, getVolunteerTasks);
router.patch('/:id', authenticateJWT, updateTask);
router.delete('/:id', authenticateJWT, deleteTask);

export default router;
