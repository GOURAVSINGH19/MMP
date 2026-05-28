import { Resend } from 'resend';

/**
 * Lazily creates a Resend client on each sendEmail() call.
 * This fixes the ES Module hoisting issue where `process.env` variables
 * are read before `dotenv/config` has populated them at module-load time.
 */
const getResendClient = () => {
  const key = process.env.RESEND_API_KEY;
  console.log(key)
  if (key && key !== 're_placeholder') {
    return new Resend(key);
  }
  return null;
};

// Mock Email Logger when Resend is not configured or fails
const logMockEmail = (to, subject, html, attachments = []) => {
  console.log('\n=================== 📨 MOCK EMAIL OUTBOX ===================');
  console.log(`To:          ${to}`);
  console.log(`Subject:     ${subject}`);
  console.log(`Attachments: ${attachments.length > 0 ? attachments.map(a => a.filename).join(', ') : 'None'}`);
  console.log('------------------------------------------------------------');
  console.log(html.replace(/<[^>]*>/g, ' ').substring(0, 500) + '...');
  console.log('============================================================\n');
};

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const resend = getResendClient();

  if (!resend) {
    console.warn('⚠️  RESEND_API_KEY not set or is placeholder — using mock email logger.');
    logMockEmail(to, subject, html, attachments);
    return { success: true, mock: true };
  }

  console.log(`Sending real email via Resend → To: ${to} | Subject: ${subject}`);

  try {
    const data = await resend.emails.send({
      from: 'Marathon MMP <onboarding@resend.dev>',
      to,
      subject,
      html,
      attachments
    });
    console.log(`Resend email sent successfully! ID: ${data?.data?.id || JSON.stringify(data)}`);
    return { success: true, data };
  } catch (error) {
    console.error('Resend API error:', error.message);
    logMockEmail(to, subject, html, attachments);
    return { success: true, mock: true, error: error.message };
  }
};

// Email templates builders
export const buildWelcomeTemplate = (name, email, password) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #aa3bff; margin-bottom: 20px;">Welcome to the Marathon, ${name}!</h2>
      <p>Thank you for registering for our upcoming marathon event! We are thrilled to have you join us.</p>
      <p>A participant account has been automatically created for you. You can use these credentials to log in to your dashboard and track your status.</p>
      <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px dashed #aa3bff;">
        <p style="margin: 5px 0;"><strong>Dashboard URL:</strong> <a href="http://localhost:5173/login" style="color: #aa3bff;">Log In Here</a></p>
        <p style="margin: 5px 0;"><strong>Username/Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #edf2f7; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
      </div>
      <p style="font-size: 14px; color: #718096;">Please log in at your earliest convenience to check your registration details. Once the organizers approve your registration, you can confirm your spot!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">Marathon Management Portal &copy; 2026. All rights reserved.</p>
    </div>
  `;
};

export const buildApprovedTemplate = (name) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #10b981; margin-bottom: 20px;">Good News! Your Marathon Registration is Approved!</h2>
      <p>Hello ${name},</p>
      <p>We are excited to let you know that the organizers have verified and <strong>APPROVED</strong> your registration for the marathon!</p>
      <p>To confirm your participation and secure your entry slot, please log in to your dashboard and click the **Confirm Attendance** button.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5173/login" style="background-color: #aa3bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirm My Spot Now</a>
      </div>
      <p style="font-size: 14px; color: #718096;">Once confirmed, we will allocate your bib number and generate your check-in QR code.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">Marathon Management Portal &copy; 2026. All rights reserved.</p>
    </div>
  `;
};

export const buildBibAssignedTemplate = (name, bibNumber, qrCodeDataUrl) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #aa3bff; margin-bottom: 20px;">Your Marathon BIB is Ready!</h2>
      <p>Hello ${name},</p>
      <p>Your official marathon bib has been allocated! You are officially confirmed for the starting lineup.</p>
      
      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; border: 2px solid #aa3bff; max-width: 320px; margin: 20px auto; text-align: center;">
        <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; font-weight: bold;">Official BIB</div>
        <div style="font-size: 48px; font-weight: 800; color: #111827; margin: 10px 0;">${bibNumber}</div>
        <div style="font-size: 14px; font-weight: bold; color: #aa3bff; margin-bottom: 15px;">PARTICIPANT</div>
        
        <div style="background: white; padding: 10px; display: inline-block; border-radius: 8px; border: 1px solid #e5e7eb;">
          <!-- Embedded Base64 QR Image -->
          <img src="${qrCodeDataUrl}" alt="Check-in QR Code" style="width: 150px; height: 150px; display: block;" />
        </div>
        <p style="font-size: 11px; color: #6b7280; margin-top: 8px; margin-bottom: 0;">Scan this at the bib counter to collect your physical kit.</p>
      </div>

      <p><strong>Kit Collection instructions:</strong> Please save this email and present the QR code at the kit collection counter to collect your marathon physical bib, t-shirt, and timing chip.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">Marathon Management Portal &copy; 2026. All rights reserved.</p>
    </div>
  `;
};

export const buildCertificateReadyTemplate = (name, finishTime, distance) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #aa3bff; margin-bottom: 20px;">Congratulations, Marathon Finisher! </h2>
      <p>Hello ${name},</p>
      <p>What an incredible achievement! You successfully crossed the finish line of the <strong>${distance}</strong> category!</p>
      
      <div style="background: linear-gradient(135deg, rgba(170, 59, 255, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%); border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937;">Your Official Finish Stats</h3>
        <p style="font-size: 18px; margin: 5px 0;">Category: <strong>${distance}</strong></p>
        <p style="font-size: 18px; margin: 5px 0;">Official Finish Time: <strong style="color: #aa3bff;">${finishTime}</strong></p>
      </div>

      <p>Your official marathon completion certificate has been generated and is attached to this email. You can also view or download it at any time directly from your participant dashboard.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5173/login" style="background-color: #aa3bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Participant Dashboard</a>
      </div>
      
      <p>We are incredibly proud of your performance. See you at the next starting line!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">Marathon Management Portal &copy; 2026. All rights reserved.</p>
    </div>
  `;
};
