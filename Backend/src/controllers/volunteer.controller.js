import prisma from '../prisma/client.js';
import { parseQrPayload } from '../utils/qrcode.util.js';
import { ensureCertificateRecord } from '../utils/certificate.util.js';

export const scanQrCode = async (req, res) => {
  const { qrData, bibNumber: manualBib } = req.body;

  if (!qrData && !manualBib) {
    return res.status(400).json({ error: 'QR Code data or BIB number is required' });
  }

  try {
    const parsed = qrData ? parseQrPayload(qrData) : { userId: null, bibNumber: manualBib };
    if (!parsed?.bibNumber) {
      return res.status(400).json({ error: 'Invalid QR Code format. Expected userId:bibNumber.' });
    }

    const { userId, bibNumber, eventId: parsedEventId } = parsed;

    const assignment = await prisma.volunteerAssignment.findFirst({
      where: {
        userId: req.user.id,
        status: { in: ['ASSIGNED', 'ACTIVE'] },
      },
    });

    if (req.user.role === 'VOLUNTEER') {
      if (!assignment) {
        return res.status(403).json({ error: 'You are not assigned to an active marathon event.' });
      }
      if (!assignment.canScan) {
        return res.status(403).json({ error: 'Your volunteer role does not include QR scanner access.' });
      }
    }

    const scopedEventId = parsedEventId || assignment?.eventId;
    const registrationWhere = userId
      ? { userId, bib: { bibNumber }, ...(scopedEventId ? { eventId: scopedEventId } : {}) }
      : {
          bib: { bibNumber },
          ...(scopedEventId ? { eventId: scopedEventId } : {}),
        };

    const registration = await prisma.registration.findFirst({
      where: registrationWhere,
      include: {
        bib: true,
        event: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Participant not found or BIB number mismatch' });
    }

    let nextStatus = registration.status;
    let scanType = 'MANUAL_ENTRY';
    const volunteerRole = assignment?.volunteerRole || 'CHECK_IN';

    if (['CHECK_IN', 'REGISTRATION_DESK'].includes(volunteerRole) && registration.status === 'CONFIRMED') {
      nextStatus = 'BIB_COLLECTED';
      scanType = 'CHECK_IN';
    } else if (volunteerRole === 'FINISH_LINE' && registration.status === 'BIB_COLLECTED') {
      nextStatus = 'COMPLETED';
      scanType = 'FINISH_LINE';
    }

    const updatedRegistration = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        status: nextStatus,
        bibCollectedAt: nextStatus === 'BIB_COLLECTED' ? new Date() : registration.bibCollectedAt,
        finishedAt: nextStatus === 'COMPLETED' ? new Date() : registration.finishedAt
      }
    });

    if (registration.bib) {
      await prisma.bib.update({
        where: { id: registration.bib.id },
        data: {
          status: nextStatus === 'COMPLETED' ? 'FINISHED' : nextStatus === 'BIB_COLLECTED' ? 'COLLECTED' : registration.bib.status,
          collectedAt: nextStatus === 'BIB_COLLECTED' ? new Date() : registration.bib.collectedAt
        }
      });
    }

    if (nextStatus === 'COMPLETED') {
      await ensureCertificateRecord({
        id: registration.id,
        eventId: registration.eventId,
      });
    }
    
    const scanLog = await prisma.scanLog.create({
      data: {
        eventId: registration.eventId,
        registrationId: registration.id,
        bibId: registration.bibId,
        userId: req.user.id,
        scanType,
        volunteerRole,
      }
    });

    res.json({
      message: `Successfully scanned BIB ${bibNumber}!`,
      scanType,
      previousStatus: registration.status,
      currentStatus: nextStatus,
      participantName: registration.user.name,
      participantDistance: registration.distance,
      scanLog: {
        ...scanLog,
        bib: bibNumber,
        scannedBy: req.user.name || req.user.email,
        scannedAt: scanLog.timestamp
      },
      registration: updatedRegistration
    });

  } catch (error) {
    console.error('❌ QR scan error:', error);
    res.status(500).json({ error: 'Server error processing QR scan' });
  }
};

const formatVolunteerAssignment = (assignment) => ({
  id: assignment.id,
  volunteerRole: assignment.volunteerRole,
  status: assignment.status,
  canScan: assignment.canScan,
  assignedAt: assignment.assignedAt,
  shiftStart: assignment.shiftStart,
  shiftEnd: assignment.shiftEnd,
  event: assignment.event,
});

const isPastEvent = (event) => {
  if (!event) return false;
  if (['COMPLETED', 'ARCHIVED'].includes(event.eventStatus)) return true;
  return new Date(event.date) < new Date();
};

const isHistoryAssignment = (assignment) =>
  ['COMPLETED', 'CANCELLED'].includes(assignment.status) || isPastEvent(assignment.event);

/** Current marathon assignment + past volunteer event history */
export const getMyVolunteerEvents = async (req, res) => {
  try {
    const assignments = await prisma.volunteerAssignment.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            date: true,
            location: true,
            eventStatus: true,
            distances: true,
            registrationDeadline: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const history = assignments
      .filter(isHistoryAssignment)
      .map(formatVolunteerAssignment);

    const activeAssignments = assignments.filter((a) => !isHistoryAssignment(a));

    let current = null;
    if (activeAssignments.length > 0) {
      const sorted = [...activeAssignments].sort(
        (a, b) => new Date(a.event.date) - new Date(b.event.date)
      );
      current = formatVolunteerAssignment(sorted[0]);
    }

    const scanCounts = await prisma.scanLog.groupBy({
      by: ['eventId'],
      where: { userId: req.user.id },
      _count: { id: true },
    });
    const scanCountByEvent = Object.fromEntries(
      scanCounts.map((row) => [row.eventId, row._count.id])
    );

    const attachScanCount = (item) =>
      item
        ? {
            ...item,
            scanCount: scanCountByEvent[item.event.id] || 0,
          }
        : null;

    res.json({
      current: attachScanCount(current),
      history: history.map((item) => attachScanCount(item)),
    });
  } catch (error) {
    console.error('Get volunteer events error:', error);
    res.status(500).json({ error: 'Failed to load volunteer event assignments' });
  }
};

// Get Scan Logs (Phase 6 / Phase 10)
export const getScanLogs = async (req, res) => {
  try {
    const where =
      req.user.role === 'VOLUNTEER'
        ? { userId: req.user.id }
        : {};

    const logs = await prisma.scanLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        bib: true,
        volunteer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    res.json(logs.map((log) => ({
      id: log.id,
      bib: log.bib?.bibNumber || 'UNKNOWN',
      scanType: log.scanType,
      scannedBy: log.volunteer?.name || log.volunteer?.email || 'Unknown',
      scannedAt: log.timestamp,
      volunteerRole: log.volunteerRole
    })));
  } catch (error) {
    console.error('❌ Get scan logs error:', error);
    res.status(500).json({ error: 'Server error retrieving scan history' });
  }
};
