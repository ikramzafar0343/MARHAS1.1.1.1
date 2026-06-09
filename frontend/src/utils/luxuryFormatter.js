/**
 * Formats price in a luxury minimalist style
 */
export const formatLuxuryPrice = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Editorial date formatter
 */
export const formatEditorialDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
};
