import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import { sendEmail, buildWelcomeTemplate } from '../services/email.service.js';
import { resolveBibQrDisplay } from '../utils/qrcode.util.js';

const publicEventSelect = {
  id: true,
  name: true,
  description: true,
  date: true,
  registrationDeadline: true,
  location: true,
  eventStatus: true,
  distances: true,
  isPaid: true,
  registrationFee: true,
  currency: true,
  tax: true,
  convenienceFee: true,
  _count: {
    select: {
      registrations: true,
      volunteers: true,
      sponsors: true
    }
  }
};

const publicEventDetailSelect = {
  ...publicEventSelect,
  sponsors: {
    select: {
      id: true,
      name: true,
      category: true,
      logoUrl: true,
      website: true,
      description: true
    },
    orderBy: {
      category: 'asc'
    }
  }
};

const ensureDefaultEvent = async () => {
  const existingEvent = await prisma.event.findFirst({
    orderBy: { date: 'asc' }
  });

  if (existingEvent) return existingEvent;

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

export const getPublicEvents = async (req, res) => {
  try {
    await ensureDefaultEvent();

    const events = await prisma.event.findMany({
      select: publicEventSelect,
      orderBy: {
        date: 'asc'
      }
    });

    res.json(events);
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({ error: 'Server error retrieving public events' });
  }
};

export const getPublicEventById = async (req, res) => {
  const { id } = req.params;

  try {
    await ensureDefaultEvent();

    const event = await prisma.event.findUnique({
      where: { id },
      select: publicEventDetailSelect
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get public event detail error:', error);
    res.status(500).json({ error: 'Server error retrieving event details' });
  }
};

// Register for the Marathon
export const registerParticipant = async (req, res) => {
  const {
    name,
    email,
    phone,
    eventId,
    distance,
    tshirtSize,
    emergencyName,
    emergencyPhone,
    emergencyRelationship,
    gender,
    age,
    bloodGroup,
    medicalHistory,
    waiverAccepted,
  } = req.body;

  if (!name || !email || !phone || !distance || !tshirtSize || !emergencyName || !emergencyPhone) {
    return res.status(400).json({ error: 'All fields are required to register for the marathon' });
  }

  if (!waiverAccepted) {
    return res.status(400).json({ error: 'You must accept the event waiver and terms to register.' });
  }

  try {
    // Check if user already exists
    let existingUser = await prisma.user.findUnique({ where: { email } });

    const event = eventId
      ? await prisma.event.findUnique({ where: { id: eventId } })
      : await ensureDefaultEvent();

    if (!event) {
      return res.status(400).json({ error: 'No marathon event is available for registration yet' });
    }

    if (existingUser) {
      // Check if they are already registered for THIS event
      const existingRegistration = await prisma.registration.findUnique({
        where: {
          userId_eventId: {
            userId: existingUser.id,
            eventId: event.id
          }
        }
      });
      if (existingRegistration) {
        return res.status(400).json({ error: 'You are already registered for this event.' });
      }
    }

    if (event.distances.length > 0 && !event.distances.includes(distance)) {
      return res.status(400).json({ error: `Selected distance is not available for ${event.name}` });
    }

    if (event.eventStatus === 'REGISTRATION_CLOSED' || event.eventStatus === 'ARCHIVED' || event.eventStatus === 'COMPLETED') {
      return res.status(400).json({ error: `Registration is not open for ${event.name}` });
    }

    // Generate random secure password for the user (only used if new)
    const tempPassword = 'run_' + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Transaction to create/use User, Registration, and Payment (if paid)
    const result = await prisma.$transaction(async (tx) => {
      let user = existingUser;
      if (!user) {
        user = await tx.user.create({
          data: {
            name,
            email,
            phone,
            password: hashedPassword,
            platformRole: 'PARTICIPANT'
          }
        });
      }

      const initialStatus = event.isPaid ? 'PAYMENT_PENDING' : 'REGISTERED';

      const registration = await tx.registration.create({
        data: {
          userId: user.id,
          eventId: event.id,
          distance,
          tshirtSize,
          emergencyName,
          emergencyPhone,
          gender: gender || null,
          age: age ? parseInt(age, 10) : null,
          bloodGroup: bloodGroup || null,
          medicalHistory: medicalHistory || (emergencyRelationship ? `Emergency contact relationship: ${emergencyRelationship}` : null),
          status: initialStatus,
        },
      });

      // Avoid creating participant record if one already exists for this user/event
      const existingParticipant = await tx.participant.findFirst({
        where: { userId: user.id, eventId: event.id }
      });
      if (!existingParticipant) {
        await tx.participant.create({
          data: {
            userId: user.id,
            eventId: event.id
          }
        });
      }

      let payment = null;
      if (event.isPaid) {
        const amount = event.registrationFee + (event.tax || 0) + (event.convenienceFee || 0);
        const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        payment = await tx.payment.create({
          data: {
            registrationId: registration.id,
            userId: user.id,
            eventId: event.id,
            amount,
            currency: event.currency || 'INR',
            status: 'PENDING',
            orderId
          }
        });

        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            action: 'CHARGE',
            status: 'PENDING'
          }
        });

        await tx.paymentAuditLog.create({
          data: {
            paymentId: payment.id,
            userId: user.id,
            action: 'INITIATE',
            amount,
            details: `Registration payment initiated for ${amount} ${event.currency}`
          }
        });
      }

      return { user, registration, payment };
    });

    if (!event.isPaid) {
      try {
        const whatsappLink = (await prisma.whatsappGroup.findFirst({
          where: { eventId: event.id, groupType: 'COMMUNITY' }
        }))?.link || 'https://chat.whatsapp.com/xxxxx';

        const welcomeHtml = buildWelcomeTemplate(name, email, tempPassword, whatsappLink);
        await sendEmail({
          to: email,
          subject: 'Your Marathon Registration Details & Credentials',
          html: welcomeHtml
        });
      } catch (emailError) {
        console.warn('Welcome email could not be sent:', emailError.message);
      }
    }

    res.status(201).json({
      message: 'Registration successful!',
      isPaid: event.isPaid,
      paymentId: result.payment?.id || null,
      registration: result.registration,
      tempPassword,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email
      }
    });

  } catch (error) {
    console.error('Participant registration error:', error);
    res.status(500).json({ error: 'Server error during marathon registration' });
  }
};

// Get Participant Status (Phase 4)
export const getParticipantStatus = async (req, res) => {
  const { id } = req.params;

  try {
    // id could be the user ID or registration ID
    const registration = await prisma.registration.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        event: true,
        bib: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Marathon registration not found for this participant' });
    }

    const payments = await prisma.payment.findMany({
      where: { registrationId: registration.id },
      orderBy: { createdAt: 'desc' },
    });

    let bibQrUrl = null;
    if (registration.bib) {
      bibQrUrl = await resolveBibQrDisplay(
        registration.bib.QRCode,
        registration.userId,
        registration.bib.bibNumber
      );
    }

    res.json({
      ...registration,
      bibQrUrl,
      payments,
    });
  } catch (error) {
    console.error('❌ Get status error:', error);
    res.status(500).json({ error: 'Server error fetching participant status' });
  }
};

// Confirm Attendance (Phase 4)
export const confirmParticipation = async (req, res) => {
  const { userId, eventId, registrationId } = req.body;
  const targetUserId = userId || req.user.id;

  try {
    const registration = await prisma.registration.findFirst({
      where: {
        userId: targetUserId,
        ...(registrationId ? { id: registrationId } : {}),
        ...(eventId ? { eventId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'APPROVED') {
      return res.status(400).json({ error: `Cannot confirm participation when status is ${registration.status}. Status must be APPROVED.` });
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Participation successfully confirmed! Organizers will assign your BIB shortly.',
      registration: updated
    });
  } catch (error) {
    console.error('❌ Confirm participation error:', error);
    res.status(500).json({ error: 'Server error during participation confirmation' });
  }
};

const isPastEvent = (event) => {
  if (!event) return false;
  if (['COMPLETED', 'ARCHIVED'].includes(event.eventStatus)) return true;
  return new Date(event.date) < new Date();
};

const isHistoryRegistration = (registration) => {
  if (['WITHDRAWN', 'REFUNDED', 'COMPLETED'].includes(registration.status)) return true;
  return isPastEvent(registration.event);
};

const formatMyRegistration = (registration) => ({
  id: registration.id,
  status: registration.status,
  distance: registration.distance,
  tshirtSize: registration.tshirtSize,
  bibNumber: registration.bib?.bibNumber || null,
  finishTime: registration.finishTime || null,
  registeredAt: registration.createdAt,
  event: registration.event,
});

/** Current marathon registration + past participant event history */
export const getMyParticipantEvents = async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user.id },
      include: {
        bib: { select: { bibNumber: true } },
        event: {
          select: publicEventSelect,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const history = registrations.filter(isHistoryRegistration).map(formatMyRegistration);

    const active = registrations.filter((r) => !isHistoryRegistration(r));
    let current = null;
    if (active.length > 0) {
      const sorted = [...active].sort((a, b) => new Date(a.event.date) - new Date(b.event.date));
      current = formatMyRegistration(sorted[0]);
    }

    const registeredEventIds = registrations.map((r) => r.eventId);
    const availableWhere = {
      eventStatus: { in: ['PUBLISHED', 'REGISTRATION_OPEN', 'RACE_DAY'] },
    };
    if (registeredEventIds.length > 0) {
      availableWhere.id = { notIn: registeredEventIds };
    }
    const availableToRegister = await prisma.event.findMany({
      where: availableWhere,
      select: publicEventSelect,
      orderBy: { date: 'asc' },
    });

    res.json({
      current,
      history,
      availableToRegister,
    });
  } catch (error) {
    console.error('Get participant events error:', error);
    res.status(500).json({ error: 'Failed to load your marathon registrations' });
  }
};
