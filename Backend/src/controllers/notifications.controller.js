import prisma from '../prisma/client.js';
import { sendEmail } from '../services/email.service.js';

export const getEventNotifications = async (req, res) => {
  try {
    const { eventId } = req.params;

    const notifications = await prisma.notification.findMany({
      where: { eventId },
      orderBy: { sentAt: 'desc' },
    });

    res.json(notifications.map(n => ({
      id: n.id,
      type: n.type,
      recipient: n.recipient,
      subject: n.subject,
      body: n.body,
      channels: n.channel,
      sentAt: n.sentAt,
    })));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

async function resolveAudienceUsers(eventId, audience, filters = {}) {
  switch (audience) {
    case 'ALL_VOLUNTEERS': {
      const assignments = await prisma.volunteerAssignment.findMany({
        where: { eventId },
        include: { user: true },
      });
      return assignments.map((a) => a.user);
    }
    case 'APPROVED_PARTICIPANTS': {
      const regs = await prisma.registration.findMany({
        where: { eventId, status: { in: ['APPROVED', 'CONFIRMED', 'BIB_COLLECTED', 'COMPLETED'] } },
        include: { user: true },
      });
      return regs.map((r) => r.user);
    }
    case 'EVENT_MANAGERS': {
      const managers = await prisma.eventManager.findMany({
        where: { eventId },
        include: { user: true },
      });
      return managers.map((m) => m.user);
    }
    case 'ALL_PARTICIPANTS':
    default: {
      const where = { eventId };
      if (filters.status) where.status = filters.status;
      if (filters.distance) where.distance = filters.distance;
      const regs = await prisma.registration.findMany({
        where,
        include: { user: true },
      });
      return regs.map((r) => r.user);
    }
  }
}

export const broadcastNotification = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { audience, channels, message, subject, status, distance } = req.body;

    if (!audience || !message) {
      return res.status(400).json({ error: 'Audience and message are required' });
    }

    const users = await resolveAudienceUsers(eventId, audience, { status, distance });
    const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values());
    if (uniqueUsers.length === 0) {
      return res.status(400).json({ error: 'No recipients found for the selected audience and marathon.' });
    }

    const emailSubject = subject || 'Marathon Event Update';
    const useEmail = !channels || channels.includes('EMAIL');

    let sentCount = 0;
    const failed = [];
    if (useEmail) {
      for (const user of uniqueUsers) {
        try {
          await sendEmail({
            to: user.email,
            subject: emailSubject,
            html: `
              <div style="font-family:sans-serif;padding:20px;">
                <h2 style="color:#E8593C;">${emailSubject}</h2>
                <p>Hello ${user.name},</p>
                <p>${message.replace(/\n/g, '<br />')}</p>
              </div>
            `,
          });
          sentCount++;
        } catch (emailErr) {
          console.warn(`Broadcast email failed for ${user.email}:`, emailErr.message);
          failed.push({ email: user.email, error: emailErr.message });
        }
      }
    }

    if (useEmail && uniqueUsers.length > 0 && sentCount === 0) {
      return res.status(502).json({
        error: failed[0]?.error || 'All broadcast emails failed to send',
        recipientCount: uniqueUsers.length,
        sentCount,
        failed,
      });
    }

    const notification = await prisma.notification.create({
      data: {
        eventId,
        type: 'EVENT_REMINDER',
        recipient: audience,
        subject: emailSubject,
        body: message,
        channel: channels || ['EMAIL'],
        metadata: { sentCount, recipientCount: uniqueUsers.length },
      },
    });

    res.status(201).json({
      id: notification.id,
      sentAt: notification.sentAt,
      recipient: notification.recipient,
      sentCount,
      recipientCount: uniqueUsers.length,
      failed,
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};
