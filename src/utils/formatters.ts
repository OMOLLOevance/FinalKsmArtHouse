/**
 * Standard formatters for the application
 */

/**
 * Format number as currency (KSH)
 */
export const formatCurrency = (amount: number): string => {
  const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(safeAmount).replace('KES', 'KSH');
};

/**
 * Format date to standard display format
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Sanitize phone number for WhatsApp/SMS
 */
export const sanitizePhoneNumber = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('254')) return clean;
  if (clean.startsWith('0')) return '254' + clean.substring(1);
  return '254' + clean;
};
