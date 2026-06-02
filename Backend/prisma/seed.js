import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const password = await bcrypt.hash('password123', 10);

const scannerRoles = ['CHECK_IN', 'REGISTRATION_DESK', 'FINISH_LINE'];

const daysFromNow = (days, hour = 5, minute = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

async function clearDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.scanLog.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.bib.deleteMany();
  await prisma.volunteerAssignment.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.eventManager.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
}

async function user(data) {
  return prisma.user.create({
    data: {
      password,
      ...data,
    },
  });
}

async function main() {
  await clearDatabase();

  const superAdmin = await user({
    name: 'Aarav Super Admin',
    email: 'admin@mmp.com',
    phone: '9000000001',
    platformRole: 'SUPER_ADMIN',
  });

  const eventManager = await user({
    name: 'Meera Event Manager',
    email: 'manager@mmp.com',
    phone: '9000000002',
    platformRole: 'EVENT_MANAGER',
  });

  const operationsLead = await user({
    name: 'Kabir Operations Coordinator',
    email: 'operations@mmp.com',
    phone: '9000000003',
    platformRole: 'TEAM_MEMBER',
  });

  const registrationLead = await user({
    name: 'Ananya Registration Coordinator',
    email: 'registration@mmp.com',
    phone: '9000000004',
    platformRole: 'TEAM_MEMBER',
  });

  const event = await prisma.event.create({
    data: {
      name: 'Metropolis Marathon 2026',
      description: 'A full city marathon operation with public registration, BIB QR check-in, volunteer control, sponsor visibility, results, and certificates.',
      date: daysFromNow(45, 5, 30),
      registrationDeadline: daysFromNow(30, 23, 59),
      location: 'Metropolis Central Park',
      eventStatus: 'REGISTRATION_OPEN',
      distances: ['5K', '10K', '21K', '42K'],
      createdBy: superAdmin.id,
    },
  });

  const secondEvent = await prisma.event.create({
    data: {
      name: 'Riverfront Night Run 2026',
      description: 'Evening race experience for community runners, brands, and volunteer teams.',
      date: daysFromNow(90, 18, 0),
      registrationDeadline: daysFromNow(75, 23, 59),
      location: 'Riverfront Promenade',
      eventStatus: 'PUBLISHED',
      distances: ['5K', '10K'],
      createdBy: eventManager.id,
    },
  });

  const thirdEvent = await prisma.event.create({
    data: {
      name: 'Bengaluru Elite 10K 2026',
      description: 'A premium paid 10K marathon event through the heart of Bengaluru. Experience elite timing and premium finisher kits.',
      date: daysFromNow(60, 6, 0),
      registrationDeadline: daysFromNow(45, 23, 59),
      location: 'Kanteerava Stadium, Bengaluru',
      eventStatus: 'REGISTRATION_OPEN',
      distances: ['5K', '10K'],
      createdBy: eventManager.id,
      isPaid: true,
      registrationFee: 499.00,
      currency: 'INR',
      tax: 90.00,
      convenienceFee: 10.00
    },
  });

  const completedEvent = await prisma.event.create({
    data: {
      name: 'Heritage Charity Run 2025',
      description: 'The annual heritage run across historical monuments of Metropolis. Completed with amazing runner timings.',
      date: daysFromNow(-30, 6, 0),
      registrationDeadline: daysFromNow(-45, 23, 59),
      location: 'Old Town Square',
      eventStatus: 'COMPLETED',
      distances: ['5K', '10K', '21K'],
      createdBy: superAdmin.id,
    },
  });

  await prisma.eventManager.createMany({
    data: [
      { userId: eventManager.id, eventId: event.id, role: 'ORGANIZER' },
      { userId: operationsLead.id, eventId: event.id, role: 'COORDINATOR' },
    ],
  });

  await prisma.teamMember.createMany({
    data: [
      {
        userId: operationsLead.id,
        eventId: event.id,
        invitedBy: eventManager.id,
        permissions: ['VIEW_EVENT', 'MANAGE_TASKS', 'VIEW_REPORTS'],
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      {
        userId: registrationLead.id,
        eventId: event.id,
        invitedBy: eventManager.id,
        permissions: ['VIEW_EVENT', 'MANAGE_PARTICIPANTS', 'MANAGE_VOLUNTEERS'],
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    ],
  });

  await prisma.sponsor.createMany({
    data: [
      {
        eventId: event.id,
        name: 'Velocity Sports',
        category: 'TITLE',
        logoUrl: 'https://example.com/velocity-logo.png',
        website: 'https://example.com/velocity',
        description: 'Title sponsor for performance gear and race-day branding.',
        contactName: 'Riya Shah',
        contactEmail: 'riya@velocity.example',
        contactPhone: '9100001001',
      },
      {
        eventId: event.id,
        name: 'HydraPure Water',
        category: 'PLATINUM',
        logoUrl: 'https://example.com/hydrapure-logo.png',
        website: 'https://example.com/hydrapure',
        description: 'Hydration sponsor for all water stations.',
        contactName: 'Dev Menon',
        contactEmail: 'dev@hydrapure.example',
        contactPhone: '9100001002',
      },
      {
        eventId: event.id,
        name: 'Metro Health',
        category: 'GOLD',
        logoUrl: 'https://example.com/metro-health-logo.png',
        website: 'https://example.com/metro-health',
        description: 'Medical partner for race-day response teams.',
        contactName: 'Dr. Neha Kapoor',
        contactEmail: 'neha@metrohealth.example',
        contactPhone: '9100001003',
      },
      {
        eventId: secondEvent.id,
        name: 'NightGlow Energy',
        category: 'SILVER',
        website: 'https://example.com/nightglow',
        description: 'Community sponsor for night run kits.',
        contactName: 'Ishan Rao',
        contactEmail: 'ishan@nightglow.example',
        contactPhone: '9100001004',
      },
    ],
  });

  const volunteerUsers = await Promise.all([
    user({ name: 'Vivaan Check-In Volunteer', email: 'checkin@mmp.com', phone: '9000000011', platformRole: 'VOLUNTEER' }),
    user({ name: 'Sara Registration Desk', email: 'regdesk@mmp.com', phone: '9000000012', platformRole: 'VOLUNTEER' }),
    user({ name: 'Ira Finish Line', email: 'finish@mmp.com', phone: '9000000013', platformRole: 'VOLUNTEER' }),
    user({ name: 'Rohan Medical', email: 'medical@mmp.com', phone: '9000000014', platformRole: 'VOLUNTEER' }),
    user({ name: 'Tara Water Station', email: 'water@mmp.com', phone: '9000000015', platformRole: 'VOLUNTEER' }),
    user({ name: 'Nikhil Route Marshal', email: 'route@mmp.com', phone: '9000000016', platformRole: 'VOLUNTEER' }),
    user({ name: 'Asha Security', email: 'security@mmp.com', phone: '9000000017', platformRole: 'VOLUNTEER' }),
    user({ name: 'Om Logistics', email: 'logistics@mmp.com', phone: '9000000018', platformRole: 'VOLUNTEER' }),
  ]);

  const volunteerRoles = ['CHECK_IN', 'REGISTRATION_DESK', 'FINISH_LINE', 'MEDICAL', 'WATER_STATION', 'ROUTE_MARSHAL', 'SECURITY', 'LOGISTICS'];

  for (const [index, volunteer] of volunteerUsers.entries()) {
    await prisma.volunteerProfile.create({
      data: {
        userId: volunteer.id,
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: eventManager.id,
        experienceYears: index % 4,
        bio: `${volunteer.name} is assigned to ${volunteerRoles[index].replaceAll('_', ' ').toLowerCase()} operations.`,
      },
    });

    await prisma.volunteerAssignment.create({
      data: {
        userId: volunteer.id,
        eventId: event.id,
        volunteerRole: volunteerRoles[index],
        canScan: scannerRoles.includes(volunteerRoles[index]),
        assignedBy: eventManager.id,
        shiftStart: daysFromNow(45, 4, 30),
        shiftEnd: daysFromNow(45, 12, 30),
        status: index < 3 ? 'ACTIVE' : 'ASSIGNED',
      },
    });
  }

  const participantSeeds = [
    ['Arjun Runner', 'arjun.runner@mmp.com', 'REGISTERED', '5K', null],
    ['Priya Approved', 'priya.approved@mmp.com', 'APPROVED', '10K', null],
    ['Dev Confirmed', 'dev.confirmed@mmp.com', 'CONFIRMED', '21K', 'BIB-2101'],
    ['Maya Collected', 'maya.collected@mmp.com', 'BIB_COLLECTED', '42K', 'BIB-4201'],
    ['Neil Finisher', 'neil.finisher@mmp.com', 'COMPLETED', '10K', 'BIB-1001'],
    ['Zoya Withdrawn', 'zoya.withdrawn@mmp.com', 'WITHDRAWN', '5K', null],
  ];

  const registrations = [];

  for (const [index, [name, email, status, distance, bibNumber]] of participantSeeds.entries()) {
    const participantUser = await user({
      name,
      email,
      phone: `900000010${index}`,
      platformRole: 'PARTICIPANT',
    });

    await prisma.participant.create({
      data: {
        eventId: event.id,
        userId: participantUser.id,
      },
    });

    let bib = null;
    if (bibNumber) {
      bib = await prisma.bib.create({
        data: {
          eventId: event.id,
          bibNumber,
          QRCode: `${participantUser.id}:${bibNumber}`,
          status: status === 'COMPLETED' ? 'FINISHED' : status === 'BIB_COLLECTED' ? 'COLLECTED' : 'ASSIGNED',
          assignedTo: participantUser.id,
          assignedAt: new Date(),
          collectedAt: ['BIB_COLLECTED', 'COMPLETED'].includes(status) ? new Date() : null,
        },
      });
    }

    const registration = await prisma.registration.create({
      data: {
        userId: participantUser.id,
        eventId: event.id,
        distance,
        tshirtSize: ['S', 'M', 'L', 'XL'][index % 4],
        emergencyName: `Emergency Contact ${index + 1}`,
        emergencyPhone: `911000010${index}`,
        age: 22 + index * 4,
        gender: index % 2 === 0 ? 'Male' : 'Female',
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][index % 4],
        medicalHistory: index === 3 ? 'Asthma inhaler required before long distance runs.' : 'No known issues.',
        bibId: bib?.id,
        finishTime: status === 'COMPLETED' ? '00:54:18' : null,
        status,
        approvedBy: status !== 'REGISTERED' ? eventManager.id : null,
        approvedAt: status !== 'REGISTERED' ? new Date() : null,
        confirmedAt: ['CONFIRMED', 'BIB_COLLECTED', 'COMPLETED'].includes(status) ? new Date() : null,
        bibCollectedAt: ['BIB_COLLECTED', 'COMPLETED'].includes(status) ? new Date() : null,
        finishedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    registrations.push({ registration, bib, user: participantUser, status });
  }

  // Register people for completedEvent (to build a leaderboard)
  const adityaUser = await user({
    name: 'Aditya Fast',
    email: 'aditya.fast@mmp.com',
    phone: '9000000201',
    platformRole: 'PARTICIPANT',
  });

  const nishaUser = await user({
    name: 'Nisha Slow',
    email: 'nisha.slow@mmp.com',
    phone: '9000000202',
    platformRole: 'PARTICIPANT',
  });

  // Find users from registrations
  const priyaUser = registrations.find(r => r.user.email === 'priya.approved@mmp.com').user;
  const neilUser = registrations.find(r => r.user.email === 'neil.finisher@mmp.com').user;

  const completedEventParticipants = [
    { user: adityaUser, finishTime: '00:38:15', bibNumber: 'BIB-1002', distance: '10K' },
    { user: priyaUser, finishTime: '00:46:12', bibNumber: 'BIB-1003', distance: '10K' },
    { user: neilUser, finishTime: '00:51:30', bibNumber: 'BIB-1004', distance: '10K' },
    { user: nishaUser, finishTime: '01:05:40', bibNumber: 'BIB-1005', distance: '10K' },
  ];

  for (const [idx, item] of completedEventParticipants.entries()) {
    await prisma.participant.create({
      data: {
        eventId: completedEvent.id,
        userId: item.user.id,
      },
    });

    const bibRecord = await prisma.bib.create({
      data: {
        eventId: completedEvent.id,
        bibNumber: item.bibNumber,
        QRCode: `${item.user.id}:${item.bibNumber}`,
        status: 'FINISHED',
        assignedTo: item.user.id,
        assignedAt: new Date(),
        collectedAt: new Date(),
      },
    });

    await prisma.registration.create({
      data: {
        userId: item.user.id,
        eventId: completedEvent.id,
        distance: item.distance,
        tshirtSize: ['S', 'M', 'L', 'XL'][idx % 4],
        emergencyName: `Emergency Contact Completed ${idx + 1}`,
        emergencyPhone: `911000020${idx}`,
        age: 25 + idx * 3,
        gender: idx % 2 === 0 ? 'Male' : 'Female',
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][idx % 4],
        medicalHistory: 'None',
        bibId: bibRecord.id,
        finishTime: item.finishTime,
        status: 'COMPLETED',
        approvedBy: eventManager.id,
        approvedAt: new Date(),
        confirmedAt: new Date(),
        bibCollectedAt: new Date(),
        finishedAt: new Date(),
      },
    });
  }

  const collected = registrations.find((item) => item.status === 'BIB_COLLECTED');
  const completed = registrations.find((item) => item.status === 'COMPLETED');

  await prisma.scanLog.createMany({
    data: [
      {
        eventId: event.id,
        registrationId: collected.registration.id,
        bibId: collected.bib.id,
        userId: volunteerUsers[0].id,
        scanType: 'CHECK_IN',
        volunteerRole: 'CHECK_IN',
        location: 'Gate A',
        notes: 'BIB kit collected successfully.',
      },
      {
        eventId: event.id,
        registrationId: completed.registration.id,
        bibId: completed.bib.id,
        userId: volunteerUsers[2].id,
        scanType: 'FINISH_LINE',
        volunteerRole: 'FINISH_LINE',
        location: 'Finish Arch',
        notes: 'Finish recorded and verified.',
      },
    ],
  });

  await prisma.certificate.create({
    data: {
      registrationId: completed.registration.id,
      eventId: event.id,
      certificateUrl: `http://localhost:5000/certificate/${completed.user.id}`,
      downloadedAt: new Date(),
    },
  });

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        eventId: event.id,
        title: 'Confirm title sponsor booth layout',
        category: 'SPONSORS',
        description: 'Coordinate branding placement and booth dimensions.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        deadline: daysFromNow(10, 17, 0),
        createdBy: eventManager.id,
      },
    }),
    prisma.task.create({
      data: {
        eventId: event.id,
        title: 'Prepare BIB collection counters',
        category: 'BIB_DISTRIBUTION',
        description: 'Set up QR scanner desks, queue barriers, and kit handover signs.',
        status: 'TODO',
        priority: 'CRITICAL',
        deadline: daysFromNow(25, 18, 0),
        createdBy: registrationLead.id,
      },
    }),
    prisma.task.create({
      data: {
        eventId: event.id,
        title: 'Water station stock check',
        category: 'WATER_STATIONS',
        description: 'Verify water bottles, cups, electrolyte sachets, and waste bags.',
        status: 'DONE',
        priority: 'MEDIUM',
        deadline: daysFromNow(20, 12, 0),
        createdBy: operationsLead.id,
      },
    }),
    prisma.task.create({
      data: {
        eventId: event.id,
        title: 'Medical tent emergency drill',
        category: 'MEDICAL',
        description: 'Run mock incident escalation with medical and security teams.',
        status: 'BLOCKED',
        priority: 'HIGH',
        deadline: daysFromNow(18, 10, 0),
        createdBy: operationsLead.id,
      },
    }),
  ]);

  await prisma.taskAssignment.createMany({
    data: [
      { taskId: tasks[0].id, userId: operationsLead.id, status: 'IN_PROGRESS' },
      { taskId: tasks[1].id, userId: registrationLead.id, status: 'TODO' },
      { taskId: tasks[1].id, userId: volunteerUsers[1].id, status: 'TODO' },
      { taskId: tasks[2].id, userId: volunteerUsers[4].id, status: 'DONE', completedAt: new Date() },
      { taskId: tasks[3].id, userId: volunteerUsers[3].id, status: 'BLOCKED' },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        eventId: event.id,
        type: 'REGISTRATION_SUBMITTED',
        recipient: 'ALL_PARTICIPANTS',
        subject: 'Registration received',
        body: 'Your marathon registration is submitted and awaiting organizer review.',
        channel: ['EMAIL'],
        metadata: { template: 'registration-submitted' },
      },
      {
        eventId: event.id,
        type: 'BIB_ASSIGNED',
        recipient: 'APPROVED_PARTICIPANTS',
        subject: 'BIB assigned',
        body: 'Your official BIB and QR code are ready in your dashboard.',
        channel: ['EMAIL', 'WHATSAPP'],
        metadata: { template: 'bib-assigned' },
      },
      {
        eventId: event.id,
        type: 'RACE_DAY_ALERT',
        recipient: 'ALL_VOLUNTEERS',
        subject: 'Race day briefing',
        body: 'Report to your assigned checkpoint 60 minutes before flag-off.',
        channel: ['EMAIL', 'WHATSAPP', 'PUSH'],
        metadata: { priority: 'high' },
      },
      {
        eventId: event.id,
        type: 'CERTIFICATE_GENERATED',
        recipient: 'SPECIFIC_USER',
        subject: 'Certificate ready',
        body: 'Your finisher certificate is ready for download.',
        channel: ['EMAIL'],
        metadata: { registrationId: completed.registration.id },
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        eventId: event.id,
        action: 'CREATE',
        entity: 'Event',
        entityId: event.id,
        changes: { name: event.name, status: event.eventStatus },
      },
      {
        userId: eventManager.id,
        eventId: event.id,
        action: 'APPROVE',
        entity: 'Registration',
        entityId: registrations[1].registration.id,
        changes: { status: 'APPROVED' },
      },
      {
        userId: eventManager.id,
        eventId: event.id,
        action: 'ASSIGN',
        entity: 'Volunteer',
        entityId: volunteerUsers[0].id,
        changes: { volunteerRole: 'CHECK_IN', canScan: true },
      },
      {
        userId: registrationLead.id,
        eventId: event.id,
        action: 'UPDATE',
        entity: 'Task',
        entityId: tasks[1].id,
        changes: { priority: 'CRITICAL' },
      },
    ],
  });

  console.log('\nDummy data created successfully.');
  console.log('Login users, all password: password123');
  console.table([
    { role: 'SUPER_ADMIN', email: 'admin@mmp.com' },
    { role: 'EVENT_MANAGER', email: 'manager@mmp.com' },
    { role: 'TEAM_MEMBER', email: 'operations@mmp.com' },
    { role: 'VOLUNTEER scanner', email: 'checkin@mmp.com' },
    { role: 'VOLUNTEER finish', email: 'finish@mmp.com' },
    { role: 'PARTICIPANT registered', email: 'arjun.runner@mmp.com' },
    { role: 'PARTICIPANT completed', email: 'neil.finisher@mmp.com' },
  ]);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
