import prisma from '../prisma/client.js';
import { sendEmail, buildApprovedTemplate, buildBibAssignedTemplate, buildCertificateReadyTemplate } from '../services/email.service.js';
import { buildQrPayload, toQrDataUrl } from '../utils/qrcode.util.js';
import { ensureCertificateRecord } from '../utils/certificate.util.js';
import { writeAuditLog } from '../utils/audit.util.js';

const getDefaultEvent = async () => {
  let event = await prisma.event.findFirst({ orderBy: { date: 'asc' } });
  if (event) return event;

  const raceDate = new Date();
  raceDate.setDate(raceDate.getDate() + 45);
  raceDate.setHours(5, 30, 0, 0);

  const registrationDeadline = new Date(raceDate);
  registrationDeadline.setDate(registrationDeadline.getDate() - 7);
  registrationDeadline.setHours(23, 59, 0, 0);

  return prisma.event.create({
    data: {
      name: 'Metropolis Marathon 2026',
      description: 'City-wide marathon with 5K, 10K, half marathon, and full marathon categories.',
      date: raceDate,
      registrationDeadline,
      location: 'Metropolis Central Park',
      eventStatus: 'REGISTRATION_OPEN',
      distances: ['5K', '10K', '21K', '42K'],
      createdBy: 'SYSTEM'
    }
  });
};

// Get Admin Stats (Phase 5)
export const getStats = async (req, res) => {
  try {
    const totalEvents = await prisma.event.count();
    const activeEvents = await prisma.event.count({
      where: { eventStatus: { in: ['PUBLISHED', 'REGISTRATION_OPEN', 'RACE_DAY'] } }
    });
    const totalRegistrations = await prisma.registration.count();
    const pendingApprovals = await prisma.registration.count({
      where: { status: 'REGISTERED' }
    });
    const finishers = await prisma.registration.count({
      where: { status: 'COMPLETED' }
    });
    const volunteers = await prisma.user.count({
      where: { platformRole: 'VOLUNTEER' }
    });
    const sponsors = await prisma.sponsor.count();
    const tasks = await prisma.task.groupBy({
      by: ['status'],
      _count: true
    });

    res.json({
      totalEvents,
      activeEvents,
      totalRegistrations,
      pendingApprovals,
      finishers,
      volunteers,
      sponsors,
      taskStatusCounts: tasks.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {})
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error retrieving statistics' });
  }
};

export const getEvents = async (req, res) => {
  try {
    await getDefaultEvent();
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
            volunteers: true,
            sponsors: true,
            tasks: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error retrieving events' });
  }
};

export const saveEvent = async (req, res) => {
  const { 
    id, name, description, date, registrationDeadline, location, eventStatus, distances,
    isPaid, registrationFee, currency, tax, convenienceFee 
  } = req.body;

  if (!name || !date || !location) {
    return res.status(400).json({ error: 'Event name, date, and location are required' });
  }

  try {
    const data = {
      name,
      description: description || '',
      date: new Date(date),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      location,
      eventStatus: eventStatus || 'DRAFT',
      distances: Array.isArray(distances) && distances.length ? distances : ['5K', '10K', '21K', '42K'],
      createdBy: req.user.id || 'SYSTEM',
      isPaid: isPaid === true || isPaid === 'true',
      registrationFee: parseFloat(registrationFee) || 0.0,
      currency: currency || 'INR',
      tax: parseFloat(tax) || 0.0,
      convenienceFee: parseFloat(convenienceFee) || 0.0
    };

    const event = id
      ? await prisma.event.update({ where: { id }, data })
      : await prisma.event.create({ data });

    res.status(id ? 200 : 201).json(event);
  } catch (error) {
    console.error('Save event error:', error);
    res.status(500).json({ error: 'Server error saving event' });
  }
};

export const getSponsors = async (req, res) => {
  try {
    const sponsors = await prisma.sponsor.findMany({
      include: { event: { select: { id: true, name: true } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    res.json(sponsors);
  } catch (error) {
    console.error('Get sponsors error:', error);
    res.status(500).json({ error: 'Server error retrieving sponsors' });
  }
};

export const createSponsor = async (req, res) => {
  const { eventId, name, category, website, description, contactName, contactEmail, contactPhone } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Sponsor name and category are required' });
  }

  try {
    const event = eventId ? await prisma.event.findUnique({ where: { id: eventId } }) : await getDefaultEvent();
    const sponsor = await prisma.sponsor.create({
      data: {
        eventId: event.id,
        name,
        category,
        website,
        description,
        contactName,
        contactEmail,
        contactPhone
      }
    });
    res.status(201).json(sponsor);
  } catch (error) {
    console.error('Create sponsor error:', error);
    res.status(500).json({ error: 'Server error creating sponsor' });
  }
};

export const getVolunteers = async (req, res) => {
  try {
    const volunteers = await prisma.volunteerAssignment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        event: { select: { id: true, name: true } }
      },
      orderBy: { assignedAt: 'desc' }
    });
    res.json(volunteers);
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: 'Server error retrieving volunteers' });
  }
};

// Get Available Volunteers (not yet assigned to this event)
export const getAvailableVolunteers = async (req, res) => {
  try {
    const { eventId } = req.query;
    const event = eventId ? await prisma.event.findUnique({ where: { id: eventId } }) : await getDefaultEvent();

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get all approved volunteers
    const allApprovedVolunteers = await prisma.user.findMany({
      where: {
        platformRole: 'VOLUNTEER',
        volunteerProfile: {
          status: 'APPROVED'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    });

    // Get already assigned volunteers for this event
    const assignedVolunteers = await prisma.volunteerAssignment.findMany({
      where: { eventId: event.id },
      select: { userId: true }
    });

    const assignedUserIds = new Set(assignedVolunteers.map(v => v.userId));

    // Filter out already assigned volunteers
    const availableVolunteers = allApprovedVolunteers.filter(v => !assignedUserIds.has(v.id));

    res.json(availableVolunteers);
  } catch (error) {
    console.error('Get available volunteers error:', error);
    res.status(500).json({ error: 'Server error retrieving available volunteers' });
  }
};

export const assignVolunteer = async (req, res) => {
  const { userId, name, email, phone, eventId, volunteerRole } = req.body;

  // Either userId (existing volunteer) or name+email+phone (new volunteer) must be provided
  if (!volunteerRole) {
    return res.status(400).json({ error: 'Volunteer role is required' });
  }

  if (!userId && (!name || !email || !phone)) {
    return res.status(400).json({ error: 'Either provide userId for existing volunteer or name, email, phone for new volunteer' });
  }

  try {
    const event = eventId ? await prisma.event.findUnique({ where: { id: eventId } }) : await getDefaultEvent();
    const canScan = ['CHECK_IN', 'REGISTRATION_DESK', 'FINISH_LINE'].includes(volunteerRole);

    let user;

    if (userId) {
      // Existing volunteer - just use the provided userId
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'Volunteer user not found' });
      }
    } else {
      // New volunteer - create or update user
      user = await prisma.user.upsert({
        where: { email },
        update: { name, phone, platformRole: 'VOLUNTEER' },
        create: { name, email, phone, platformRole: 'VOLUNTEER' }
      });

      await prisma.volunteerProfile.upsert({
        where: { userId: user.id },
        update: { status: 'APPROVED', approvedAt: new Date(), approvedBy: req.user.id },
        create: { userId: user.id, status: 'APPROVED', approvedAt: new Date(), approvedBy: req.user.id }
      });
    }

    const assignment = await prisma.volunteerAssignment.upsert({
      where: { userId_eventId: { userId: user.id, eventId: event.id } },
      update: { volunteerRole, canScan, assignedBy: req.user.id },
      create: { userId: user.id, eventId: event.id, volunteerRole, canScan, assignedBy: req.user.id }
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Assign volunteer error:', error);
    res.status(500).json({ error: 'Server error assigning volunteer' });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const members = await prisma.teamMember.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        event: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Server error retrieving team members' });
  }
};

export const createTeamMember = async (req, res) => {
  const { name, email, phone, eventId, permissions } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Team member name, email, and phone are required' });
  }

  try {
    const event = eventId ? await prisma.event.findUnique({ where: { id: eventId } }) : await getDefaultEvent();
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, phone, platformRole: 'TEAM_MEMBER' },
      create: { name, email, phone, platformRole: 'TEAM_MEMBER' }
    });

    const member = await prisma.teamMember.upsert({
      where: { userId_eventId: { userId: user.id, eventId: event.id } },
      update: { permissions: permissions || ['VIEW_EVENT'], invitedBy: req.user.id },
      create: { userId: user.id, eventId: event.id, invitedBy: req.user.id, permissions: permissions || ['VIEW_EVENT'] }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ error: 'Server error creating team member' });
  }
};

export const getReports = async (req, res) => {
  try {
    const [
      registrationStatus,
      volunteerRoles,
      sponsorCategories,
      certificates,
      recentAuditLogs
    ] = await Promise.all([
      prisma.registration.groupBy({ by: ['status'], _count: true }),
      prisma.volunteerAssignment.groupBy({ by: ['volunteerRole'], _count: true }),
      prisma.sponsor.groupBy({ by: ['category'], _count: true }),
      prisma.certificate.count(),
      prisma.auditLog.findMany({ take: 20, orderBy: { timestamp: 'desc' }, include: { user: { select: { name: true, email: true } } } })
    ]);

    res.json({
      registrationStatus,
      volunteerRoles,
      sponsorCategories,
      certificates,
      recentAuditLogs
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error retrieving reports' });
  }
};

// Get All Participants (Phase 5)
export const getParticipants = async (req, res) => {
  try {
    const participants = await prisma.registration.findMany({
      include: {
        bib: true,
        event: {
          select: {
            id: true,
            name: true,
            isPaid: true,
            registrationFee: true,
            currency: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            platformRole: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(participants);
  } catch (error) {
    console.error('❌ Get participants error:', error);
    res.status(500).json({ error: 'Server error retrieving participants list' });
  }
};

// Approve Participant Registration (Phase 5)
export const approveParticipant = async (req, res) => {
  const { participantId } = req.body;

  if (!participantId) {
    return res.status(400).json({ error: 'Participant/Registration ID is required' });
  }

  try {
    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { id: participantId },
          { userId: participantId }
        ]
      },
      include: { user: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Participant registration not found' });
    }

    if (registration.status !== 'REGISTERED') {
      return res.status(400).json({ error: `Cannot approve registration when status is ${registration.status}` });
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: { status: 'APPROVED' }
    });

    // Send Approval Email
    const approvedHtml = buildApprovedTemplate(registration.user.name);
    await sendEmail({
      to: registration.user.email,
      subject: '🎉 Your Marathon Registration Has Been Approved!',
      html: approvedHtml
    });

    res.json({
      message: 'Participant registration approved! Notification email sent.',
      registration: updated
    });
  } catch (error) {
    console.error('❌ Approve participant error:', error);
    res.status(500).json({ error: 'Server error during participant approval' });
  }
};

// Assign BIB & Generate QR (Phase 5 & 6)
export const assignBib = async (req, res) => {
  const { participantId, bib } = req.body;

  if (!participantId || !bib) {
    return res.status(400).json({ error: 'Participant/Registration ID and BIB number are required' });
  }

  try {
    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { id: participantId },
          { userId: participantId }
        ]
      },
      include: { user: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const qrPayload = buildQrPayload(registration.userId, bib);
    const qrCodeDataUrl = await toQrDataUrl(qrPayload);

    const eventId = registration.eventId;
    const bibRecord = await prisma.bib.upsert({
      where: {
        eventId_bibNumber: {
          eventId,
          bibNumber: bib
        }
      },
      update: {
        QRCode: qrPayload,
        status: 'ASSIGNED',
        assignedTo: registration.userId,
        assignedAt: new Date()
      },
      create: {
        eventId,
        bibNumber: bib,
        QRCode: qrPayload,
        status: 'ASSIGNED',
        assignedTo: registration.userId,
        assignedAt: new Date()
      }
    });

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        bibId: bibRecord.id,
        status: registration.status === 'CONFIRMED' ? 'BIB_COLLECTED'
              : registration.status === 'APPROVED'   ? 'CONFIRMED'
              : registration.status
      },
      include: { bib: true, user: true }
    });

    // Send BIB Assignment Email
    const bibHtml = buildBibAssignedTemplate(registration.user.name, bib, qrCodeDataUrl);
    await sendEmail({
      to: registration.user.email,
      subject: `🎫 Your Marathon BIB Number is Assigned: ${bib}`,
      html: bibHtml
    });

    await writeAuditLog({
      userId: req.user.id,
      eventId,
      action: 'ASSIGN_BIB',
      entity: 'Registration',
      entityId: registration.id,
      changes: { bib, qrPayload },
    });

    res.json({
      message: 'BIB assigned and check-in QR code generated successfully!',
      registration: updated,
      bibQrUrl: qrCodeDataUrl,
    });
  } catch (error) {
    console.error('❌ Assign BIB error:', error);
    res.status(500).json({ error: 'Server error during BIB assignment' });
  }
};

// Enter Finish Time (Phase 5)
export const enterFinishTime = async (req, res) => {
  const { participantId, finishTime } = req.body;

  if (!participantId || !finishTime) {
    return res.status(400).json({ error: 'Participant/Registration ID and finish time are required' });
  }

  try {
    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { id: participantId },
          { userId: participantId }
        ]
      },
      include: { user: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        finishTime,
        status: 'COMPLETED',
        finishedAt: new Date(),
      },
    });

    await ensureCertificateRecord({ ...updated, eventId: registration.eventId });

    await writeAuditLog({
      userId: req.user.id,
      eventId: registration.eventId,
      action: 'RECORD_FINISH',
      entity: 'Registration',
      entityId: registration.id,
      changes: { finishTime },
    });

    // Send Finisher / Certificate Ready Email
    const certificateHtml = buildCertificateReadyTemplate(
      registration.user.name,
      finishTime,
      registration.distance
    );
    await sendEmail({
      to: registration.user.email,
      subject: `🏅 Congratulations Marathon Finisher! Your Finish Stats Inside`,
      html: certificateHtml
    });

    res.json({
      message: 'Marathon finish time recorded successfully and finisher email sent!',
      registration: updated
    });
  } catch (error) {
    console.error('❌ Enter finish time error:', error);
    res.status(500).json({ error: 'Server error recording finish time' });
  }
};
