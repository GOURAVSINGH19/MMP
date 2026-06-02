import express from 'express';
import prisma from '../prisma/client.js';
import { generateCertificatePDF } from '../services/pdf.service.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:participantId', authenticateJWT, async (req, res) => {
  const { participantId } = req.params;

  try {
    const registration = await prisma.registration.findFirst({
      where: {
        OR: [{ id: participantId }, { userId: participantId }],
      },
      include: {
        user: { select: { name: true, email: true, id: true } },
        event: true,
      },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const role = req.user.role;
    const isOwner = registration.userId === req.user.id;
    const isStaff = ['ORGANIZER', 'EVENT_MANAGER', 'SUPER_ADMIN', 'VOLUNTEER'].includes(role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'You are not allowed to access this certificate.' });
    }

    if (registration.status !== 'COMPLETED') {
      return res.status(400).json({
        error: `Certificate not available. Participant status is ${registration.status}, but must be COMPLETED.`,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="certificate_${registration.user.name.replace(/\s+/g, '_')}.pdf"`
    );

    generateCertificatePDF(registration, res);
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Server error generating certificate' });
  }
});

export default router;
