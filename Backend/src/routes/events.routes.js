import express from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventAnalytics,
  getEventInfo,
  getEventLeaderboard
} from '../controllers/events.controller.js';
import {
  listRegistrations,
  getRegistration,
  approveRegistration,
  rejectRegistration,
  assignBib,
  enterFinishTime,
  exportRegistrationsCSV,
  uploadFinishTimes
} from '../controllers/registrations.controller.js';
import {
  listEventTasks,
  createEventTask,
  updateTask,
  deleteTask
} from '../controllers/tasks-events.controller.js';
import {
  listEventVolunteers,
  addEventVolunteer,
  assignVolunteerRole,
  removeVolunteer
} from '../controllers/volunteers-events.controller.js';
import {
  getEventNotifications,
  broadcastNotification
} from '../controllers/notifications.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Event endpoints
router.get('/', listEvents);
router.get('/analytics', authenticateJWT, getEventAnalytics);
router.post('/', authenticateJWT, createEvent);
router.get('/:id', getEvent);
router.get('/:id/info', getEventInfo);
router.get('/:id/leaderboard', getEventLeaderboard);
router.patch('/:id', authenticateJWT, updateEvent);
router.delete('/:id', authenticateJWT, deleteEvent);

// Registration endpoints (nested under events)
router.get('/:eventId/registrations', authenticateJWT, listRegistrations);
router.get('/:eventId/registrations/export', authenticateJWT, exportRegistrationsCSV);
router.post('/:eventId/finish-times/upload', authenticateJWT, uploadFinishTimes);

// Task endpoints (nested under events)
router.get('/:eventId/tasks', authenticateJWT, listEventTasks);
router.post('/:eventId/tasks', authenticateJWT, createEventTask);

// Volunteer endpoints (nested under events)
router.get('/:eventId/volunteers', authenticateJWT, listEventVolunteers);
router.post('/:eventId/volunteers', authenticateJWT, addEventVolunteer);

// Notification endpoints (nested under events)
router.get('/:eventId/notifications', authenticateJWT, getEventNotifications);
router.post('/:eventId/notifications/broadcast', authenticateJWT, broadcastNotification);

export default router;
