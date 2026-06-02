import express from 'express';
import {
  getStats,
  getParticipants,
  approveParticipant,
  assignBib,
  enterFinishTime,
  getEvents,
  saveEvent,
  getSponsors,
  createSponsor,
  getVolunteers,
  getAvailableVolunteers,
  assignVolunteer,
  getTeamMembers,
  createTeamMember,
  getReports
} from '../controllers/admin.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply Authentication and Organizer Role requirement to all admin routes
router.use(authenticateJWT, requireRole('ORGANIZER'));

router.get('/stats', getStats);
router.get('/events', getEvents);
router.post('/events', saveEvent);
router.get('/participants', getParticipants);
router.post('/approve', approveParticipant);
router.post('/assign-bib', assignBib);
router.post('/finish-time', enterFinishTime);
router.get('/sponsors', getSponsors);
router.post('/sponsors', createSponsor);
router.get('/volunteers', getVolunteers);
router.get('/available-volunteers', getAvailableVolunteers);
router.post('/volunteers', assignVolunteer);
router.get('/team-members', getTeamMembers);
router.post('/team-members', createTeamMember);
router.get('/reports', getReports);

export default router;
