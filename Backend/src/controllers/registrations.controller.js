import prisma from '../prisma/client.js';
import { sendEmail } from '../services/email.service.js';
import { buildQrPayload } from '../utils/qrcode.util.js';
import { ensureCertificateRecord } from '../utils/certificate.util.js';
import { writeAuditLog } from '../utils/audit.util.js';

export const listRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, distance } = req.query;

    const where = { eventId };
    if (status) where.status = status;
    if (distance) where.distance = distance;

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        user: true,
        bib: true,
        certificate: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(registrations.map(reg => ({
      id: reg.id,
      userId: reg.userId,
      userName: reg.user.name,
      email: reg.user.email,
      distance: reg.distance,
      tshirtSize: reg.tshirtSize,
      status: reg.status,
      bibNumber: reg.bib?.bibNumber,
      finishTime: reg.finishTime,
      approvedAt: reg.approvedAt,
      createdAt: reg.createdAt
    })));
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
};

export const getRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        user: true,
        bib: true,
        event: true,
        certificate: true
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({
      id: registration.id,
      userId: registration.userId,
      userName: registration.user.name,
      email: registration.user.email,
      eventName: registration.event.name,
      distance: registration.distance,
      tshirtSize: registration.tshirtSize,
      emergencyName: registration.emergencyName,
      emergencyPhone: registration.emergencyPhone,
      age: registration.age,
      gender: registration.gender,
      bloodGroup: registration.bloodGroup,
      status: registration.status,
      bibNumber: registration.bib?.bibNumber,
      finishTime: registration.finishTime,
      createdAt: registration.createdAt
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({ error: 'Failed to fetch registration' });
  }
};

export const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await prisma.registration.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      include: { user: true }
    });

    res.json({
      id: registration.id,
      status: registration.status,
      approvedAt: registration.approvedAt
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
};

export const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await prisma.registration.update({
      where: { id },
      data: {
        status: 'WITHDRAWN'
      }
    });

    res.json({
      id: registration.id,
      status: registration.status
    });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ error: 'Failed to reject registration' });
  }
};

export const assignBib = async (req, res) => {
  try {
    const { id } = req.params;
    const { bibNumber } = req.body;

    if (!bibNumber) {
      return res.status(400).json({ error: 'Bib number is required' });
    }

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
        payments: { where: { status: 'SUCCESSFUL' }, take: 1 }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Guard: only APPROVED or CONFIRMED registrations can receive a BIB
    if (!['APPROVED', 'CONFIRMED'].includes(registration.status)) {
      return res.status(400).json({
        error: `BIB cannot be assigned — registration status is '${registration.status}'. Only APPROVED or CONFIRMED participants are eligible.`
      });
    }

    // Guard: for paid events, payment must be SUCCESSFUL
    if (registration.event.isPaid && registration.payments.length === 0) {
      return res.status(400).json({
        error: 'BIB cannot be assigned — participant has not completed payment.'
      });
    }

    const qrPayload = buildQrPayload(registration.userId, bibNumber);

    const bib = await prisma.bib.upsert({
      where: {
        eventId_bibNumber: {
          eventId: registration.eventId,
          bibNumber,
        },
      },
      create: {
        eventId: registration.eventId,
        bibNumber,
        QRCode: qrPayload,
        status: 'ASSIGNED',
        assignedTo: registration.userId,
        assignedAt: new Date(),
      },
      update: {
        QRCode: qrPayload,
        status: 'ASSIGNED',
        assignedTo: registration.userId,
        assignedAt: new Date(),
      },
    });

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        bibId: bib.id,
        status: registration.status === 'APPROVED' ? 'CONFIRMED' : registration.status,
      },
    });

    res.json({
      id: updated.id,
      bibNumber,
      status: updated.status
    });
  } catch (error) {
    console.error('Error assigning bib:', error);
    res.status(500).json({ error: 'Failed to assign bib' });
  }
};

export const enterFinishTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { finishTime } = req.body;

    if (!finishTime) {
      return res.status(400).json({ error: 'Finish time is required' });
    }

    const registration = await prisma.registration.update({
      where: { id },
      data: {
        finishTime,
        status: 'COMPLETED',
        finishedAt: new Date(),
      },
      include: { user: true, event: true },
    });

    await ensureCertificateRecord(registration);

    await writeAuditLog({
      userId: req.user.id,
      eventId: registration.eventId,
      action: 'RECORD_FINISH',
      entity: 'Registration',
      entityId: registration.id,
      changes: { finishTime },
    });

    res.json({
      id: registration.id,
      finishTime: registration.finishTime,
      status: registration.status,
    });
  } catch (error) {
    console.error('Error entering finish time:', error);
    res.status(500).json({ error: 'Failed to enter finish time' });
  }
};

export const exportRegistrationsCSV = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: true,
        bib: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const csv = [
      ['ID', 'Name', 'Email', 'Distance', 'T-Shirt Size', 'Status', 'Bib Number', 'Finish Time', 'Created At'].join(','),
      ...registrations.map(r =>
        [r.id, r.user.name, r.user.email, r.distance, r.tshirtSize, r.status, r.bib?.bibNumber || '', r.finishTime || '', r.createdAt].join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="registrations-${eventId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting registrations:', error);
    res.status(500).json({ error: 'Failed to export registrations' });
  }
};

export const uploadFinishTimes = async (req, res) => {
  try {
    const { eventId } = req.params;
    res.json({ success: true, imported: 0 });
  } catch (error) {
    console.error('Error uploading finish times:', error);
    res.status(500).json({ error: 'Failed to upload finish times' });
  }
};

export const bulkApproveRegistrations = async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Array of registration IDs (ids) is required' });
  }
  try {
    const result = await prisma.registration.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date()
      }
    });
    res.json({ message: `Successfully approved ${result.count} registrations`, count: result.count });
  } catch (error) {
    console.error('Bulk approve registrations error:', error);
    res.status(500).json({ error: 'Failed to bulk approve registrations' });
  }
};

export const bulkAssignBibs = async (req, res) => {
  const { ids, startBibNumber } = req.body;
  if (!ids || !Array.isArray(ids) || !startBibNumber) {
    return res.status(400).json({ error: 'ids array and startBibNumber are required' });
  }

  try {
    let currentBib = parseInt(startBibNumber);
    let count = 0;
    const skipped = []; // registrations skipped due to ineligibility

    for (const regId of ids) {
      const reg = await prisma.registration.findUnique({
        where: { id: regId },
        include: {
          bib: true,
          event: true,
          payments: { where: { status: 'SUCCESSFUL' }, take: 1 }
        }
      });

      if (!reg) continue;
      if (reg.bibId) continue; // Already assigned — silently skip

      // Skip if not APPROVED or CONFIRMED
      if (!['APPROVED', 'CONFIRMED'].includes(reg.status)) {
        skipped.push({ id: regId, reason: `Status is '${reg.status}'` });
        continue;
      }

      // Skip if event is paid and no successful payment exists
      if (reg.event.isPaid && reg.payments.length === 0) {
        skipped.push({ id: regId, reason: 'Payment not completed' });
        continue;
      }

      const bibNumStr = String(currentBib);
      const qrPayload = buildQrPayload(reg.userId, bibNumStr);

      const bib = await prisma.bib.upsert({
        where: {
          eventId_bibNumber: {
            eventId: reg.eventId,
            bibNumber: bibNumStr
          }
        },
        create: {
          eventId: reg.eventId,
          bibNumber: bibNumStr,
          QRCode: qrPayload,
          status: 'ASSIGNED',
          assignedTo: reg.userId,
          assignedAt: new Date()
        },
        update: {
          status: 'ASSIGNED',
          assignedTo: reg.userId,
          assignedAt: new Date()
        }
      });

      await prisma.registration.update({
        where: { id: regId },
        data: {
          bibId: bib.id,
          status: 'CONFIRMED'
        }
      });

      currentBib++;
      count++;
    }

    res.json({
      message: `Successfully assigned BIBs to ${count} registrations${skipped.length ? `, skipped ${skipped.length} ineligible` : ''}.`,
      count,
      skipped
    });
  } catch (error) {
    console.error('Bulk assign bibs error:', error);
    res.status(500).json({ error: 'Failed to bulk assign BIBs' });
  }
};

export const bulkAssignVolunteers = async (req, res) => {
  const { userIds, eventId, role } = req.body;
  if (!userIds || !Array.isArray(userIds) || !eventId || !role) {
    return res.status(400).json({ error: 'userIds, eventId, and role are required' });
  }
  try {
    let count = 0;
    for (const userId of userIds) {
      await prisma.volunteerAssignment.upsert({
        where: { userId_eventId: { userId, eventId } },
        create: {
          userId,
          eventId,
          volunteerRole: role,
          assignedBy: req.user.id,
          status: 'ASSIGNED'
        },
        update: {
          volunteerRole: role,
          status: 'ASSIGNED'
        }
      });
      count++;
    }
    res.json({ message: `Successfully assigned role to ${count} volunteers`, count });
  } catch (error) {
    console.error('Bulk assign volunteers error:', error);
    res.status(500).json({ error: 'Failed to bulk assign volunteers' });
  }
};

export const bulkSendNotifications = async (req, res) => {
  const { userIds, subject, body } = req.body;
  if (!userIds || !Array.isArray(userIds) || !subject || !body) {
    return res.status(400).json({ error: 'userIds, subject, and body are required' });
  }
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } }
    });

    let count = 0;
    for (const user of users) {
      try {
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #aa3bff; margin-bottom: 20px;">Marathon Announcement</h2>
            <p>Hello ${user.name},</p>
            <p>${body.replace(/\n/g, '<br />')}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #a0aec0;">Marathon Management Portal &copy; 2026</p>
          </div>
        `;
        await sendEmail({
          to: user.email,
          subject,
          html: emailHtml
        });
        count++;
      } catch (emailErr) {
        console.warn(`Failed to send announcement email to ${user.email}:`, emailErr.message);
      }
    }
    res.json({ message: `Sent announcement email to ${count} users`, count });
  } catch (error) {
    console.error('Bulk send notifications error:', error);
    res.status(500).json({ error: 'Failed to bulk send notifications' });
  }
};

export const bulkRegenerateCertificates = async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array of registration IDs is required' });
  }
  try {
    const registrations = await prisma.registration.findMany({
      where: { id: { in: ids }, status: 'COMPLETED' },
      include: { user: true, event: true }
    });

    let count = 0;
    for (const reg of registrations) {
      const certUrl = `http://localhost:5000/certificate/${reg.userId}`;
      
      await prisma.certificate.upsert({
        where: { registrationId: reg.id },
        create: {
          registrationId: reg.id,
          eventId: reg.eventId,
          certificateUrl: certUrl
        },
        update: {
          certificateUrl: certUrl
        }
      });

      try {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #aa3bff; margin-bottom: 20px;">Your Marathon Completion Certificate is Ready!</h2>
            <p>Hello ${reg.user.name},</p>
            <p>We have updated or regenerated your completion certificate for the event <strong>${reg.event.name}</strong>.</p>
            <p>Category: <strong>${reg.distance}</strong> | Finish Time: <strong>${reg.finishTime}</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${certUrl}" style="background-color: #aa3bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download Certificate</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #a0aec0; text-align: center;">Marathon Management Portal &copy; 2026. All rights reserved.</p>
          </div>
        `;
        await sendEmail({
          to: reg.user.email,
          subject: `Marathon Certificate Update - ${reg.event.name}`,
          html: emailHtml
        });
        count++;
      } catch (emailErr) {
        console.warn(`Bulk certificate email failed for ${reg.user.email}`);
      }
    }
    res.json({ message: `Successfully regenerated and emailed certificates to ${count} participants`, count });
  } catch (error) {
    console.error('Bulk regenerate certificates error:', error);
    res.status(500).json({ error: 'Failed to bulk regenerate certificates' });
  }
};
