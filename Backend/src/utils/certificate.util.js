import prisma from '../prisma/client.js';

export async function ensureCertificateRecord(registration) {
  const baseUrl = process.env.API_BASE_URL || process.env.PUBLIC_API_URL || 'http://localhost:5000';
  const certificateUrl = `${baseUrl}/certificate/${registration.id}`;

  return prisma.certificate.upsert({
    where: { registrationId: registration.id },
    create: {
      registrationId: registration.id,
      eventId: registration.eventId,
      certificateUrl,
    },
    update: {
      certificateUrl,
      generatedAt: new Date(),
    },
  });
}
