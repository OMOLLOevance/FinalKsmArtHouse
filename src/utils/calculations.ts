/**
 * Finance and date-based calculations for the business
 */

/**
 * Calculate the end date of a membership based on its package type
 */
export const calculateMembershipEndDate = (startDate: string | Date, packageType: 'weekly' | 'monthly' | 'three-months'): string => {
  const start = new Date(startDate);
  switch (packageType) {
    case 'weekly':
      start.setDate(start.getDate() + 7);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() + 1);
      break;
    case 'three-months':
      start.setMonth(start.getMonth() + 3);
      break;
  }
  return start.toISOString().split('T')[0];
};

/**
 * Calculate total cost of items in a list
 */
export const calculateTotalCost = (items: { price?: number | string; quantity?: number | string }[]): number => {
  return items.reduce((total, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
    const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 1);
    return total + (price * quantity);
  }, 0);
};

/**
 * Calculate profit margin percentage
 */
export const calculateProfitMargin = (revenue: number, expenses: number): number => {
  if (revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
};
