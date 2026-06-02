import prisma from '../prisma/client.js';

export async function writeAuditLog({ userId, eventId, action, entity, entityId, changes }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        eventId: eventId || null,
        action,
        entity,
        entityId,
        changes: changes || undefined,
      },
    });
  } catch (err) {
    console.warn('Audit log write failed:', err.message);
  }
}
