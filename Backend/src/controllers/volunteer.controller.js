import prisma from '../prisma/client.js';

export const scanQrCode = async (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ error: 'QR Code data is required' });
  }

  try {
    const parts = qrData.split(':');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid QR Code format' });
    }

    const [userId, bib] = parts;

    const registration = await prisma.registration.findFirst({
      where: {
        userId,
        bib
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
      return res.status(404).json({ error: 'Participant not found or BIB number mismatch' });
    }

    let nextStatus = registration.status;
    let scanType = 'CHECKIN';

    if (registration.status === 'CONFIRMED') {
      nextStatus = 'BIB_COLLECTED';
      scanType = 'BIB_COLLECTION';
    } else if (registration.status === 'BIB_COLLECTED') {
      scanType = 'FINISH_LINE';
    } else {
      scanType = `INFO_${registration.status}`;
    }

    const updatedRegistration = await prisma.registration.update({
      where: { id: registration.id },
      data: { status: nextStatus }
    });
    
    const scanLog = await prisma.scanLog.create({
      data: {
        bib: bib,
        scanType: scanType,
        scannedBy: req.user.name || req.user.email
      }
    });

    res.json({
      message: `Successfully scanned BIB ${bib}!`,
      scanType,
      previousStatus: registration.status,
      currentStatus: nextStatus,
      participantName: registration.user.name,
      participantDistance: registration.distance,
      scanLog
    });

  } catch (error) {
    console.error('❌ QR scan error:', error);
    res.status(500).json({ error: 'Server error processing QR scan' });
  }
};

// Get Scan Logs (Phase 6 / Phase 10)
export const getScanLogs = async (req, res) => {
  try {
    const logs = await prisma.scanLog.findMany({
      orderBy: { scannedAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    console.error('❌ Get scan logs error:', error);
    res.status(500).json({ error: 'Server error retrieving scan history' });
  }
};
