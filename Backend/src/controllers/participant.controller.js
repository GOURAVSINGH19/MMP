import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import { sendEmail, buildWelcomeTemplate } from '../services/email.service.js';

// Register for the Marathon (Phase 3)
export const registerParticipant = async (req, res) => {
  const { name, email, phone, distance, tshirtSize, emergencyName, emergencyPhone } = req.body;

  if (!name || !email || !phone || !distance || !tshirtSize || !emergencyName || !emergencyPhone) {
    return res.status(400).json({ error: 'All fields are required to register for the marathon' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email is already registered' });
    }

    // Generate random secure password for the user
    const tempPassword = 'run_' + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Transaction to create User and Registration
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: 'PARTICIPANT'
        }
      });

      const registration = await tx.registration.create({
        data: {
          userId: user.id,
          distance,
          tshirtSize,
          emergencyName,
          emergencyPhone,
          status: 'REGISTERED'
        }
      });

      return { user, registration };
    });

    // Send Welcome Email with credentials
    const welcomeHtml = buildWelcomeTemplate(name, email, tempPassword);
    await sendEmail({
      to: email,
      subject: '🏆 Your Marathon Registration Details & Credentials',
      html: welcomeHtml
    });

    res.status(201).json({
      message: 'Registration successful! Your login credentials have been sent via email.',
      registration: result.registration,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email
      }
    });

  } catch (error) {
    console.error('❌ Participant registration error:', error);
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
        OR: [
          { id: id },
          { userId: id }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Marathon registration not found for this participant' });
    }

    res.json(registration);
  } catch (error) {
    console.error('❌ Get status error:', error);
    res.status(500).json({ error: 'Server error fetching participant status' });
  }
};

// Confirm Attendance (Phase 4)
export const confirmParticipation = async (req, res) => {
  const { userId } = req.body;
  const targetUserId = userId || req.user.id;

  try {
    const registration = await prisma.registration.findUnique({
      where: { userId: targetUserId }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'APPROVED') {
      return res.status(400).json({ error: `Cannot confirm participation when status is ${registration.status}. Status must be APPROVED.` });
    }

    const updated = await prisma.registration.update({
      where: { userId: targetUserId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date()
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
