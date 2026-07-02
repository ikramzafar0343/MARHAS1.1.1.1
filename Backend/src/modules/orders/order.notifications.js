import { emailService } from '../../services/email.service.js';
import { whatsAppService } from '../../services/whatsapp.service.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

const buildOrderUrl = (orderNumber) => {
  const reference = String(orderNumber || '').replace(/^#/, '');
  return `${env.APP_URL}/order-confirmation/${reference}`;
};

export const sendOrderConfirmationNotifications = async (order) => {
  const results = await Promise.allSettled([
    emailService.sendOrderConfirmationEmail({
      order,
      orderUrl: buildOrderUrl(order.orderNumber)
    }),
    whatsAppService.sendOrderConfirmation(order)
  ]);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const channel = index === 0 ? 'email' : 'whatsapp';
      logger.warn(
        { err: result.reason?.message, orderNumber: order.orderNumber, channel },
        'Order confirmation notification failed'
      );
    }
  });

  return results;
};
