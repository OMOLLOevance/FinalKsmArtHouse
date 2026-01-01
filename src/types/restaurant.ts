export interface RestaurantSale {
  id: string;
  date: string;
  item: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  expenses?: number;
}
