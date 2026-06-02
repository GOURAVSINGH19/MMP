import prisma from '../prisma/client.js';

const scannerRoles = new Set(['CHECK_IN', 'REGISTRATION_DESK', 'FINISH_LINE']);

const normalizeVolunteerRole = (value) => {
  const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const aliases = {
    WATER: 'WATER_STATION',
    CHECKIN: 'CHECK_IN',
    CHECK_IN_VOLUNTEER: 'CHECK_IN',
    ROUTE: 'ROUTE_MARSHAL',
    MARSHAL: 'ROUTE_MARSHAL',
    FINISH: 'FINISH_LINE'
  };
  return aliases[normalized] || normalized;
};

const applicationInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  event: { select: { id: true, name: true, date: true, location: true, eventStatus: true } }
};

export const applyForVolunteer = async (req, res) => {
  const { eventId, volunteerType, availability, experience } = req.body;

  if (!eventId || !volunteerType) {
    return res.status(400).json({ error: 'Event and volunteer type are required' });
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (['COMPLETED', 'ARCHIVED'].includes(event.eventStatus)) {
      return res.status(400).json({ error: 'Volunteer applications are closed for this event' });
    }

    const application = await prisma.volunteerApplication.upsert({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId
        }
      },
      update: {
        volunteerType,
        availability: availability || null,
        experience: experience || null,
        approvalStatus: 'PENDING',
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null
      },
      create: {
        userId: req.user.id,
        eventId,
        volunteerType,
        availability: availability || null,
        experience: experience || null
      },
      include: applicationInclude
    });

    res.status(201).json({
      message: 'Volunteer application submitted. Awaiting organizer approval.',
      application
    });
  } catch (error) {
    console.error('Volunteer application error:', error);
    res.status(500).json({ error: 'Failed to submit volunteer application' });
  }
};

export const getMyVolunteerApplications = async (req, res) => {
  try {
    const applications = await prisma.volunteerApplication.findMany({
      where: { userId: req.user.id },
      include: applicationInclude,
      orderBy: { createdAt: 'desc' }
    });

    res.json(applications);
  } catch (error) {
    console.error('Get my volunteer applications error:', error);
    res.status(500).json({ error: 'Failed to load volunteer applications' });
  }
};

export const getEventVolunteerApplications = async (req, res) => {
  const { eventId } = req.params;

  try {
    const applications = await prisma.volunteerApplication.findMany({
      where: { eventId },
      include: applicationInclude,
      orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(applications);
  } catch (error) {
    console.error('Get event volunteer applications error:', error);
    res.status(500).json({ error: 'Failed to load volunteer applications' });
  }
};

export const approveVolunteerApplication = async (req, res) => {
  const { id } = req.params;
  const { assignedLocation, assignedShift, reportingManager } = req.body;

  try {
    const application = await prisma.volunteerApplication.findUnique({
      where: { id },
      include: applicationInclude
    });

    if (!application) {
      return res.status(404).json({ error: 'Volunteer application not found' });
    }

    const volunteerRole = normalizeVolunteerRole(application.volunteerType);
    const result = await prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.volunteerApplication.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          assignedLocation: assignedLocation || application.assignedLocation,
          assignedShift: assignedShift || application.assignedShift,
          reportingManager: reportingManager || application.reportingManager,
          reviewedBy: req.user.id,
          reviewedAt: new Date()
        },
        include: applicationInclude
      });

      const assignment = await tx.volunteerAssignment.upsert({
        where: {
          userId_eventId: {
            userId: application.userId,
            eventId: application.eventId
          }
        },
        update: {
          volunteerRole,
          canScan: scannerRoles.has(volunteerRole),
          assignedLocation: assignedLocation || application.assignedLocation,
          assignedShift: assignedShift || application.assignedShift,
          reportingManager: reportingManager || application.reportingManager,
          status: 'ASSIGNED'
        },
        create: {
          userId: application.userId,
          eventId: application.eventId,
          volunteerRole,
          canScan: scannerRoles.has(volunteerRole),
          assignedBy: req.user.id,
          assignedLocation: assignedLocation || application.assignedLocation,
          assignedShift: assignedShift || application.assignedShift,
          reportingManager: reportingManager || application.reportingManager
        }
      });

      await tx.user.update({
        where: { id: application.userId },
        data: { platformRole: 'VOLUNTEER' }
      });

      return { application: updatedApplication, assignment };
    });

    res.json({
      message: 'Volunteer application approved and assignment created.',
      ...result
    });
  } catch (error) {
    console.error('Approve volunteer application error:', error);
    res.status(500).json({ error: 'Failed to approve volunteer application' });
  }
};

export const rejectVolunteerApplication = async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  try {
    const application = await prisma.volunteerApplication.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: rejectionReason || null,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      include: applicationInclude
    });

    res.json({ message: 'Volunteer application rejected.', application });
  } catch (error) {
    console.error('Reject volunteer application error:', error);
    res.status(500).json({ error: 'Failed to reject volunteer application' });
  }
};
