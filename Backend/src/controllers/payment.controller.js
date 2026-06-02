import prisma from '../prisma/client.js';
import { sendEmail, buildWelcomeTemplate } from '../services/email.service.js';

// 1. Initiate Paytm Payment
export const initiatePayment = async (req, res) => {
  const { registrationId } = req.body;
  if (!registrationId) {
    return res.status(400).json({ error: 'Registration ID is required' });
  }

  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true, user: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const { event, user } = registration;

    if (!event.isPaid) {
      return res.status(400).json({ error: 'This event is free. No payment is required.' });
    }

    // Total = Fee + Tax + Convenience Fee
    const amount = event.registrationFee + (event.tax || 0) + (event.convenienceFee || 0);
    const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create Payment
      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          userId: user.id,
          eventId: event.id,
          amount,
          currency: event.currency || 'INR',
          status: 'PENDING',
          orderId
        }
      });

      // Update Registration status to PAYMENT_PENDING
      await tx.registration.update({
        where: { id: registration.id },
        data: { status: 'PAYMENT_PENDING' }
      });

      // Create Payment Transaction
      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          action: 'CHARGE',
          status: 'PENDING'
        }
      });

      // Audit Log
      await tx.paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          userId: req.user.id,
          action: 'INITIATE',
          amount,
          details: `Initiated payment of ${amount} ${event.currency} for order ${orderId}`
        }
      });

      return payment;
    });

    res.status(201).json({
      message: 'Payment checkout initiated',
      payment: result
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: 'Failed to initiate payment gateway checkout' });
  }
};

// 2. Handle Paytm Callback Simulation
export const handlePaytmCallback = async (req, res) => {
  const { paymentId } = req.params;
  const { status, txnId } = req.body; // status: 'SUCCESS' or 'FAILURE'

  if (!status) {
    return res.status(400).json({ error: 'Callback status (SUCCESS/FAILURE) is required' });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { registration: { include: { user: true } }, event: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const newPaymentStatus = status === 'SUCCESS' ? 'SUCCESSFUL' : 'FAILED';
    const newRegStatus = status === 'SUCCESS' ? 'REGISTERED' : 'PAYMENT_FAILED';

    const updated = await prisma.$transaction(async (tx) => {
      // Update Payment
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: newPaymentStatus,
          txnId: txnId || `TXN-${Date.now()}`
        }
      });

      // Update Registration
      await tx.registration.update({
        where: { id: payment.registrationId },
        data: { status: newRegStatus }
      });

      // Create Transaction log
      await tx.paymentTransaction.create({
        data: {
          paymentId,
          action: 'CALLBACK',
          status: newPaymentStatus,
          responsePayload: req.body
        }
      });

      // Audit Log
      await tx.paymentAuditLog.create({
        data: {
          paymentId,
          userId: payment.userId,
          action: status === 'SUCCESS' ? 'SUCCESS' : 'FAILURE',
          amount: payment.amount,
          details: `Payment callback processed. Result: ${newPaymentStatus}. TxnId: ${txnId || 'N/A'}`
        }
      });

      // If success, register participant model if not exists
      if (status === 'SUCCESS') {
        const existingPart = await tx.participant.findUnique({
          where: {
            eventId_userId: {
              eventId: payment.eventId,
              userId: payment.userId
            }
          }
        });
        if (!existingPart) {
          await tx.participant.create({
            data: {
              eventId: payment.eventId,
              userId: payment.userId
            }
          });
        }
      }

      return p;
    });

    // Send Welcome email if successful
    if (status === 'SUCCESS') {
      try {
        const whatsappCommunityGroup = await prisma.whatsappGroup.findFirst({
          where: {
            eventId: payment.eventId,
            groupType: 'COMMUNITY'
          }
        });

        const communityLink = whatsappCommunityGroup?.link || 'https://chat.whatsapp.com/xxxxx';
        const welcomeHtml = buildWelcomeTemplate(
          payment.registration.user.name,
          payment.registration.user.email,
          '-- Saved in Dashboard --',
          communityLink
        );

        await sendEmail({
          to: payment.registration.user.email,
          subject: `Payment Successful & Registration Confirmed for ${payment.event.name}!`,
          html: welcomeHtml
        });
      } catch (err) {
        console.warn('Welcome/payment success email failed to send:', err.message);
      }
    }

    res.json({
      message: `Payment status updated to ${newPaymentStatus}`,
      payment: updated
    });
  } catch (error) {
    console.error('Handle payment callback error:', error);
    res.status(500).json({ error: 'Failed to process payment callback simulation' });
  }
};

// 3. Request Refund
export const requestRefund = async (req, res) => {
  const { paymentId, reason } = req.body;

  if (!paymentId || !reason) {
    return res.status(400).json({ error: 'Payment ID and reason are required' });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { registration: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'SUCCESSFUL') {
      return res.status(400).json({ error: 'Only successful payments can be refunded' });
    }

    const refund = await prisma.$transaction(async (tx) => {
      const ref = await tx.refundRequest.create({
        data: {
          paymentId,
          amount: payment.amount,
          reason,
          status: 'PENDING'
        }
      });

      await tx.paymentAuditLog.create({
        data: {
          paymentId,
          userId: req.user.id,
          action: 'REFUND_REQUEST',
          amount: payment.amount,
          details: `Requested refund of ${payment.amount} for payment ${paymentId}. Reason: ${reason}`
        }
      });

      return ref;
    });

    res.status(201).json({
      message: 'Refund request submitted successfully',
      refund
    });
  } catch (error) {
    console.error('Refund request error:', error);
    res.status(500).json({ error: 'Failed to submit refund request' });
  }
};

// 4. Process Refund (Approved / Rejected)
export const processRefund = async (req, res) => {
  const { id } = req.params; // Refund request ID
  const { status } = req.body; // 'APPROVED' or 'REJECTED'

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
  }

  try {
    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id },
      include: { payment: true }
    });

    if (!refundRequest) {
      return res.status(404).json({ error: 'Refund request not found' });
    }

    if (refundRequest.status !== 'PENDING') {
      return res.status(400).json({ error: 'Refund request has already been processed' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ref = await tx.refundRequest.update({
        where: { id },
        data: {
          status,
          processedBy: req.user.id,
          processedAt: new Date()
        }
      });

      if (status === 'APPROVED') {
        // Update payment status to REFUNDED
        await tx.payment.update({
          where: { id: refundRequest.paymentId },
          data: { status: 'REFUNDED' }
        });

        // Update registration status to REFUNDED
        await tx.registration.update({
          where: { id: refundRequest.payment.registrationId },
          data: { status: 'REFUNDED' }
        });

        // Create transaction logs
        await tx.paymentTransaction.create({
          data: {
            paymentId: refundRequest.paymentId,
            action: 'REFUND',
            status: 'REFUNDED'
          }
        });
      }

      await tx.paymentAuditLog.create({
        data: {
          paymentId: refundRequest.paymentId,
          userId: req.user.id,
          action: status === 'APPROVED' ? 'REFUND_SUCCESS' : 'REFUND_FAILURE',
          amount: refundRequest.amount,
          details: `Refund request ${status}. Processed by manager ${req.user.name}`
        }
      });

      return ref;
    });

    res.json({
      message: `Refund request successfully ${status}`,
      refund: updated
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Failed to process refund request' });
  }
};

// 5. Payment Dashboard Statistics
export const getPaymentDashboard = async (req, res) => {
  const { eventId } = req.params;

  try {
    const payments = await prisma.payment.findMany({
      where: { eventId },
      include: {
        user: { select: { name: true, email: true } },
        refunds: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const refunds = await prisma.refundRequest.findMany({
      where: { payment: { eventId } },
      include: {
        payment: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const successfulPayments = payments.filter(p => p.status === 'SUCCESSFUL');
    const failedPayments = payments.filter(p => p.status === 'FAILED');
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      totalRevenue,
      successfulCount: successfulPayments.length,
      failedCount: failedPayments.length,
      refundRequestsCount: refunds.filter(r => r.status === 'PENDING').length,
      payments,
      refunds
    });
  } catch (error) {
    console.error('Payment dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch payment dashboard data' });
  }
};

// 6. WhatsApp Group Config Endpoints
export const getWhatsappGroups = async (req, res) => {
  const { eventId } = req.params;
  try {
    const groups = await prisma.whatsappGroup.findMany({
      where: { eventId }
    });
    res.json(groups);
  } catch (error) {
    console.error('Get WhatsApp groups error:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp group links' });
  }
};

export const upsertWhatsappGroup = async (req, res) => {
  const { eventId } = req.params;
  const { groupType, link } = req.body;

  if (!groupType || !link) {
    return res.status(400).json({ error: 'Group type and WhatsApp link are required' });
  }

  try {
    const existing = await prisma.whatsappGroup.findFirst({
      where: { eventId, groupType }
    });

    let group;
    if (existing) {
      group = await prisma.whatsappGroup.update({
        where: { id: existing.id },
        data: { link }
      });
    } else {
      group = await prisma.whatsappGroup.create({
        data: {
          eventId,
          groupType,
          link
        }
      });
    }

    res.json({
      message: 'WhatsApp group link configured successfully',
      group
    });
  } catch (error) {
    console.error('Upsert WhatsApp group error:', error);
    res.status(500).json({ error: 'Failed to configure WhatsApp group link' });
  }
};

// 7. Payment Audit Logs (Global or Event-Specific)
export const getPaymentAuditLogs = async (req, res) => {
  const { eventId } = req.params;
  try {
    const logs = await prisma.paymentAuditLog.findMany({
      where: {
        payment: { eventId }
      },
      include: {
        user: { select: { name: true, email: true } },
        payment: { select: { orderId: true } }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error('Get payment audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch payment audit logs' });
  }
};

/** Public gateway webhook (Razorpay/Paytm/Stripe-style payload) */
export const paymentGatewayWebhook = async (req, res) => {
  const { orderId, status, txnId } = req.body;
  const secret = req.headers['x-webhook-secret'];

  if (process.env.PAYMENT_WEBHOOK_SECRET && secret !== process.env.PAYMENT_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }

  if (!orderId || !status) {
    return res.status(400).json({ error: 'orderId and status are required' });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { registration: { include: { user: true } }, event: true },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found for orderId' });
    }

    req.params = { paymentId: payment.id };
    req.body = { status: status === 'SUCCESS' || status === 'SUCCESSFUL' ? 'SUCCESS' : 'FAILURE', txnId };
    return handlePaytmCallback(req, res);
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const getPaymentById = async (req, res) => {
  const { paymentId } = req.params;
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { event: true, registration: true }
    });
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
};
