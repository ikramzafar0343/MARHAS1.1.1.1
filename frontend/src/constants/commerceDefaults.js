export const DEFAULT_COMMERCE_SETTINGS = {
  currency: 'PKR',
  standardShippingFee: 500,
  freeShippingThreshold: 15000,
  freeShippingEnabled: true,
  taxEnabled: true,
  taxRate: 17,
  taxLabel: 'GST'
};

export const resolveCommerceSettings = (settings = {}) => ({
  currency: settings.currency || DEFAULT_COMMERCE_SETTINGS.currency,
  standardShippingFee: Number(
    settings.standardShippingFee ?? DEFAULT_COMMERCE_SETTINGS.standardShippingFee
  ),
  freeShippingThreshold: Number(
    settings.freeShippingThreshold ?? DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold
  ),
  freeShippingEnabled:
    settings.freeShippingEnabled ?? DEFAULT_COMMERCE_SETTINGS.freeShippingEnabled,
  taxEnabled: settings.taxEnabled ?? DEFAULT_COMMERCE_SETTINGS.taxEnabled,
  taxRate: Number(settings.taxRate ?? DEFAULT_COMMERCE_SETTINGS.taxRate),
  taxLabel: (settings.taxLabel || DEFAULT_COMMERCE_SETTINGS.taxLabel).trim()
});

export const calculateShippingFee = (subtotal, settings = DEFAULT_COMMERCE_SETTINGS) => {
  const commerce = resolveCommerceSettings(settings);

  if (
    commerce.freeShippingEnabled &&
    commerce.freeShippingThreshold > 0 &&
    subtotal >= commerce.freeShippingThreshold
  ) {
    return 0;
  }

  return Math.max(0, commerce.standardShippingFee);
};

export const calculateTaxAmount = (subtotal, settings = DEFAULT_COMMERCE_SETTINGS) => {
  const commerce = resolveCommerceSettings(settings);

  if (!commerce.taxEnabled || commerce.taxRate <= 0) {
    return 0;
  }

  return Math.round((subtotal * commerce.taxRate) / 100);
};

export const calculateOrderTotal = (subtotal, settings = DEFAULT_COMMERCE_SETTINGS) => {
  const shippingFee = calculateShippingFee(subtotal, settings);
  const taxAmount = calculateTaxAmount(subtotal, settings);
  return subtotal + shippingFee + taxAmount;
};

export const getFreeShippingNote = (settings = DEFAULT_COMMERCE_SETTINGS) => {
  const commerce = resolveCommerceSettings(settings);

  if (!commerce.freeShippingEnabled || commerce.freeShippingThreshold <= 0) {
    return null;
  }

  return `Free shipping on orders above ${commerce.currency} ${commerce.freeShippingThreshold.toLocaleString()}.`;
};
