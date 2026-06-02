import prisma from '../prisma/client.js';

export const getParticipantStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: {
        event: true,
        bib: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (registrations.length === 0) {
      return res.json({
        id: userId,
        registrations: []
      });
    }

    res.json({
      id: userId,
      registrations: registrations.map(reg => ({
        id: reg.id,
        eventName: reg.event.name,
        distance: reg.distance,
        status: reg.status,
        bibNumber: reg.bib?.bibNumber,
        finishTime: reg.finishTime,
        tshirtSize: reg.tshirtSize,
        createdAt: reg.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching participant status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
};

export const getParticipantCertificate = async (req, res) => {
  try {
    const userId = req.user.id;

    const certificates = await prisma.certificate.findMany({
      where: {
        registration: {
          userId
        }
      },
      include: {
        registration: {
          include: { event: true, user: true }
        },
        event: true
      },
      orderBy: { generatedAt: 'desc' }
    });

    if (certificates.length === 0) {
      return res.json({ certificates: [] });
    }

    res.json({
      certificates: certificates.map(cert => ({
        id: cert.id,
        eventName: cert.event.name,
        participantName: cert.registration.user.name,
        certificateUrl: cert.certificateUrl,
        generatedAt: cert.generatedAt,
        downloadedAt: cert.downloadedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
};
