export const normalizeWhatsAppPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('92')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `92${digits.slice(1)}`;
  }

  return digits;
};
