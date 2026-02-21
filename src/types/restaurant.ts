export interface MasterInventoryItem {
  id: string;
  name: string;
  default_unit_price?: number;
  unit?: string;
  created_at?: string;
}

export interface InventoryItem {
  master_item_id: string;
  item_name: string;
  quantity: string;
  price: string;
}

export interface RestaurantSale {
  id: string;
  date: string;
  item: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  expenses: number;
}