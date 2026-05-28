import express from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply Authentication requirement to all task routes
router.use(authenticateJWT);

// Get tasks and update tasks are available to logged in users (organizers & volunteers)
router.get('/', getTasks);
router.put('/:id', updateTask);

// Task creation and deletion are restricted to organizers only
router.post('/', requireRole('ORGANIZER'), createTask);
router.delete('/:id', requireRole('ORGANIZER'), deleteTask);

export default router;
