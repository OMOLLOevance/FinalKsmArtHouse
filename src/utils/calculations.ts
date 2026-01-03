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
    // Parse price: default to 0 if invalid or empty
    const rawPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const price = (rawPrice === undefined || isNaN(rawPrice as number)) ? 0 : Number(rawPrice);
    
    // Parse quantity: default to 1 if invalid or empty
    const rawQty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
    const quantity = (rawQty === undefined || isNaN(rawQty as number)) ? 1 : Number(rawQty);
    
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
