import prisma from '../prisma/client.js';

export const listEventVolunteers = async (req, res) => {
  try {
    const { eventId } = req.params;

    const volunteers = await prisma.volunteerAssignment.findMany({
      where: { eventId },
      include: { user: true },
      orderBy: { assignedAt: 'desc' }
    });

    res.json(volunteers.map(v => ({
      id: v.id,
      userId: v.userId,
      name: v.user.name,
      email: v.user.email,
      role: v.volunteerRole,
      canScan: v.canScan,
      status: v.status,
      shiftStart: v.shiftStart,
      shiftEnd: v.shiftEnd,
      assignedAt: v.assignedAt
    })));
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
};

export const addEventVolunteer = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, role, shiftStart, shiftEnd } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    const volunteer = await prisma.volunteerAssignment.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      },
      update: {
        volunteerRole: role,
        ...(shiftStart && { shiftStart: new Date(shiftStart) }),
        ...(shiftEnd && { shiftEnd: new Date(shiftEnd) })
      },
      create: {
        userId,
        eventId,
        volunteerRole: role,
        assignedBy: req.user.id,
        ...(shiftStart && { shiftStart: new Date(shiftStart) }),
        ...(shiftEnd && { shiftEnd: new Date(shiftEnd) })
      },
      include: { user: true }
    });

    res.json({
      id: volunteer.id,
      name: volunteer.user.name,
      role: volunteer.volunteerRole,
      status: volunteer.status
    });
  } catch (error) {
    console.error('Error adding volunteer:', error);
    res.status(500).json({ error: 'Failed to add volunteer' });
  }
};

export const assignVolunteerRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const volunteer = await prisma.volunteerAssignment.update({
      where: { id },
      data: { volunteerRole: role },
      include: { user: true }
    });

    res.json({
      id: volunteer.id,
      name: volunteer.user.name,
      role: volunteer.volunteerRole
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

export const removeVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.volunteerAssignment.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing volunteer:', error);
    res.status(500).json({ error: 'Failed to remove volunteer' });
  }
};

export const scanBib = async (req, res) => {
  try {
    const { bibCode } = req.body;

    if (!bibCode) {
      return res.status(400).json({ error: 'Bib code is required' });
    }

    const bib = await prisma.bib.findUnique({
      where: { QRCode: bibCode },
      include: {
        registrations: {
          include: { user: true }
        }
      }
    });

    if (!bib) {
      return res.status(404).json({ error: 'Bib not found' });
    }

    const registration = bib.registrations[0];

    await prisma.scanLog.create({
      data: {
        eventId: bib.eventId,
        registrationId: registration.id,
        bibId: bib.id,
        userId: req.user.id,
        scanType: 'CHECK_IN'
      }
    });

    res.json({
      bibNumber: bib.bibNumber,
      participantName: registration.user.name,
      scannedAt: new Date()
    });
  } catch (error) {
    console.error('Error scanning bib:', error);
    res.status(500).json({ error: 'Failed to scan bib' });
  }
};

export const manualBibEntry = async (req, res) => {
  try {
    const { bibNumber, eventId } = req.body;

    if (!bibNumber || !eventId) {
      return res.status(400).json({ error: 'Bib number and event ID are required' });
    }

    const bib = await prisma.bib.findFirst({
      where: {
        eventId,
        bibNumber
      },
      include: {
        registrations: {
          include: { user: true }
        }
      }
    });

    if (!bib) {
      return res.status(404).json({ error: 'Bib not found' });
    }

    const registration = bib.registrations[0];

    const scanLog = await prisma.scanLog.create({
      data: {
        eventId,
        registrationId: registration.id,
        bibId: bib.id,
        userId: req.user.id,
        scanType: 'MANUAL_ENTRY'
      }
    });

    res.json({
      bibNumber: bib.bibNumber,
      participantName: registration.user.name,
      scannedAt: scanLog.timestamp
    });
  } catch (error) {
    console.error('Error manual entry:', error);
    res.status(500).json({ error: 'Failed to process manual entry' });
  }
};

export const getScanHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const scans = await prisma.scanLog.findMany({
      where: { userId },
      include: {
        registration: {
          include: { user: true }
        },
        bib: true
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json(scans.map(scan => ({
      id: scan.id,
      bibNumber: scan.bib.bibNumber,
      participantName: scan.registration.user.name,
      scanType: scan.scanType,
      timestamp: scan.timestamp,
      location: scan.location
    })));
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
};
