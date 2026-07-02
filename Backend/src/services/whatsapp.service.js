import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { normalizeWhatsAppPhone } from '../utils/phone.js';

const formatPkr = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

const formatPaymentMethod = (method) => {
  if (method === 'online') {
    return 'Online Payment';
  }

  return 'Cash on Delivery';
};

export class WhatsAppService {
  constructor(options = {}) {
    this.enabled = options.enabled ?? env.WHATSAPP_ENABLED;
    this.accessToken = options.accessToken ?? env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = options.phoneNumberId ?? env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiVersion = options.apiVersion ?? env.WHATSAPP_API_VERSION;
  }

  isConfigured() {
    return Boolean(this.enabled && this.accessToken && this.phoneNumberId);
  }

  buildOrderConfirmationMessage(order) {
    const orderNumber = order.orderNumber?.replace(/^#/, '') || order.orderNumber;
    const city = order.shipping?.city || '';

    return [
      `Hello ${order.customer},`,
      '',
      'Thank you for your order at MARHAS.',
      '',
      `Order: ${orderNumber}`,
      `Total: ${formatPkr(order.total)}`,
      `Payment: ${formatPaymentMethod(order.paymentMethod)}`,
      city ? `Delivery city: ${city}` : '',
      '',
      'We will notify you when your order ships.',
      '',
      'MARHAS',
      env.SUPPORT_EMAIL
    ]
      .filter(Boolean)
      .join('\n');
  }

  async sendTextMessage(toPhone, body) {
    const to = normalizeWhatsAppPhone(toPhone);

    if (!to) {
      throw new Error('Invalid WhatsApp phone number');
    }

    if (!this.isConfigured()) {
      logger.warn({ to }, 'WhatsApp skipped — API not configured');
      return { preview: true, to, body };
    }

    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body }
        })
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.error?.message || `WhatsApp API error (${response.status})`;
      throw new Error(message);
    }

    logger.info({ to, messageId: payload.messages?.[0]?.id }, 'WhatsApp message sent');
    return payload;
  }

  async sendOrderConfirmation(order) {
    const body = this.buildOrderConfirmationMessage(order);
    return this.sendTextMessage(order.phone, body);
  }
}

export const whatsAppService = new WhatsAppService();
