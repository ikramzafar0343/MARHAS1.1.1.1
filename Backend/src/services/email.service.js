import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import {
  buildSmtpTransportOptions,
  getSmtpReadiness,
  resolveEmailFrom
} from '../config/smtp.js';
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
    `),

  adminLoginOtp: ({ adminName, adminEmail, otp, expiresMinutes }) =>
    wrapTemplate(`
      <h1>Admin sign-in code</h1>
      <p>A sign-in attempt was made for the MARHAS admin portal.</p>
      <p><strong>Admin:</strong> ${adminName || 'MARHAS Admin'} (${adminEmail})</p>
      <p style="font-size: 28px; letter-spacing: 0.35em; text-align: center; margin: 24px 0; color: ${BRAND_COLOR};">${otp}</p>
      <p>Enter this verification code to complete admin access. It expires in ${expiresMinutes} minutes.</p>
      <p>If you did not attempt to sign in, secure your admin account immediately.</p>
    `),

  orderConfirmation: ({
    customerName,
    orderNumber,
    itemsHtml,
    subtotal,
    shippingFee,
    taxAmount,
    taxLabel,
    taxRate,
    total,
    paymentMethod,
    shippingAddress,
    orderUrl
  }) => {
    const taxRow =
      taxAmount > 0
        ? `<tr><td style="padding: 6px 0;">${taxLabel}${taxRate ? ` (${taxRate}%)` : ''}</td><td style="padding: 6px 0; text-align: right;">PKR ${Number(taxAmount).toLocaleString('en-PK')}</td></tr>`
        : '';

    return wrapTemplate(`
      <h1>Order confirmed</h1>
      <p>Dear ${customerName || 'Customer'},</p>
      <p>Thank you for shopping with MARHAS. Your order <strong>${orderNumber}</strong> has been received and is being prepared.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 8px; border-bottom: 1px solid #ece4da; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8278;">Item</th>
            <th style="text-align: right; padding-bottom: 8px; border-bottom: 1px solid #ece4da; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8278;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
        <tr><td style="padding: 6px 0;">Subtotal</td><td style="padding: 6px 0; text-align: right;">PKR ${Number(subtotal).toLocaleString('en-PK')}</td></tr>
        <tr><td style="padding: 6px 0;">Shipping</td><td style="padding: 6px 0; text-align: right;">${shippingFee === 0 ? 'Free' : `PKR ${Number(shippingFee).toLocaleString('en-PK')}`}</td></tr>
        ${taxRow}
        <tr><td style="padding: 10px 0; font-weight: 600;">Total Paid</td><td style="padding: 10px 0; text-align: right; font-weight: 600;">PKR ${Number(total).toLocaleString('en-PK')}</td></tr>
      </table>
      <p><strong>Payment:</strong> ${paymentMethod}</p>
      <p><strong>Delivery:</strong><br />${shippingAddress}</p>
      <a class="button" href="${orderUrl}">View Order</a>
      <p>You can download your invoice from the order confirmation page.</p>
    `);
  }
};

const createTransport = () => {
  const options = buildSmtpTransportOptions();
  return options ? nodemailer.createTransport(options) : null;
};

let transporter = createTransport();

export class EmailService {
  constructor(options = {}) {
    this.transporter = options.transporter ?? transporter;
    this.from = options.from ?? resolveEmailFrom();
    this.appUrl = options.appUrl ?? env.APP_URL;
  }

  isConfigured() {
    return getSmtpReadiness().configured && Boolean(this.transporter);
  }

  async verifyConnection() {
    if (!this.transporter || !getSmtpReadiness().configured) {
      return { ok: false, reason: 'SMTP is not fully configured' };
    }

    try {
      await this.transporter.verify();
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error.message };
    }
  }

  async sendMail({ to, subject, html, text }) {
    if (!this.transporter) {
      logger.warn({ to, subject }, 'Email skipped — SMTP not configured');

      if (env.NODE_ENV === 'production') {
        throw new Error('SMTP is not configured on the server');
      }

      return { messageId: null, preview: true, to, subject };
    }

    if (!env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn({ to, subject }, 'Email skipped — SMTP credentials missing');

      if (env.NODE_ENV === 'production') {
        throw new Error('SMTP credentials are not configured on the server');
      }

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

  getAdminOtpExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  async sendAdminLoginOtpEmail({ to, adminName, adminEmail, otp }) {
    return this.sendMail({
      to,
      subject: 'MARHAS admin sign-in verification code',
      html: emailTemplates.adminLoginOtp({
        adminName,
        adminEmail,
        otp,
        expiresMinutes: 10
      })
    });
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

  formatPaymentMethod(method) {
    if (method === 'online') {
      return 'Online Payment';
    }

    return 'Cash on Delivery';
  }

  buildOrderItemsHtml(items = []) {
    return items
      .map((item) => {
        const meta = [item.color, item.size ? `Size ${item.size}` : null, `Qty ${item.quantity}`]
          .filter(Boolean)
          .join(' · ');

        return `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #ece4da;">
              <strong>${item.name}</strong><br />
              <span style="font-size: 13px; color: #8a8278;">${meta}</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #ece4da; text-align: right; white-space: nowrap;">
              PKR ${Number(item.price * item.quantity).toLocaleString('en-PK')}
            </td>
          </tr>
        `;
      })
      .join('');
  }

  async sendOrderConfirmationEmail({ order, orderUrl }) {
    const orderNumber = order.orderNumber?.replace(/^#/, '') || order.orderNumber;
    const shippingAddress = [
      order.customer,
      order.shipping?.address,
      [order.shipping?.city, order.shipping?.postalCode].filter(Boolean).join(', '),
      order.phone
    ]
      .filter(Boolean)
      .join('<br />');

    return this.sendMail({
      to: order.email,
      subject: `MARHAS order confirmation ${orderNumber}`,
      html: emailTemplates.orderConfirmation({
        customerName: order.customer,
        orderNumber,
        itemsHtml: this.buildOrderItemsHtml(order.items),
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        taxAmount: order.taxAmount ?? 0,
        taxLabel: order.taxLabel || 'GST',
        taxRate: order.taxRate ?? 0,
        total: order.total,
        paymentMethod: this.formatPaymentMethod(order.paymentMethod),
        shippingAddress,
        orderUrl
      })
    });
  }
}

export const emailService = new EmailService();
