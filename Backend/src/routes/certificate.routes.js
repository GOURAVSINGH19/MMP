import express from 'express';
import prisma from '../prisma/client.js';
import { generateCertificatePDF } from '../services/pdf.service.js';

const router = express.Router();

// Fetch dynamic PDF certificate (Phase 7)
// Route is mounted at: GET /certificate/:participantId
router.get('/:participantId', async (req, res) => {
  const { participantId } = req.params;

  try {
    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { id: participantId },
          { userId: participantId }
        ]
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

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'COMPLETED') {
      return res.status(400).json({ error: `Certificate not available. Participant status is currently ${registration.status}, but must be COMPLETED.` });
    }

    // Set Response Headers for direct PDF viewing in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificate_${registration.user.name.replace(/\s+/g, '_')}.pdf"`);

    // Stream the generated certificate PDF directly to the client response
    generateCertificatePDF(registration, res);

  } catch (error) {
    console.error('❌ Certificate generation error:', error);
    res.status(500).json({ error: 'Server error generating certificate' });
  }
});

export default router;
