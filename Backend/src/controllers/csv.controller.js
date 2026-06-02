import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';
import { sendEmail, buildWelcomeTemplate, buildVolunteerApprovalTemplate } from '../services/email.service.js';

// Parse CSV string safely
const parseCSVText = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line => {
    // Split by comma but respect double quotes
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    return matches.map(val => val.replace(/^"|"$/g, '').trim());
  });
};

// 1. Download Sample CSV
export const downloadSampleCSV = (req, res) => {
  const { type } = req.params;

  let headers = '';
  let filename = '';

  switch (type) {
    case 'participants':
      headers = 'Name,Email,Phone,Gender,Distance,T-Shirt Size,Emergency Contact Name,Emergency Contact Phone';
      filename = 'sample-participants.csv';
      break;
    case 'volunteers':
      headers = 'Name,Email,Phone,Role,Shift Start (YYYY-MM-DD HH:MM),Shift End (YYYY-MM-DD HH:MM)';
      filename = 'sample-volunteers.csv';
      break;
    case 'results':
      headers = 'BIB Number,Finish Time (HH:MM:SS),Rank';
      filename = 'sample-results.csv';
      break;
    case 'sponsors':
      headers = 'Company Name,Sponsor Name,Category (TITLE/PLATINUM/GOLD/SILVER/BRONZE),Contact Email';
      filename = 'sample-sponsors.csv';
      break;
    default:
      return res.status(400).json({ error: 'Invalid CSV type requested' });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(headers);
};

// 2. Import CSV (Participants, Volunteers, Results, Sponsors)
export const importCSV = async (req, res) => {
  const { eventId } = req.params;
  const { type, csvContent } = req.body;

  if (!type || !csvContent) {
    return res.status(400).json({ error: 'Import type and csvContent string are required' });
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const rows = parseCSVText(csvContent);
    if (rows.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or missing data rows' });
    }

    const headers = rows[0].map(h => h.toLowerCase());
    const dataRows = rows.slice(1);

    // Create a new CSV Import Job
    const job = await prisma.csvImportJob.create({
      data: {
        eventId,
        importType: type.toUpperCase(),
        fileName: `${type}-import-${Date.now()}.csv`,
        status: 'PROCESSING',
        totalRows: dataRows.length,
        userId: req.user.id
      }
    });

    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // 1-indexed plus header row

      try {
        if (type === 'participants') {
          // Fields: Name, Email, Phone, Gender, Distance, T-Shirt Size, Emergency Contact Name, Emergency Contact Phone
          const [name, email, phone, gender, distance, tshirtSize, emergencyName, emergencyPhone] = row;

          if (!name || !email || !phone || !distance || !tshirtSize) {
            throw new Error('Missing required columns: Name, Email, Phone, Distance, and T-Shirt Size are required');
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error(`Invalid email format: ${email}`);
          }

          if (!event.distances.includes(distance)) {
            throw new Error(`Distance '${distance}' is not configured for this event. Options: [${event.distances.join(', ')}]`);
          }

          // Check if User already exists
          let user = await prisma.user.findUnique({ where: { email } });
          const tempPassword = 'run_' + Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          if (!user) {
            user = await prisma.user.create({
              data: {
                name,
                email,
                phone,
                password: hashedPassword,
                platformRole: 'PARTICIPANT'
              }
            });
          }

          // Check if Registration already exists
          const existingReg = await prisma.registration.findUnique({
            where: {
              userId_eventId: {
                userId: user.id,
                eventId
              }
            }
          });

          if (existingReg) {
            throw new Error(`User with email ${email} is already registered for this event`);
          }

          // Create Registration
          await prisma.$transaction(async (tx) => {
            const reg = await tx.registration.create({
              data: {
                userId: user.id,
                eventId,
                distance,
                tshirtSize,
                emergencyName: emergencyName || 'Emergency Info',
                emergencyPhone: emergencyPhone || phone,
                status: event.isPaid ? 'PAYMENT_PENDING' : 'CONFIRMED'
              }
            });

            await tx.participant.create({
              data: {
                userId: user.id,
                eventId
              }
            });
          });

          // Send welcome email
          try {
            const whatsappLink = (await prisma.whatsappGroup.findFirst({
              where: { eventId, groupType: 'COMMUNITY' }
            }))?.link || 'https://chat.whatsapp.com/xxxxx';

            const welcomeHtml = buildWelcomeTemplate(name, email, tempPassword, whatsappLink);
            await sendEmail({
              to: email,
              subject: `Marathon Participant Account Credentials - ${event.name}`,
              html: welcomeHtml
            });
          } catch (emailErr) {
            console.warn(`Welcome email failed for bulk-imported user ${email}`);
          }

        } else if (type === 'volunteers') {
          // Fields: Name, Email, Phone, Role, Shift Start, Shift End
          const [name, email, phone, roleStr, shiftStartStr, shiftEndStr] = row;

          if (!name || !email || !phone || !roleStr) {
            throw new Error('Missing columns: Name, Email, Phone, and Role are required');
          }

          const validRoles = [
            'CHECK_IN', 'FINISH_LINE', 'REGISTRATION_DESK', 'MEDICAL',
            'WATER_STATION', 'ROUTE_MARSHAL', 'SECURITY', 'LOGISTICS', 'END_OF_TRACK'
          ];

          const role = roleStr.toUpperCase().replace(' ', '_');
          if (!validRoles.includes(role)) {
            throw new Error(`Invalid volunteer role: ${roleStr}. Valid options: ${validRoles.join(', ')}`);
          }

          let user = await prisma.user.findUnique({ where: { email } });
          const tempPassword = 'vol_' + Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          if (!user) {
            user = await prisma.user.create({
              data: {
                name,
                email,
                phone,
                password: hashedPassword,
                platformRole: 'VOLUNTEER'
              }
            });

            await prisma.volunteerProfile.create({
              data: {
                userId: user.id,
                status: 'APPROVED'
              }
            });
          } else {
            // Upgrade existing user platform role if participant/etc
            if (user.platformRole === 'PARTICIPANT') {
              await prisma.user.update({
                where: { id: user.id },
                data: { platformRole: 'VOLUNTEER' }
              });

              await prisma.volunteerProfile.upsert({
                where: { userId: user.id },
                create: { userId: user.id, status: 'APPROVED' },
                update: { status: 'APPROVED' }
              });
            }
          }

          // Check if already assigned
          const existingAssignment = await prisma.volunteerAssignment.findUnique({
            where: {
              userId_eventId: {
                userId: user.id,
                eventId
              }
            }
          });

          if (existingAssignment) {
            throw new Error(`Volunteer with email ${email} is already assigned to this event`);
          }

          // Create assignment
          await prisma.volunteerAssignment.create({
            data: {
              userId: user.id,
              eventId,
              volunteerRole: role,
              assignedBy: req.user.id,
              shiftStart: shiftStartStr ? new Date(shiftStartStr) : null,
              shiftEnd: shiftEndStr ? new Date(shiftEndStr) : null,
              status: 'ASSIGNED'
            }
          });

          // Send approval/credentials email
          try {
            // Find WhatsApp link for this role
            let wType = 'GENERAL_VOLUNTEER';
            if (role === 'MEDICAL') wType = 'MEDICAL_VOLUNTEER';
            else if (role === 'WATER_STATION') wType = 'WATER_STATION_VOLUNTEER';
            else if (role === 'FINISH_LINE') wType = 'RACE_OPERATIONS_VOLUNTEER';

            const groupLink = (await prisma.whatsappGroup.findFirst({
              where: { eventId, groupType: wType }
            }))?.link || 'https://chat.whatsapp.com/xxxxx';

            const welcomeHtml = buildVolunteerApprovalTemplate(name, role, groupLink);
            await sendEmail({
              to: email,
              subject: `Volunteer Approval & Assignment - ${event.name}`,
              html: welcomeHtml
            });
          } catch (emailErr) {
            console.warn(`Volunteer email failed for bulk-imported user ${email}`);
          }

        } else if (type === 'results') {
          // Fields: BIB Number, Finish Time, Rank
          const [bibNumber, finishTime, rankStr] = row;

          if (!bibNumber || !finishTime) {
            throw new Error('BIB Number and Finish Time are required');
          }

          // Find registration with this BIB
          const bib = await prisma.bib.findFirst({
            where: { eventId, bibNumber }
          });

          if (!bib) {
            throw new Error(`BIB Number '${bibNumber}' does not exist for this event`);
          }

          const registration = await prisma.registration.findFirst({
            where: { eventId, bibId: bib.id }
          });

          if (!registration) {
            throw new Error(`No participant is assigned to BIB Number '${bibNumber}'`);
          }

          // Update registration
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              finishTime,
              status: 'COMPLETED',
              finishedAt: new Date()
            }
          });

          // Update BIB status
          await prisma.bib.update({
            where: { id: bib.id },
            data: { status: 'FINISHED' }
          });

        } else if (type === 'sponsors') {
          // Fields: Company Name, Sponsor Name, Category, Contact Email
          const [companyName, contactName, categoryStr, contactEmail] = row;

          if (!companyName || !categoryStr) {
            throw new Error('Company Name and Category are required');
          }

          const validCats = ['TITLE', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];
          const category = categoryStr.toUpperCase();
          if (!validCats.includes(category)) {
            throw new Error(`Invalid Sponsor category: ${categoryStr}. Valid options: ${validCats.join(', ')}`);
          }

          await prisma.sponsor.create({
            data: {
              eventId,
              name: companyName,
              category,
              contactName: contactName || 'N/A',
              contactEmail: contactEmail || 'N/A'
            }
          });
        }

        processedCount++;

        await prisma.csvImportLog.create({
          data: {
            jobId: job.id,
            rowNumber: rowNum,
            status: 'SUCCESS',
            message: 'Imported row successfully'
          }
        });
      } catch (rowErr) {
        failedCount++;
        await prisma.csvImportLog.create({
          data: {
            jobId: job.id,
            rowNumber: rowNum,
            status: 'ERROR',
            message: rowErr.message,
            rowData: row
          }
        });
      }
    }

    // Update job status
    const finalStatus = failedCount === dataRows.length ? 'FAILED' : 'COMPLETED';
    await prisma.csvImportJob.update({
      where: { id: job.id },
      data: {
        status: finalStatus,
        processedRows: processedCount,
        failedRows: failedCount
      }
    });

    res.json({
      message: `CSV Import completed: ${processedCount} processed, ${failedCount} failed`,
      jobId: job.id,
      processed: processedCount,
      failed: failedCount
    });

  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({ error: 'Failed to complete CSV import processing' });
  }
};

// 3. Export Data (CSV or Excel)
export const exportData = async (req, res) => {
  const { eventId } = req.params;
  const { exportType, format } = req.query; // exportType: participants, volunteers, sponsors, registrations, certificates, tasks. format: csv, xlsx

  if (!exportType || !format) {
    return res.status(400).json({ error: 'exportType and format (csv/xlsx) are required query parameters' });
  }

  try {
    let data = [];
    let fileBaseName = `${exportType}-${eventId}`;

    switch (exportType) {
      case 'participants':
        const participants = await prisma.registration.findMany({
          where: { eventId },
          include: { user: true, bib: true }
        });
        data = participants.map(p => ({
          Name: p.user.name,
          Email: p.user.email,
          Phone: p.user.phone,
          Distance: p.distance,
          TShirtSize: p.tshirtSize,
          BIBNumber: p.bib?.bibNumber || 'Not Assigned',
          Status: p.status,
          RegisteredAt: p.createdAt.toISOString()
        }));
        break;

      case 'volunteers':
        const volunteers = await prisma.volunteerAssignment.findMany({
          where: { eventId },
          include: { user: true }
        });
        data = volunteers.map(v => ({
          Name: v.user.name,
          Email: v.user.email,
          Phone: v.user.phone,
          Role: v.volunteerRole,
          Status: v.status,
          ShiftStart: v.shiftStart ? v.shiftStart.toISOString() : 'N/A',
          ShiftEnd: v.shiftEnd ? v.shiftEnd.toISOString() : 'N/A'
        }));
        break;

      case 'sponsors':
        const sponsors = await prisma.sponsor.findMany({
          where: { eventId }
        });
        data = sponsors.map(s => ({
          CompanyName: s.name,
          SponsorName: s.contactName || 'N/A',
          Category: s.category,
          ContactEmail: s.contactEmail || 'N/A',
          ContactPhone: s.contactPhone || 'N/A'
        }));
        break;

      case 'registrations':
        const registrations = await prisma.registration.findMany({
          where: { eventId },
          include: { user: true, payments: true }
        });
        data = registrations.map(r => {
          const successPayment = r.payments.find(p => p.status === 'SUCCESSFUL');
          return {
            RegistrationId: r.id,
            Name: r.user.name,
            Email: r.user.email,
            Distance: r.distance,
            Status: r.status,
            PaymentStatus: successPayment ? 'PAID' : 'PENDING/FREE',
            PaidAmount: successPayment ? successPayment.amount : 0,
            CreatedAt: r.createdAt.toISOString()
          };
        });
        break;

      case 'certificates':
        const certs = await prisma.certificate.findMany({
          where: { eventId },
          include: { registration: { include: { user: true } } }
        });
        data = certs.map(c => ({
          ParticipantName: c.registration.user.name,
          Email: c.registration.user.email,
          Distance: c.registration.distance,
          FinishTime: c.registration.finishTime || 'N/A',
          CertificateUrl: c.certificateUrl,
          GeneratedAt: c.generatedAt.toISOString()
        }));
        break;

      case 'tasks':
        const tasks = await prisma.task.findMany({
          where: { eventId },
          include: { assignments: { include: { user: true } } }
        });
        data = tasks.map(t => ({
          Title: t.title,
          Category: t.category,
          Status: t.status,
          Priority: t.priority,
          Deadline: t.deadline ? t.deadline.toISOString() : 'N/A',
          AssignedTo: t.assignments.map(a => a.user.name).join(', ')
        }));
        break;

      default:
        return res.status(400).json({ error: `Invalid exportType: ${exportType}` });
    }

    if (data.length === 0) {
      // Create empty placeholder if no data
      data = [{ Message: 'No records found' }];
    }

    // Process formats
    if (format === 'csv') {
      // Build CSV String
      const keys = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(keys.join(','));

      for (const row of data) {
        const values = keys.map(key => {
          const val = row[key];
          const valStr = val === null || val === undefined ? '' : String(val);
          // Escape quotes and commas
          if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n')) {
            return `"${valStr.replace(/"/g, '""')}"`;
          }
          return valStr;
        });
        csvRows.push(values.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.csv"`);
      return res.send(csvRows.join('\n'));

    } else if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, exportType.toUpperCase());

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.xlsx"`);
      return res.send(buffer);
    } else {
      return res.status(400).json({ error: `Invalid format: ${format}` });
    }

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to generate export file' });
  }
};

// 4. Get CSV Import Logs for a Job
export const getImportJobLogs = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await prisma.csvImportJob.findUnique({
      where: { id: jobId },
      include: {
        logs: {
          orderBy: { rowNumber: 'asc' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get import job logs error:', error);
    res.status(500).json({ error: 'Failed to fetch import job logs' });
  }
};

// 5. Get List of Import/Export Jobs
export const getImportExportJobsList = async (req, res) => {
  const { eventId } = req.params;
  try {
    const imports = await prisma.csvImportJob.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ imports });
  } catch (error) {
    console.error('Get jobs list error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs list' });
  }
};
