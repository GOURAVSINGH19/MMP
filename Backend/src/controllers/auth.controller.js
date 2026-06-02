import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { sendEmail, buildPasswordResetOtpTemplate } from '../services/email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_marathon_key_2026';

export const register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, phone, and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        platformRole: 'PARTICIPANT'
      }
    });

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, platformRole: user.platformRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.platformRole
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, platformRole: user.platformRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.platformRole
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.platformRole
    });
  } catch (error) {
    console.error('❌ Me endpoint error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  return true;
};

const signPasswordResetToken = (email) => jwt.sign(
  { email, purpose: 'PASSWORD_RESET_OTP' },
  JWT_SECRET,
  { expiresIn: '15m' }
);

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security: don't disclose user non-existence
      return res.json({ message: 'If that email address exists in our system, we have sent a reset OTP to it.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.passwordResetOtp.updateMany({
      where: {
        email,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    });

    await prisma.passwordResetOtp.create({
      data: {
        email,
        otp,
        expiresAt
      }
    });

    const resetHtml = buildPasswordResetOtpTemplate(user.name, otp);
    await sendEmail({
      to: email,
      subject: 'Your password reset OTP - Marathon Management Portal',
      html: resetHtml
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user.id
      }
    });

    res.json({ message: 'If that email address exists in our system, we have sent a reset OTP to it.' });
  } catch (error) {
    console.error('Send password reset OTP error:', error);
    res.status(500).json({ error: 'Failed to send password reset OTP' });
  }
};

export const forgotPassword = sendOtp;

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const resetOtp = await prisma.passwordResetOtp.findFirst({
      where: {
        email,
        otp,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!resetOtp) {
      return res.status(400).json({ error: 'OTP has expired or is invalid. Please request a new one.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.passwordResetOtp.update({
      where: { id: resetOtp.id },
      data: { used: true }
    });

    const token = signPasswordResetToken(email);
    res.json({ message: 'OTP verified successfully.', token });
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    res.status(500).json({ error: 'Failed to verify password reset OTP' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (!validatePasswordStrength(newPassword)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Reset token has expired or is invalid. Please verify your OTP again.' });
    }

    if (decoded.purpose !== 'PASSWORD_RESET_OTP' || !decoded.email) {
      return res.status(400).json({ error: 'Reset token has expired or is invalid. Please verify your OTP again.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'User',
          entityId: user.id
        }
      })
    ]);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

