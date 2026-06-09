import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const BRAND_COLOR = '#4A4238';
const BRAND_ACCENT = '#C9A86A';

const baseStyles = `
  body { margin: 0; padding: 0; background: #f7f4f0; font-family: Georgia, 'Times New Roman', serif; color: #1f1f1f; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border: 1px solid #e8e0d5; padding: 32px; }
  .brand { letter-spacing: 0.35em; font-size: 12px; text-transform: uppercase; color: ${BRAND_ACCENT}; margin-bottom: 24px; }
  h1 { font-size: 24px; font-weight: 400; margin: 0 0 16px; color: ${BRAND_COLOR}; }
  p { font-size: 15px; line-height: 1.7; margin: 0 0 16px; color: #4a4238; }
  .button { display: inline-block; padding: 14px 28px; background: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px; margin: 8px 0 24px; }
  .footer { font-size: 12px; color: #8a8278; margin-top: 24px; line-height: 1.6; }
  .link { color: ${BRAND_ACCENT}; word-break: break-all; }
`;

const wrapTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MARHAS</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">MARHAS</div>
      ${content}
    </div>
    <p class="footer">
      &copy; ${new Date().getFullYear()} MARHAS. Luxury womenswear.<br />
      If you did not request this email, you can safely ignore it.
    </p>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  verifyEmail: ({ name, verifyUrl }) =>
    wrapTemplate(`
      <h1>Verify your email</h1>
      <p>Dear ${name || 'Customer'},</p>
      <p>Thank you for joining MARHAS. Please confirm your email address to activate your account and access your orders and wishlist.</p>
      <a class="button" href="${verifyUrl}">Verify Email</a>
      <p>Or copy this link into your browser:</p>
      <p class="link">${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `),

  resetPassword: ({ name, resetUrl }) =>
    wrapTemplate(`
      <h1>Reset your password</h1>
      <p>Dear ${name || 'Customer'},</p>
      <p>We received a request to reset the password for your MARHAS account. Click the button below to choose a new password.</p>
      <a class="button" href="${resetUrl}">Reset Password</a>
      <p>Or copy this link into your browser:</p>
      <p class="link">${resetUrl}</p>
      <p>This link expires in 1 hour. If you did not request a reset, no action is required.</p>
    `),

  welcome: ({ name }) =>
    wrapTemplate(`
      <h1>Welcome to MARHAS</h1>
      <p>Dear ${name || 'Customer'},</p>
      <p>Your account is ready. Explore our latest collections, save favourites to your wishlist, and enjoy a seamless checkout experience.</p>
      <a class="button" href="${env.APP_URL}">Shop Collections</a>
      <p>We are delighted to have you with us.</p>
    `)
};

const createTransport = () => {
  if (!env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE ?? false,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined
  });
};

let transporter = createTransport();

export class EmailService {
  constructor(options = {}) {
    this.transporter = options.transporter ?? transporter;
    this.from = options.from ?? env.EMAIL_FROM;
    this.appUrl = options.appUrl ?? env.APP_URL;
  }

  isConfigured() {
    return Boolean(this.transporter);
  }

  async sendMail({ to, subject, html, text }) {
    if (!this.transporter) {
      logger.warn({ to, subject }, 'Email skipped — SMTP not configured');
      return { messageId: null, preview: true, to, subject };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      });

      logger.info({ messageId: info.messageId, to, subject }, 'Email sent');
      return info;
    } catch (error) {
      logger.warn({ err: error.message, to, subject }, 'Email delivery failed');

      if (env.NODE_ENV === 'production') {
        throw error;
      }

      return { messageId: null, failed: true, to, subject };
    }
  }

  buildVerifyUrl(token) {
    return `${this.appUrl}/verify-email/${token}`;
  }

  buildResetUrl(token) {
    return `${this.appUrl}/reset-password?token=${token}`;
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  getVerificationExpiry() {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  getResetExpiry() {
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  async sendVerificationEmail({ to, name, token }) {
    const verifyUrl = this.buildVerifyUrl(token);
    return this.sendMail({
      to,
      subject: 'Verify your MARHAS account',
      html: emailTemplates.verifyEmail({ name, verifyUrl })
    });
  }

  async sendPasswordResetEmail({ to, name, token }) {
    const resetUrl = this.buildResetUrl(token);
    return this.sendMail({
      to,
      subject: 'Reset your MARHAS password',
      html: emailTemplates.resetPassword({ name, resetUrl })
    });
  }

  async sendWelcomeEmail({ to, name }) {
    return this.sendMail({
      to,
      subject: 'Welcome to MARHAS',
      html: emailTemplates.welcome({ name })
    });
  }
}

export const emailService = new EmailService();
