import PDFDocument from 'pdfkit';

/**
 * Dynamically generates a beautiful marathon finisher certificate using PDFKit
 * and pipes it to the HTTP response stream.
 * @param {Object} participant - Participant and registration details
 * @param {import('express').Response} res - Express response stream
 */
export const generateCertificatePDF = (participant, res) => {
   const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
   });

   // Pipe the PDF direct to the response
   doc.pipe(res);

   // --- Background Design & Border ---
   // Outer Border Accent (Violet)
   doc.rect(20, 20, 802, 555)
      .lineWidth(8)
      .stroke('#aa3bff');

   // Inner Border Accent (Thin Green/Teal)
   doc.rect(32, 32, 778, 531)
      .lineWidth(2)
      .stroke('#10b981');

   // Decorative corner accents (violet squares)
   const drawCornerAccent = (x, y) => {
      doc.rect(x, y, 15, 15).fill('#aa3bff');
   };
   drawCornerAccent(35, 35);
   drawCornerAccent(792, 35);
   drawCornerAccent(35, 542);
   drawCornerAccent(792, 542);

   // --- Certificate Title & Branding ---
   doc.moveDown(3);
   doc.font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#aa3bff')
      .text('ANNUAL METROPOLIS MARATHON 2026', { align: 'center', characterSpacing: 2 });

   doc.moveDown(1.5);
   doc.font('Helvetica-Bold')
      .fontSize(36)
      .fillColor('#111827')
      .text('CERTIFICATE OF COMPLETION', { align: 'center' });

   doc.moveDown(0.5);
   doc.font('Helvetica')
      .fontSize(14)
      .fillColor('#6b7280')
      .text('This is proudly presented to', { align: 'center' });

   // --- Participant Name ---
   doc.moveDown(1);
   doc.font('Helvetica-Bold')
      .fontSize(28)
      .fillColor('#111827')
      .text(participant.user.name.toUpperCase(), { align: 'center' });

   // Decorative separator line under name
   doc.moveDown(0.5);
   doc.lineCap('round')
      .moveTo(250, doc.y)
      .lineTo(592, doc.y)
      .lineWidth(2)
      .stroke('#aa3bff');

   // --- Completion Details ---
   doc.moveDown(1.5);
   doc.font('Helvetica')
      .fontSize(14)
      .fillColor('#6b7280')
      .text(`for successfully completing the official distance of`, { align: 'center' });

   doc.moveDown(0.5);
   doc.font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#aa3bff')
      .text(`${participant.distance} Category`, { align: 'center' });

   doc.moveDown(0.8);
   doc.font('Helvetica')
      .fontSize(14)
      .fillColor('#6b7280')
      .text('with an official finish time of', { align: 'center' });

   doc.moveDown(0.5);
   doc.font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#10b981')
      .text(participant.finishTime || 'N/A', { align: 'center' });

   // --- Bottom Section (Signatures & Date) ---
   const signatureY = 470;

   // Left Signature: Director
   doc.moveTo(120, signatureY)
      .lineTo(280, signatureY)
      .lineWidth(1)
      .stroke('#9ca3af');
   doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#374151')
      .text('Marcus Vance', 120, signatureY + 8)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('Race Director', 120, signatureY + 22);

   // Middle Seal/Branding
   doc.font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#aa3bff')
      .text('★ FINISHER ★', 370, signatureY - 10, { align: 'center' });

   // Right Signature: Date / Timing official
   doc.moveTo(560, signatureY)
      .lineTo(720, signatureY)
      .lineWidth(1)
      .stroke('#9ca3af');
   doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#374151')
      .text('May 28, 2026', 560, signatureY + 8)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('Event Date', 560, signatureY + 22);

   // Finalize the PDF document
   doc.end();
};
