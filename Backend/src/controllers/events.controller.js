import prisma from '../prisma/client.js';

export const listEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        managers: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(events.map(event => ({
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      location: event.location,
      status: event.eventStatus,
      distances: event.distances,
      managers: event.managers.map(m => ({
        id: m.userId,
        name: m.user.name,
        email: m.user.email
      }))
    })));
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        managers: {
          include: { user: true }
        },
        registrations: true,
        volunteers: true,
        tasks: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      registrationDeadline: event.registrationDeadline,
      location: event.location,
      status: event.eventStatus,
      distances: event.distances,
      registrationCount: event.registrations.length,
      volunteerCount: event.volunteers.length,
      managers: event.managers.map(m => ({
        id: m.userId,
        name: m.user.name,
        email: m.user.email
      }))
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { name, description, date, registrationDeadline, location, distances } = req.body;

    if (!name || !date || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        location,
        distances: distances || ['5K', '10K', '21K', '42K'],
        createdBy: req.user.id
      }
    });

    res.status(201).json({
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      status: event.eventStatus
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, date, registrationDeadline, location, distances, status } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(registrationDeadline && { registrationDeadline: new Date(registrationDeadline) }),
        ...(location && { location }),
        ...(distances && { distances }),
        ...(status && { eventStatus: status })
      }
    });

    res.json({
      id: event.id,
      name: event.name,
      status: event.eventStatus
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

export const getEventAnalytics = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        registrations: true,
        volunteers: true,
        tasks: true
      }
    });

    const analytics = events.map(event => ({
      id: event.id,
      name: event.name,
      participantCount: event.registrations.length,
      volunteerCount: event.volunteers.length,
      taskCount: event.tasks.length,
      status: event.eventStatus
    }));

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

export const getEventInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      location: event.location,
      distances: event.distances,
      status: event.eventStatus
    });
  } catch (error) {
    console.error('Error fetching event info:', error);
    res.status(500).json({ error: 'Failed to fetch event info' });
  }
};

export const getEventLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { distance } = req.query;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!['COMPLETED', 'ARCHIVED'].includes(event.eventStatus)) {
      return res.json({
        eventName: event.name,
        eventStatus: event.eventStatus,
        distances: event.distances,
        leaderboard: []
      });
    }

    const where = {
      eventId: id,
      status: 'COMPLETED'
    };

    if (distance) {
      where.distance = distance;
    }

    const completedRegistrations = await prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        bib: {
          select: {
            bibNumber: true
          }
        }
      },
      orderBy: {
        finishTime: 'asc'
      }
    });

    const leaderboard = completedRegistrations.map((reg, index) => ({
      rank: index + 1,
      id: reg.id,
      userId: reg.userId,
      runnerName: reg.user.name,
      runnerEmail: reg.user.email,
      distance: reg.distance,
      bibNumber: reg.bib?.bibNumber || 'N/A',
      finishTime: reg.finishTime,
      finishedAt: reg.finishedAt
    }));

    res.json({
      eventName: event.name,
      eventStatus: event.eventStatus,
      distances: event.distances,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
