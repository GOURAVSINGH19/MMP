import QRCode from 'qrcode';
import prisma from '../prisma/client.js';
import { sendEmail, buildApprovedTemplate, buildBibAssignedTemplate, buildCertificateReadyTemplate } from '../services/email.service.js';

// Get Admin Stats (Phase 5)
export const getStats = async (req, res) => {
  try {
    const totalRegistrations = await prisma.registration.count();
    const pendingApprovals = await prisma.registration.count({
      where: { status: 'REGISTERED' }
    });
    const finishers = await prisma.registration.count({
      where: { status: 'COMPLETED' }
    });
    const volunteers = await prisma.user.count({
      where: { role: 'VOLUNTEER' }
    });

    res.json({
      totalRegistrations,
      pendingApprovals,
      finishers,
      volunteers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error retrieving statistics' });
  }
};

// Get All Participants (Phase 5)
export const getParticipants = async (req, res) => {
  try {
    const participants = await prisma.registration.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
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

    // Generate QR Code containing: participant_id + bib_number (Phase 6)
    // QR Code data: "participant_id:bib_number"
    const qrData = `${registration.userId}:${bib}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        bib,
        bibQrUrl: qrCodeDataUrl,
        // Since we are assigning BIB, status transitions or remains in confirmed
        // Wait, standard transitions to CONFIRMED if it was APPROVED/CONFIRMED
        status: registration.status === 'APPROVED' ? 'CONFIRMED' : registration.status
      }
    });

    // Send BIB Assignment Email
    const bibHtml = buildBibAssignedTemplate(registration.user.name, bib, qrCodeDataUrl);
    await sendEmail({
      to: registration.user.email,
      subject: `🎫 Your Marathon BIB Number is Assigned: ${bib}`,
      html: bibHtml
    });

    res.json({
      message: 'BIB assigned and check-in QR code generated successfully!',
      registration: updated
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
        status: 'COMPLETED'
      }
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
